import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import style from "../styles/home.module.css";
import { Link } from "react-router-dom";
import Popup from "../components/Popup";

const Home = () => {
  const [architectures, setArchitectures] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchArchitectures = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Configurations"));
        const architecturesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setArchitectures(architecturesData);
      } catch (e) {
        console.error("Error loading architectures: ", e);
      }
    };

    fetchArchitectures();
  }, []);
  const handleNewButtonClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };
  return (
    <div className={style.tableContainer}>
      
      <div className={style.headButtons}>

      <button className={style.addNew} onClick={handleNewButtonClick}>
          New
        </button>      </div>
      <table className={style.architecturesTable}>
        <thead>
          <tr>
            <th><p>Name</p></th>
            <th><p>Id</p></th>
            <th><p>Created on</p></th>
            <th><p>Last Update</p></th>
          </tr>
        </thead>
        <tbody className={style.tbody}>
          {architectures.map((architecture) => (
            <tr key={architecture.id}>
              <td>
                <Link to={`/Configurator/${architecture.id}`}>
                  {architecture.archName}
                </Link>
              </td>
 
              <td>
                {architecture.id}
              </td>
              <td>
                {architecture.updatedAt
                  ? new Date(
                    architecture.updatedAt.seconds * 1000
                  ).toLocaleDateString("en-US")
                  : "Not Available"}
              </td>
              <td>
                {architecture.updatedAt
                  ? new Date(
                    architecture.updatedAt.seconds * 1000
                  ).toLocaleDateString("en-US")
                  : "Not Available"}
              </td>
            </tr>
          ))}

        </tbody>
      </table>
      <Popup show={showPopup} onClose={handleClosePopup} />

    </div>
  );
};

export default Home;
