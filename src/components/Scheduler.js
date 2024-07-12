import React, { useState, useEffect, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import styles from '../styles/scheduler.module.css';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path as necessary
import DraggableResizableBox from './DraggableResizeBox'; // Adjust the path as necessary
import { FaTrash } from 'react-icons/fa'; // Import the trash can icon from react-icons

const Scheduler = ({ data, documentId, onSwitchToVisualizer }) => {
    const moduleSchedule = data.ARINC_653_Module.Module_Schedule;

    const initialPartitionSchedule = Array.isArray(moduleSchedule.Partition_Schedule)
        ? moduleSchedule.Partition_Schedule
        : [moduleSchedule.Partition_Schedule];

    const [currentData, setCurrentData] = useState({
        ...moduleSchedule,
        Partition_Schedule: initialPartitionSchedule
    });

    const [colors, setColors] = useState({});
    const [multiCore, setMultiCore] = useState(parseInt(data.ARINC_653_Module.AIR_Configuration.RequiredCores) > 1);
    const [Core, setCore] = useState(parseInt(data.ARINC_653_Module.AIR_Configuration.RequiredCores));
    const [updatedData, setUpdatedData] = useState(initialPartitionSchedule);
    const [isModified, setIsModified] = useState(false); // Track if data has been modified
    const windowRef = useRef(null);

    useEffect(() => {
        // Initialize updatedData from currentData
        setUpdatedData(currentData.Partition_Schedule);
    }, [currentData]);

    // Function to generate random color with good contrast
    function getRandomColor() {
        const availableCharacters = '0123456789ABCDEF';
        const availableCharacterLength = availableCharacters.length;

        let color;
        do {
            color = '#';
            for (let i = 0; i < 6; i++) {
                color += availableCharacters[Math.floor(Math.random() * availableCharacterLength)];
            }
        } while (!isGoodContrast(color));

        return color;
    }

    // Function to check if a color has good contrast
    function isGoodContrast(hexColor) {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }

    // Generate colors for partitions
    useEffect(() => {
        const newColors = {};
        currentData.Partition_Schedule.forEach(item => {
            newColors[item.PartitionIdentifier] = getRandomColor();
        });
        setColors(newColors);
    }, [currentData]);

    const majorFrameSeconds = parseFloat(currentData.MajorFrameSeconds);
    const windowWidth = useRef(window.innerWidth * 0.8);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            windowWidth.current = window.innerWidth * 0.8;
            setUpdatedData([...updatedData]);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updatedData]);

    // Handle resize stop event for resizable box
    const handleResizeStop = (event, { size }, item) => {
        const newDuration = (size.width / windowWidth.current) * majorFrameSeconds;
        const newUpdatedData = updatedData.map(partition => {
            if (partition.PartitionIdentifier === item.PartitionIdentifier) {
                const updatedWindowSchedules = Array.isArray(partition.Window_Schedule)
                    ? partition.Window_Schedule.map(ws =>
                        ws.WindowIdentifier === item.Window_Schedule.WindowIdentifier
                            ? { ...ws, WindowDurationSeconds: newDuration.toFixed(4) }
                            : ws
                    )
                    : [{ ...partition.Window_Schedule, WindowDurationSeconds: newDuration.toFixed(4) }];
                
                return {
                    ...partition,
                    Window_Schedule: updatedWindowSchedules,
                    PeriodDurationSeconds: updatedWindowSchedules.reduce((sum, ws) => sum + parseFloat(ws.WindowDurationSeconds), 0).toFixed(4)
                };
            }
            return partition;
        });
    
        let cumulativeStart = 0;
        const reorderedData = newUpdatedData.map(partition => {
            const updatedPartition = {
                ...partition,
                Window_Schedule: Array.isArray(partition.Window_Schedule)
                    ? partition.Window_Schedule.map(ws => {
                        const updatedWs = {
                            ...ws,
                            WindowStartSeconds: Math.max(0, Math.min(cumulativeStart.toFixed(4), majorFrameSeconds - parseFloat(ws.WindowDurationSeconds)))
                        };
                        cumulativeStart += parseFloat(updatedWs.WindowDurationSeconds);
                        return updatedWs;
                    })
                    : [{ ...partition.Window_Schedule, WindowStartSeconds: Math.max(0, Math.min(cumulativeStart.toFixed(4), majorFrameSeconds - parseFloat(partition.PeriodDurationSeconds))) }]
            };
            cumulativeStart += parseFloat(partition.PeriodDurationSeconds);
            return updatedPartition;
        });
    
        setUpdatedData(reorderedData);
        setIsModified(true); // Mark as modified
    };

    // Handle change in window schedule fields
    const handleFieldChange = (field, newValue, item) => {
        const windowIdentifier = item.Window_Schedule.WindowIdentifier;
    
        let newFormattedValue = newValue;
        if (!isNaN(newValue) && field !== 'WindowIdentifier') {
            newFormattedValue = parseFloat(newValue).toFixed(4);
        }
    
        if (field === "WindowStartSeconds") {
            const newWindowStartSeconds = parseFloat(newValue);
            const windowDurationSeconds = parseFloat(item.Window_Schedule.WindowDurationSeconds);
            if (newWindowStartSeconds + windowDurationSeconds > majorFrameSeconds) {
                alert("The sum of Window Start Seconds and Window Duration Seconds cannot exceed Major Frame Seconds.");
                return;
            }
        }
    
        if (field === "WindowDurationSeconds") {
            const newWindowDurationSeconds = parseFloat(newValue);
            const windowStartSeconds = parseFloat(item.Window_Schedule.WindowStartSeconds);
            if (windowStartSeconds + newWindowDurationSeconds > majorFrameSeconds) {
                alert("The sum of Window Start Seconds and Window Duration Seconds cannot exceed Major Frame Seconds.");
                return;
            }
        }
    
        const newUpdatedData = updatedData.map(partition =>
            partition.PartitionIdentifier === item.PartitionIdentifier
                ? {
                    ...partition,
                    Window_Schedule: Array.isArray(partition.Window_Schedule)
                        ? partition.Window_Schedule.map(ws =>
                            ws.WindowIdentifier === windowIdentifier
                                ? { ...ws, [field]: newFormattedValue }
                                : ws
                        )
                        : [{ ...partition.Window_Schedule, [field]: newFormattedValue }]
                }
                : partition
        );
    
        setUpdatedData(newUpdatedData);
        setIsModified(true); // Mark as modified
    };
    

    // Handle core change in window schedule
    const handleCoreChange = (e, item) => {
        const newCore = e.target.value;
        const windowIdentifier = item.Window_Schedule.WindowIdentifier;

        const newUpdatedData = updatedData.map(partition =>
            partition.PartitionIdentifier === item.PartitionIdentifier
                ? {
                    ...partition,
                    WindowConfiguration: Array.isArray(partition.WindowConfiguration)
                        ? partition.WindowConfiguration.map(config =>
                            config.WindowIdentifier === windowIdentifier
                                ? { ...config, Cores: newCore }
                                : config
                        )
                        : [{ ...partition.WindowConfiguration, Cores: newCore }]
                }
                : partition
        );

        setUpdatedData(newUpdatedData);
        setIsModified(true); // Mark as modified
    };

    const generateUniqueIdentifier = () => {
        return `id_${Math.random().toString(36).substr(2, 9)}`;
    };

    const splitWindowSchedule = (partitionId, windowScheduleId) => {
        const newUpdatedData = updatedData.map(partition => {
            if (partition.PartitionIdentifier === partitionId) {
                const isWindowScheduleArray = Array.isArray(partition.Window_Schedule);
                const newWindowSchedules = isWindowScheduleArray
                    ? partition.Window_Schedule.flatMap((ws, index) => {
                        if (ws.WindowIdentifier === windowScheduleId) {
                            const originalDuration = parseFloat(ws.WindowDurationSeconds);
                            const newDuration = (originalDuration / 2).toFixed(4);
                            const newIdentifier = `${partition.Window_Schedule.length + 1}`;

                            return [
                                { ...ws, WindowDurationSeconds: newDuration },
                                {
                                    ...ws,
                                    WindowIdentifier: newIdentifier,
                                    WindowDurationSeconds: newDuration,
                                    WindowStartSeconds: (parseFloat(ws.WindowStartSeconds) + parseFloat(newDuration)).toFixed(4)
                                }
                            ];
                        }
                        return ws;
                    })
                    : [
                        {
                            ...partition.Window_Schedule,
                            WindowDurationSeconds: (parseFloat(partition.Window_Schedule.WindowDurationSeconds) / 2).toFixed(4)
                        },
                        {
                            ...partition.Window_Schedule,
                            WindowIdentifier: "2",
                            WindowDurationSeconds: (parseFloat(partition.Window_Schedule.WindowDurationSeconds) / 2).toFixed(4),
                            WindowStartSeconds: (parseFloat(partition.Window_Schedule.WindowStartSeconds) + parseFloat(partition.Window_Schedule.WindowDurationSeconds) / 2).toFixed(4)
                        }
                    ];

                const isWindowConfigurationArray = Array.isArray(partition.WindowConfiguration);
                const newWindowConfigurations = isWindowConfigurationArray
                    ? partition.WindowConfiguration.flatMap((config) => {
                        if (config.WindowIdentifier === windowScheduleId) {
                            return [
                                config,
                                {
                                    ...config,
                                    WindowIdentifier: `${partition.Window_Schedule.length + 1}`
                                }
                            ];
                        }
                        return config;
                    })
                    : [
                        partition.WindowConfiguration,
                        {
                            ...partition.WindowConfiguration,
                            WindowIdentifier: "2"
                        }
                    ];

                return {
                    ...partition,
                    Window_Schedule: newWindowSchedules,
                    WindowConfiguration: newWindowConfigurations
                };
            }
            return partition;
        });

        setUpdatedData(newUpdatedData);
        setIsModified(true); // Mark as modified
    };

    const addCore = () => {
        const newCoreCount = Core + 1;
        setCore(newCoreCount);
        setMultiCore(newCoreCount > 1);
        setCurrentData(prevData => ({
            ...prevData,
            AIR_Configuration: {
                ...prevData.AIR_Configuration,
                RequiredCores: newCoreCount.toString()
            }
        }));
        setIsModified(true); // Mark as modified
    };

    const deleteCore = (coreIndex) => {
        const newCoreCount = Core - 1;
        if (newCoreCount >= 1) {
            setCore(newCoreCount);
            setMultiCore(newCoreCount > 1);
            setCurrentData(prevData => ({
                ...prevData,
                AIR_Configuration: {
                    ...prevData.AIR_Configuration,
                    RequiredCores: newCoreCount.toString()
                }
            }));
            setIsModified(true); // Mark as modified
        }
    };

    const checkForOverlaps = () => {
        for (let coreIndex = 0; coreIndex < Core; coreIndex++) {
            const corePartitions = updatedData.flatMap(partition => {
                const windowSchedules = Array.isArray(partition.Window_Schedule) ? partition.Window_Schedule : [partition.Window_Schedule];
                return windowSchedules.filter(ws => {
                    const windowConfig = Array.isArray(partition.WindowConfiguration)
                        ? partition.WindowConfiguration.find(config => config.WindowIdentifier === ws.WindowIdentifier)
                        : partition.WindowConfiguration;
                    return windowConfig && parseInt(windowConfig.Cores) === coreIndex;
                }).map(ws => ({
                    start: parseFloat(ws.WindowStartSeconds),
                    end: parseFloat(ws.WindowStartSeconds) + parseFloat(ws.WindowDurationSeconds),
                    partition: partition.PartitionName
                }));
            });

            corePartitions.sort((a, b) => a.start - b.start);

            for (let i = 0; i < corePartitions.length - 1; i++) {
                if (corePartitions[i].end > corePartitions[i + 1].start) {
                    alert(`Overlap detected between partitions ${corePartitions[i].partition} and ${corePartitions[i + 1].partition} on core ${coreIndex}.`);
                    return true;
                }
            }
        }
        return false;
    };

    // Update Firebase with the latest data
    const updateFirebase = async () => {
        if (checkForOverlaps()) {
            return;
        }

        await setDoc(doc(db, 'Configurations', documentId), {
            ...data, // Ensure to update the entire document structure as needed
            ARINC_653_Module: {
                ...data.ARINC_653_Module,
                Module_Schedule: {
                    ...data.ARINC_653_Module.Module_Schedule,
                    Partition_Schedule: updatedData,
                },
                AIR_Configuration: {
                    ...data.ARINC_653_Module.AIR_Configuration,
                    RequiredCores: Core.toString()
                }
            },
        });
        setIsModified(false); // Mark as not modified after save
    };

    // Define the order of fields to display
    const fieldOrder = [
        'WindowStartSeconds',
        'WindowDurationSeconds',
        'WindowIdentifier',
        'PartitionPeriodStart'
    ];

    // Calculate max constraints for resizable box
    const getMaxConstraints = (item) => {
        const otherDurations = updatedData
            .filter(partition => partition.PartitionIdentifier !== item.PartitionIdentifier)
            .reduce((sum, partition) => sum + (Array.isArray(partition.Window_Schedule)
                ? partition.Window_Schedule.reduce((sumWs, ws) => sumWs + parseFloat(ws.WindowDurationSeconds), 0)
                : parseFloat(partition.Window_Schedule.WindowDurationSeconds)), 0);
        const remainingTime = majorFrameSeconds - otherDurations;
        return [(remainingTime / majorFrameSeconds) * windowWidth.current, 50];
    };

    return (
        <div className={styles.container}>
            <div className={styles.scheduler}>
                <div className={styles.header}>
                    <h1>
                        Window Scheduler: {currentData.ScheduleName}
                    </h1>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <button onClick={addCore} className={styles.saveButton}>Add Core</button>
                        <button onClick={updateFirebase} className={styles.saveButton}>Save</button>
                    </div>
                </div>
            </div>
            {
                Array.from({ length: Core }, (_, coreIndex) => (
                    <div key={coreIndex} className={styles.schedulingCompo}>
                        <div className={styles.coreTitle}>
                            <div>Core {coreIndex} </div>
                        </div>
                        <div className={styles.coreDe}>
                            <FaTrash onClick={() => deleteCore(coreIndex)} className={styles.deleteIcon} />
                        </div>
                        <div className={styles.partitionsWindow} ref={windowRef} style={{ width: `${windowWidth.current}px`, position: 'relative' }}>
                            {updatedData.map((partition, partitionIndex) => {
                                const windowSchedules = Array.isArray(partition.Window_Schedule)
                                    ? partition.Window_Schedule
                                    : [partition.Window_Schedule];
                                return windowSchedules.map((windowSchedule, windowIndex) => {
                                    const windowConfig = Array.isArray(partition.WindowConfiguration)
                                        ? partition.WindowConfiguration.find(config => config.WindowIdentifier === windowSchedule.WindowIdentifier)
                                        : partition.WindowConfiguration;
                                    if (windowConfig && parseInt(windowConfig.Cores) === coreIndex) {
                                        const startSeconds = parseFloat(windowSchedule.WindowStartSeconds);
                                        const durationSeconds = parseFloat(windowSchedule.WindowDurationSeconds);
                                        const left = (startSeconds / majorFrameSeconds) * windowWidth.current;
                                        const width = (durationSeconds / majorFrameSeconds) * windowWidth.current;
                                        const maxConstraints = getMaxConstraints(partition);

                                        return (
                                            <>
                                                <DraggableResizableBox
                                                    key={`${partition.PartitionIdentifier}-${windowSchedule.WindowIdentifier}`}
                                                    item={{ PartitionIdentifier: partition.PartitionIdentifier, Window_Schedule: windowSchedule }}
                                                    width={width}
                                                    height={50}
                                                    minConstraints={[1, 50]}
                                                    maxConstraints={maxConstraints}
                                                    onResizeStop={(e, data) => handleResizeStop(e, data, { PartitionIdentifier: partition.PartitionIdentifier, Window_Schedule: windowSchedule })}
                                                    left={left}
                                                    handleFieldChange={handleFieldChange}
                                                    windowSchedule={windowSchedule}
                                                    majorFrameSeconds={majorFrameSeconds}
                                                >
                                                    <div
                                                        style={{
                                                            backgroundColor: colors[partition.PartitionIdentifier],
                                                            height: "100%",
                                                            borderRadius: "6px"
                                                        }}
                                                    >
                                                        <h3 style={{ height: "100%", margin: 0, padding: 0, color: '#fff', display: "flex", alignItems: 'center', justifyContent: "center" }}>{partition.PartitionName}</h3>
                                                    </div>
                                                </DraggableResizableBox>
                                            </>
                                        );
                                    }
                                });
                            })}
                        </div>
                        <div className={styles.timeLabels}>
                            <div className={styles.endTime}>
                                {majorFrameSeconds}s
                            </div>
                            {updatedData.map((partition, partitionIndex) => {
                                const windowSchedules = Array.isArray(partition.Window_Schedule)
                                    ? partition.Window_Schedule
                                    : [partition.Window_Schedule];
                                return windowSchedules.map((windowSchedule, windowIndex) => {
                                    const windowConfig = Array.isArray(partition.WindowConfiguration)
                                        ? partition.WindowConfiguration.find(config => config.WindowIdentifier === windowSchedule.WindowIdentifier)
                                        : partition.WindowConfiguration;
                                    if (windowConfig && parseInt(windowConfig.Cores) === coreIndex) {
                                        const startSeconds = parseFloat(windowSchedule.WindowStartSeconds);
                                        const durationSeconds = parseFloat(windowSchedule.WindowDurationSeconds);
                                        const left = (startSeconds / majorFrameSeconds) * windowWidth.current;
                                        const width = (durationSeconds / majorFrameSeconds) * windowWidth.current;

                                        return (
                                            <React.Fragment key={`${partition.PartitionIdentifier}-${windowSchedule.WindowIdentifier}-time`}>
                                                <div className={styles.startTime} style={{ left: left }}>
                                                    {startSeconds.toFixed(2)}s
                                                </div>
                                                {(startSeconds + durationSeconds) < majorFrameSeconds ?
                                                    <div className={styles.startTime} style={{ left: left + width }}>
                                                        {(startSeconds + durationSeconds).toFixed(2)}s
                                                    </div>
                                                    : null}
                                            </React.Fragment>
                                        );
                                    }
                                });
                            })}
                        </div>
                    </div>
                ))
            }
            <div className={styles.scheduler2}>
                <div className={styles.header2}>
                    <h1>
                        Schedule Module: {currentData.ScheduleName}
                    </h1>
                </div>
            </div>
            <div className={styles.partitions}>
                {updatedData.map((partition, partitionIndex) => {
                    const windowSchedules = Array.isArray(partition.Window_Schedule)
                        ? partition.Window_Schedule
                        : [partition.Window_Schedule];
                    return windowSchedules.map((windowSchedule, windowIndex) => {
                        const windowConfig = Array.isArray(partition.WindowConfiguration)
                            ? partition.WindowConfiguration.find(config => config.WindowIdentifier === windowSchedule.WindowIdentifier)
                            : partition.WindowConfiguration;
                        const startSeconds = parseFloat(windowSchedule.WindowStartSeconds);
                        const durationSeconds = parseFloat(windowSchedule.WindowDurationSeconds);
                        const left = (startSeconds / majorFrameSeconds) * windowWidth.current;
                        const width = (durationSeconds / majorFrameSeconds) * windowWidth.current;
                        const maxConstraints = getMaxConstraints(partition);

                        return (
                            <div key={`${partition.PartitionIdentifier}-${windowSchedule.WindowIdentifier}`} className={styles.partition} style={{ backgroundColor: colors[partition.PartitionIdentifier] }}>
                                <h3>{partition.PartitionName}</h3>
                                <h3>id {windowSchedule.WindowIdentifier}</h3>
                                {multiCore ?
                                    <div className={styles.fieldPartCore}>
                                        Core
                                        <select
                                            value={windowConfig ? windowConfig.Cores : 'N/A'}
                                            onChange={(e) => handleCoreChange(e, { PartitionIdentifier: partition.PartitionIdentifier, Window_Schedule: windowSchedule })}
                                        >
                                            {Array.from({ length: Core }, (_, i) => (
                                                <option key={i} value={i}>{i}</option>
                                            ))}
                                        </select>
                                    </div>
                                    : null}
                                {fieldOrder.map((field) => (
                                    <div key={field} className={styles.fieldPart}>
                                        {field}
                                        <input
                                            type={field.includes('Seconds') ? 'number' : 'text'}
                                            value={windowSchedule[field]}
                                            step="0.0001"
                                            onChange={(e) => handleFieldChange(field, e.target.value, { PartitionIdentifier: partition.PartitionIdentifier, Window_Schedule: windowSchedule })}
                                            style={{ width: '80px' }}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => splitWindowSchedule(partition.PartitionIdentifier, windowSchedule.WindowIdentifier)}>Split</button>
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default Scheduler;
