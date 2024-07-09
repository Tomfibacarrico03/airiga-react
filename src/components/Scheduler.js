import React, { useState, useEffect, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import styles from '../styles/scheduler.module.css';

const Scheduler = ({ data }) => {
    const moduleSchedule = data.ARINC_653_Module.Module_Schedule;

    // Ensure Partition_Schedule is always an array
    const initialPartitionSchedule = Array.isArray(moduleSchedule.Partition_Schedule)
        ? moduleSchedule.Partition_Schedule
        : [moduleSchedule.Partition_Schedule];

    const [currentData, setCurrentData] = useState({
        ...moduleSchedule,
        Partition_Schedule: initialPartitionSchedule
    }); const [colors, setColors] = useState({});
    const [updatedData, setUpdatedData] = useState(Array.isArray(currentData.Partition_Schedule) ? currentData.Partition_Schedule : [currentData.Partition_Schedule]);
    const windowRef = useRef(null);

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

    function isGoodContrast(hexColor) {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }

    useEffect(() => {
        const newColors = {};
        currentData.Partition_Schedule.forEach(item => {
            newColors[item.PartitionIdentifier] = getRandomColor();
        });
        setColors(newColors);
    }, [currentData]);

    const majorFrameSeconds = parseFloat(currentData.MajorFrameSeconds);
    const windowWidth = useRef(window.innerWidth * 0.8);

    useEffect(() => {
        const handleResize = () => {
            windowWidth.current = window.innerWidth * 0.8;
            setUpdatedData([...updatedData]); // Force re-render to apply new width
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updatedData]);

    const handleResizeStop = (event, { size }, item) => {
        const newDuration = (size.width / windowWidth.current) * majorFrameSeconds;

        const totalDuration = updatedData.reduce((sum, partition) => {
            return sum + (partition.PartitionIdentifier === item.PartitionIdentifier ? newDuration : parseFloat(partition.Window_Schedule.WindowDurationSeconds));
        }, 0);

        if (totalDuration <= majorFrameSeconds) {
            const newStartSeconds = (event.clientX / windowWidth.current) * majorFrameSeconds;

            setUpdatedData(prevState =>
                prevState.map(partition =>
                    partition.PartitionIdentifier === item.PartitionIdentifier
                        ? {
                            ...partition,
                            PeriodDurationSeconds: newDuration.toFixed(4),
                            Window_Schedule: {
                                ...partition.Window_Schedule,
                                WindowDurationSeconds: newDuration.toFixed(4),
                                WindowStartSeconds: newStartSeconds.toFixed(4)

                            }
                        }
                        : partition
                )
            );
        }
    };

    const getMaxConstraints = (item) => {
        const otherDurations = updatedData
            .filter(partition => partition.PartitionIdentifier !== item.PartitionIdentifier)
            .reduce((sum, partition) => sum + parseFloat(partition.Window_Schedule.WindowDurationSeconds), 0);
        const remainingTime = majorFrameSeconds - otherDurations;
        return [(remainingTime / majorFrameSeconds) * windowWidth.current, 50];
    };

    return (
        <div style={{ width: "100%", gap: "20px", flexDirection: "column", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className={styles.scheduler}>
                <div className={styles.header}>
                    <h1>
                        Schedule Module: {currentData.ScheduleName}
                    </h1>
                </div>
            </div>
            <div className={styles.partitions}>
                {updatedData.map((item) => {
                    return (
                        <div key={item.PartitionIdentifier} className={styles.partition} style={{ backgroundColor: colors[item.PartitionIdentifier] }}>
                            <h3>{item.PartitionName}</h3>
                            <div>Id: {item.PartitionIdentifier}</div>
                            <div>Id: {item.Window_Schedule.WindowStartSeconds}</div>
                            <div>Period duration: {Number(item.PeriodDurationSeconds).toFixed(1)} sec</div>
                            <div>Period seconds: {Number(item.PeriodSeconds).toFixed(1)} sec</div>
                        </div>
                    )
                })}
            </div>
            <div className={styles.scheduler2}>
                <div className={styles.header2}>
                    <h1>
                        Window Scheduler: {currentData.ScheduleName}
                    </h1>
                </div>
            </div>
            <div className={styles.schedulingCompo}>
                <div className={styles.partitionsWindow} ref={windowRef} style={{ width: `${windowWidth.current}px`, position: 'relative', border: '1px solid #000', height: '50px' }}>
                    {updatedData.map((item) => {
                        const startSeconds = parseFloat(item.Window_Schedule.WindowStartSeconds);
                        const durationSeconds = parseFloat(item.Window_Schedule.WindowDurationSeconds);
                        const left = (startSeconds / majorFrameSeconds) * windowWidth.current;
                        const width = (durationSeconds / majorFrameSeconds) * windowWidth.current;
                        const maxConstraints = getMaxConstraints(item);
                        return (
                            <ResizableBox
                                key={item.PartitionIdentifier}
                                className={styles.WindowPartition}
                                width={width}
                                height={50}
                                axis="x"
                                resizeHandles={['e']}
                                onResizeStop={(e, data) => handleResizeStop(e, data, item)}
                                minConstraints={[1, 50]}
                                maxConstraints={maxConstraints}
                            >
                                <div
                                    style={{
                                        backgroundColor: colors[item.PartitionIdentifier]
                                    }}
                                >
                                    <h3 style={{ margin: 0, padding: '5px', color: '#fff' }}>{item.PartitionName}</h3>
                                </div>
                            </ResizableBox>
                        )
                    })}
                </div>
                <div style={{width:"100%", display:'flex'}}>
                    {updatedData.map((item) => {
                        const startSeconds = parseFloat(item.Window_Schedule.WindowStartSeconds);
                        const durationSeconds = parseFloat(item.Window_Schedule.WindowDurationSeconds);
                        const left = (startSeconds / majorFrameSeconds) * windowWidth.current;
                        const width = (durationSeconds / majorFrameSeconds) * windowWidth.current;
                        return (
                            <div style={{left: left, position:"relative", width:"fit-content",color:"rgb(143 143 143)"}}> 
                            {startSeconds}
                            </div>
                        )
                    })}
                </div>

            </div>

        </div>
    );
};

export default Scheduler;
