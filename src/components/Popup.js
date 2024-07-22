import React, { useState, useRef } from "react";
import style from "../styles/popup.module.css";
import xmllogo from "../images/xml-svgrepo-com.png";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import xml2js from "xml2js"; // Import xml2js for XML to JSON conversion
import defaultXMLPath from "../lib/config.xml"; // Import the default XML file

const Popup = ({ show, onClose }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const [archName, setArchName] = useState(""); // State for architecture name
    const [architectureType, setArchitectureType] = useState("ARM");
    const [targetBoard, setTargetBoard] = useState("");
    const [fpu, setFpu] = useState("Enabled");
    const [debugMonitor, setDebugMonitor] = useState("GRMON");
    const [installRTOS, setInstallRTOS] = useState("No");
    const [posixRtems5, setPosixRtems5] = useState(false);
    const [rtems5, setRtems5] = useState(false);
    const [bare, setBare] = useState(false);
    const [rtems48i, setRtems48i] = useState(false);

    const TARGET_BSP_OPTS_0 = ["zynq_main_board", "zynqz1"];
    const TARGET_BSP_OPTS_1 = ["laysim_gr740", "leon3_or_tsim2", "tsim", "leon4"];
    const DEBUG_OPTS = ["GRMON", "DMON", "NONE"];

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const fetchDefaultXML = async () => {
        const response = await fetch(defaultXMLPath);
        if (!response.ok) {
            throw new Error("Failed to fetch default XML");
        }
        return response.text();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = {
            archName,
            architectureType,
            targetBoard,
            fpu,
            debugMonitor,
            installRTOS,
            posixRtems5,
            rtems5,
            bare,
            rtems48i,
        };

        const xmlContent = file ? await file.text() : await fetchDefaultXML();

        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, mergeAttrs: true });
        parser.parseString(xmlContent, async (err, result) => {
            if (err) {
                console.error("Error parsing XML:", err);
            } else {
                console.log("XML to JSON:", result);
                const jsonData = { ...result, ...formData }; // Add formData to JSON data
                await storeJsonInFirestore(jsonData, "Configurations");
                window.location.reload(); // Reload the page after storing data
            }
        });
    };

    const handleZoneClick = () => {
        fileInputRef.current.click();
    };

    if (!show) {
        return null;
    }

    async function storeJsonInFirestore(jsonData, collectionName) {
        try {
            const collectionRef = collection(db, collectionName);
            await addDoc(collectionRef, jsonData);
            console.log('JSON data stored successfully in Firestore!');
        } catch (error) {
            console.error('Error storing JSON data in Firestore:', error);
        }
    }

    const handleArchNameChange = (e) => {
        setArchName(e.target.value);
    };

    const handleArchitectureChange = (e) => {
        setArchitectureType(e.target.value);
        setTargetBoard(e.target.value === "ARM" ? TARGET_BSP_OPTS_0[0] : TARGET_BSP_OPTS_1[0]);
    };

    const handleInstallRTOSChange = (e) => {
        setInstallRTOS(e.target.value);
        if (e.target.value !== "No") {
            setPosixRtems5(false);
            setRtems5(false);
            setRtems48i(false);
            setBare(false);
        }
    };

    const nextStep = () => {
        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    return (
        <div className={style.popupOverlay}>
            <div className={style.popupContainer}>
                <div className={style.popupHeader}>
                    <h2>Start Configuration</h2>
                    <button className={style.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className={style.popupContent}>
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <>
                                <label>Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={archName}
                                    onChange={handleArchNameChange} // Update architecture name state
                                />
                                <div className={style.formGroup}>
                                    <button type="button" className={style.submitButton} onClick={nextStep}>
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <label>Architecture Type</label>
                                <select value={architectureType} onChange={handleArchitectureChange}>
                                    <option value="ARM">ARM</option>
                                    <option value="SPARC">SPARC</option>
                                </select>
                                <label>Target Board Support Package</label>
                                <select value={targetBoard} onChange={(e) => setTargetBoard(e.target.value)}>
                                    {architectureType === "ARM"
                                        ? TARGET_BSP_OPTS_0.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))
                                        : TARGET_BSP_OPTS_1.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                </select>
                                <label>FPU</label>
                                <select value={fpu} onChange={(e) => setFpu(e.target.value)}>
                                    <option value="Enabled">Enabled</option>
                                    <option value="Disabled">Disabled</option>
                                </select>
                                {architectureType === "ARM" ? null : (
                                    <div className={style.field}>
                                        <label>Debug Monitor</label>
                                        <select value={debugMonitor} onChange={(e) => setDebugMonitor(e.target.value)}>
                                            {DEBUG_OPTS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <label>Install all RTOS?</label>
                                <select value={installRTOS} onChange={handleInstallRTOSChange}>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <label>
                                    <input
                                        type="checkbox"
                                        disabled={installRTOS !== "No"}
                                        checked={posixRtems5}
                                        onChange={(e) => setPosixRtems5(e.target.checked)}
                                    />
                                    posixrtems5
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        disabled={installRTOS !== "No"}
                                        checked={rtems5}
                                        onChange={(e) => setRtems5(e.target.checked)}
                                    />
                                    rtems5
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        disabled={installRTOS !== "No"}
                                        checked={bare}
                                        onChange={(e) => setBare(e.target.checked)}
                                    />
                                    bare
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        disabled={installRTOS !== "No"}
                                        checked={rtems48i}
                                        onChange={(e) => setRtems48i(e.target.checked)}
                                    />
                                    rtems48i
                                </label>
                                <div className={style.formGroup}>
                                    <button type="button" className={style.submitButton} onClick={prevStep}>
                                        Previous
                                    </button>
                                    <button type="button" className={style.submitButton} onClick={nextStep}>
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <label>Select a XML: (optional)</label>
                                <div
                                    className={`${style.formGroup} ${style.dropZone} ${dragOver ? style.dragOver : ""}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={handleZoneClick}
                                >
                                    <input
                                        type="file"
                                        id="xmlFile"
                                        accept=".xml"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                    />
                                    <img src={xmllogo} style={{ width: "50px" }} alt="Logo" />
                                    {file ? (
                                        <p>{file.name}</p>
                                    ) : (
                                        <p>Drag and drop XML or click to upload</p>
                                    )}
                                </div>
                                <div className={style.formGroup}>
                                    <button type="button" className={style.submitButton} onClick={prevStep}>
                                        Previous
                                    </button>
                                    <button type="submit" className={style.startButton}>
                                        Start New Configuration
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Popup;
