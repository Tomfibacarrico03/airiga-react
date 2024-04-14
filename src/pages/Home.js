import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import style from "../styles/home.module.css";
import { Link } from "react-router-dom";

const Home = () => {
  const [architectures, setArchitectures] = useState([]);

  useEffect(() => {
    const fetchArchitectures = async () => {
      try {
        const snapshot = await getDocs(collection(db, "architectures"));
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

  return (
    <div className={style.tableContainer}>
      <table className={style.architecturesTable}>
        <thead>
          <tr>
            <th>Architecture</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody className={style.tbody}>
          {architectures.map((architecture) => (
            <tr key={architecture.id}>
              <td>
                <Link to={`/Architecture/${architecture.id}`}>
                  {architecture.name}
                </Link>
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
      <Link className={style.addArch} to="/Architecture">Add New Architecture</Link>

    </div>
  );
};

export default Home;
