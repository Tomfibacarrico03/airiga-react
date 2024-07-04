import React, { useState, useRef } from "react";
import style from "../styles/popup.module.css";
import xmllogo from "../images/xml-svgrepo-com.png";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import xml2js from "xml2js"; // Import xml2js for XML to JSON conversion

const Popup = ({ show, onClose }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const [archName, setArchName] = useState(""); // State for architecture name

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (file != null) {
            const xml = await file.text(); // Read the file content as text
            const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, mergeAttrs: true});
            parser.parseString(xml, async (err, result) => {
                if (err) {
                    console.error("Error parsing XML:", err);
                } else {
                    console.log("XML to JSON:", result);
                    const jsonData = { ...result, archName }; // Add archName to JSON data
                    await storeJsonInFirestore(jsonData, "Configurations");
                }
            });
            console.log(xml);

            console.log("File selected:", file);
        } else {

        }
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
                        <label>Name</label>
                        <input
                            type="text"
                            id="name"
                            value={archName}
                            onChange={handleArchNameChange} // Update architecture name state
                        />  
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
                            <button type="submit" className={style.startButton}>
                                Start New Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Popup;
