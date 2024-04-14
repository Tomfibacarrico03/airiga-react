import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import style from "../styles/sidebar.module.css";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useReload } from "../context/ReloadContext";
const Sidebar = () => {
  const { key } = useReload();
  const [architectures, setArchitectures] = useState([]);
  const location = useLocation();
  useEffect(() => {
    const getArchitecturesAndBSPs = async () => {
      try {
        const architectureSnapshot = await getDocs(
          collection(db, "architectures")
        );
        const architecturesData = await Promise.all(
          architectureSnapshot.docs.map(async (doc) => {
            const architecture = {
              id: doc.id,
              ...doc.data(),
              bsps: [],
            };

            const bspsQuery = query(
              collection(db, "BSP"),
              where("architectureId", "==", architecture.id)
            );
            const bspsSnapshot = await getDocs(bspsQuery);
            architecture.bsps = await Promise.all(
              bspsSnapshot.docs.map(async (doc) => {
                const bsp = {
                  id: doc.id,
                  ...doc.data(),
                  applications: [],
                };

                const appsQuery = query(
                  collection(db, "Application"),
                  where("bspId", "==", bsp.id)
                );
                const appsSnapshot = await getDocs(appsQuery);
                bsp.applications = await Promise.all(
                  appsSnapshot.docs.map(async (appDoc) => {
                    const app = {
                      id: appDoc.id,
                      ...appDoc.data(),
                      partitions: [],
                    };

                    const partitionsQuery = query(
                      collection(db, "Partition"),
                      where("appId", "==", app.id)
                    );
                    const partitionsSnapshot = await getDocs(partitionsQuery);
                    app.partitions = partitionsSnapshot.docs.map(
                      (partitionDoc) => ({
                        id: partitionDoc.id,
                        ...partitionDoc.data(),
                      })
                    );

                    return app;
                  })
                );

                return bsp;
              })
            );

            return architecture;
          })
        );

        setArchitectures(architecturesData);
      } catch (e) {
        console.error(
          "Error loading architectures, BSPs, and applications: ",
          e
        );
      }
    };

    getArchitecturesAndBSPs();
  }, [key]);
  useEffect(() => {
    const getArchitecturesAndBSPs = async () => {
      try {
        const architectureSnapshot = await getDocs(
          collection(db, "architectures")
        );
        const architecturesData = await Promise.all(
          architectureSnapshot.docs.map(async (doc) => {
            const architecture = {
              id: doc.id,
              ...doc.data(),
              bsps: [],
            };

            const bspsQuery = query(
              collection(db, "BSP"),
              where("architectureId", "==", architecture.id)
            );
            const bspsSnapshot = await getDocs(bspsQuery);
            architecture.bsps = await Promise.all(
              bspsSnapshot.docs.map(async (doc) => {
                const bsp = {
                  id: doc.id,
                  ...doc.data(),
                  applications: [],
                };

                const appsQuery = query(
                  collection(db, "Application"),
                  where("bspId", "==", bsp.id)
                );
                const appsSnapshot = await getDocs(appsQuery);
                bsp.applications = await Promise.all(
                  appsSnapshot.docs.map(async (appDoc) => {
                    const app = {
                      id: appDoc.id,
                      ...appDoc.data(),
                      partitions: [],
                    };

                    const partitionsQuery = query(
                      collection(db, "Partition"),
                      where("appId", "==", app.id)
                    );
                    const partitionsSnapshot = await getDocs(partitionsQuery);
                    app.partitions = partitionsSnapshot.docs.map(
                      (partitionDoc) => ({
                        id: partitionDoc.id,
                        ...partitionDoc.data(),
                      })
                    );

                    return app;
                  })
                );

                return bsp;
              })
            );

            return architecture;
          })
        );

        setArchitectures(architecturesData);
      } catch (e) {
        console.error(
          "Error loading architectures, BSPs, and applications: ",
          e
        );
      }
    };

    getArchitecturesAndBSPs();
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className={style.sidebar}>
      <ul>
        {architectures.map((architecture) => (
          <li
            key={architecture.id}
            className={
              isActive(`/Architecture/${architecture.id}`) ? style.active : ""
            }
          >
            <Link to={`/Architecture/${architecture.id}`}>
              {architecture.name}
            </Link>
            <ul>
              {architecture.bsps.map((bsp) => (
                <li
                  key={bsp.id}
                  className={isActive(`/BSP/${bsp.id}`) ? style.active : ""}
                  style={{ marginLeft: "20px" }}
                >
                  <Link to={`/BSP/${bsp.id}`}>{bsp.name}</Link>
                  <ul>
                    {bsp.applications.map((app) => (
                      <li
                        key={app.id}
                        className={
                          isActive(`/Application/${app.id}`) ? style.active : ""
                        }
                        style={{ marginLeft: "10px" }}
                      >
                        <Link to={`/Application/${app.id}`}>{app.name}</Link>
                        <ul>
                          {app.partitions.map((partition) => (
                            <li
                              key={partition.id}
                              className={
                                isActive(`/Partition/${partition.id}`)
                                  ? style.active
                                  : ""
                              }
                              style={{ marginLeft: "20px" }}
                            >
                              <Link to={`/Partition/${partition.id}`}>
                                {partition.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <li>
        <Link to="/Architecture">New architecture</Link>
      </li>
    </div>
  );
};

export default Sidebar;
