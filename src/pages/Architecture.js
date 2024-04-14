import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import styles from "../styles/arch.module.css";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

const Architecture = () => {
  const { id } = useParams(); // This hook gives you access to the parameters of the current route
  const navigate = useNavigate();

  const [name, setName] = useState("Architecture");
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

  useEffect(() => {
    // Fetch the architecture data when the component mounts and when the id changes
    const fetchArchitectureData = async () => {
      const docRef = doc(db, "architectures", id);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setArchitectureType(data.architectureType);
          setTargetBoard(data.targetBoard);
          setFpu(data.fpu);
          setDebugMonitor(data.debugMonitor);
          setInstallRTOS(data.installRTOS);
          setPosixRtems5(data.posixRtems5);
          setRtems5(data.rtems5);
          setBare(data.bare);
          setRtems48i(data.rtems48i);
        } else {
          console.log("No such document!");
        }
      } catch (e) {
        console.error("Error fetching document: ", e);
      }
    };

    if (id !== undefined) {
      fetchArchitectureData();
    }
  }, [id]);
  useEffect(() => {
    if (architectureType === "ARM") {
      setTargetBoard(TARGET_BSP_OPTS_0[0]);
    } else if (architectureType === "SPARC") {
      setTargetBoard(TARGET_BSP_OPTS_1[0]);
    }
  }, [architectureType]);

  useEffect(() => {
    if (installRTOS !== "No") {
      setPosixRtems5(false);
      setRtems5(false);
      setRtems48i(false);
      setBare(false);
    }
  }, [installRTOS]);

  const handleArchitectureChange = (e) => {
    setArchitectureType(e.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = {
      name,
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
    if (id) {
      const docRef = doc(db, "architectures", id);
      try {
        await updateDoc(docRef, formData);
        console.log("Document updated with ID: ", id);
      } catch (e) {
        console.error("Error updating document: ", e);
      }
    } else {
      try {
        // Reference to the Firestore collection
        const docRef = await addDoc(collection(db, "architectures"), formData);
        console.log("Document written with ID: ", docRef.id);
        navigate("/Architecture/" + docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    window.location.reload();
  };
  const handleDelete = async () => {
    const docRef = doc(db, "architectures", id);
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
  const handleAddBSP = async () => {
    // Define the default BSP data structure here. This can be an empty BSP or with default values.
    const defaultBSPData = {
      name: "BSP",
      simulator: "SIM1",
      remoteMachineIP: "NA",
      remoteMachineUsername: "NA",
      password: "", // Use caution with storing passwords
      boardIP: "NA",
      port: "NA",
      architectureId: id, // Associate the BSP with the current architecture
    };

    try {
      if (!id) throw new Error("Architecture ID is undefined.");
      const bspDocRef = await addDoc(collection(db, "BSP"), defaultBSPData);

      navigate("/BSP/" + bspDocRef.id);
      console.log("BSP created with ID: ", bspDocRef.id);
    } catch (e) {
      console.error("Error adding BSP: ", e);
    }
  };

  return (
    <div className={styles.splitWindow}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Architecture type</label>
          <select value={architectureType} onChange={handleArchitectureChange}>
            <option value="ARM">ARM</option>
            <option value="SPARC">SPARC</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Target Board Support Package</label>
          <select
            value={targetBoard}
            onChange={(e) => setTargetBoard(e.target.value)}
          >
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
        </div>
        <div className={styles.flexRow}>
          <div className={styles.field}>
            <label>FPU</label>
            <select value={fpu} onChange={(e) => setFpu(e.target.value)}>
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          {architectureType === "ARM" ? null : (
            <div className={styles.field}>
              <label>Debug Monitor</label>
              <select
                value={debugMonitor}
                onChange={(e) => setDebugMonitor(e.target.value)}
              >
                {DEBUG_OPTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label>Install all RTOS?</label>
          <select
            value={installRTOS}
            onChange={(e) => setInstallRTOS(e.target.value)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.checkboxes}>
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
        </div>
        <div className={styles.submit}>
          {id !== undefined ? (
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
      {id !== undefined ? (
        <div className={styles.options}>
          <div onClick={handleAddBSP} className={styles.option}>
            Add Board Support Package
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Architecture;
