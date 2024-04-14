import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import styles from "../styles/arch.module.css";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

const BSP = () => {
  const { bspId } = useParams(); // This hook gives you access to the parameters of the current route
  const navigate = useNavigate();

  const [name, setName] = useState("BSP");
  const [simulator, setSimulator] = useState("SIM1");
  const [remoteMachineIP, setRemoteMachineIP] = useState("");
  const [remoteMachineUsername, setRemoteMachineUsername] = useState("");
  const [password, setPassword] = useState("");
  const [boardIP, setBoardIP] = useState("");
  const [port, setPort] = useState("");

  useEffect(() => {
    // Fetch the architecture data when the component mounts and when the id changes
    const fetchBSPData = async () => {
      const docRef = doc(db, "BSP", bspId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setSimulator(data.simulator);
          setRemoteMachineIP(data.remoteMachineIP);
          setRemoteMachineUsername(data.remoteMachineUsername);
          setPassword(data.password);
          setBoardIP(data.boardIP);
          setPort(data.port);
        } else {
          console.log("No such document!");
        }
      } catch (e) {
        console.error("Error fetching document: ", e);
      }
    };

    if (bspId !== undefined) {
      fetchBSPData();
    }
  }, [bspId]);
  const handleSimulatorChange = (e) => {
    setSimulator(e.target.value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const bspData = {
      name,
      simulator,
      remoteMachineIP,
      remoteMachineUsername,
      password,
      boardIP,
      port,
    };

    if (bspId) {
      await updateDoc(doc(db, "BSP", bspId), bspData);
    }
    window.location.reload();
  };
  const handleDelete = async () => {
    const docRef = doc(db, "BSP", bspId);
    try {
      await deleteDoc(docRef);
      console.log("Document successfully deleted!");
      // Redirect the user after successful deletion
      // Replace '/' with the path to your desired page after deletion
      window.location.href = "/";
    } catch (e) {
      console.error("Error removing document: ", e);
    }
  };
  const createApplication = async () => {
    const defaultData = {
      bspId: bspId,
      name: "Application",
      Version: "",
      tickesPerSecond: "NA",
      requiredCores: "NA",
      moduleType: "",
    };

    try {
      if (!bspId) throw new Error("BSP ID is undefined.");
      const appDocRef = await addDoc(
        collection(db, "Application"),
        defaultData
      );

      navigate("/Application/" + appDocRef.id);
      console.log("Application created with ID: ", appDocRef.id);
    } catch (e) {
      console.error("Error adding Application: ", e);
    }
  };
  return (
    <div className={styles.splitWindow}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">BSP name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Simulator</label>
          <select value={simulator} onChange={handleSimulatorChange}>
            <option value="Board">Board</option>
            <option value="SIM1">SIM1</option>
            <option value="SIM2">SIM2</option>
            <option value="SIM3">SIM3</option>
          </select>
        </div>
        {simulator == "Board" ? (
          <>
            <div className={styles.flexRow}>
              <div className={styles.field}>
                <label>Remote Machine IP</label>
                <input
                  id="remoteMachineIP"
                  type="text"
                  value={remoteMachineIP}
                  onChange={(e) => setRemoteMachineIP(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>Remote Machine Username</label>
                <input
                  id="remoteMachineUsername"
                  type="text"
                  value={remoteMachineUsername}
                  onChange={(e) => setRemoteMachineUsername(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input
                id="remoteMachineUsername"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className={styles.flexRow}>
              <div className={styles.field}>
                <label>Board IP</label>
                <input
                  id="remoteMachineIP"
                  type="text"
                  value={boardIP}
                  onChange={(e) => setBoardIP(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>Port</label>
                <input
                  id="remoteMachineUsername"
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}
        <div className={styles.submit}>
          {bspId !== undefined ? (
            <>
              <button type="submit">Update</button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button type="submit">Create architecture</button>
            </>
          )}
        </div>
      </form>
      <div className={styles.options}>
        <div className={styles.option} onClick={createApplication}>
          Create new application
        </div>
        <div className={styles.option}>
          Load existing application configuration
        </div>
      </div>
    </div>
  );
};

export default BSP;
