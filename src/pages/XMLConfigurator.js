import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Rnd } from "react-rnd";
import styles from "../styles/arch.module.css";

const JsonModule = ({ title, data }) => {
  const renderComponent = (key, value) => {
    if (!(typeof value === 'object' && !Array.isArray(value)) && !(Array.isArray(value))) {
      return (
        <div key={key} className={styles.primitiveValue}>
          <strong>{key}: </strong>{value}
        </div>
      );
    }
  };

  return (
    <div className={styles.jsonModule}>
      <h2>{title}</h2>
      {Object.entries(data).map(([key, value]) => renderComponent(key, value))}
    </div>
  );
};

const DraggableModule = ({ title, data }) => {
  return (
    <Rnd
      default={{
        x: 0,
        y: 0,
        width: 320,
        height: 200,
      }}
      bounds="parent"
    >
      <div className={styles.draggableBox}>
        <JsonModule title={title} data={data} />
      </div>
    </Rnd>
  );
};

const XMLConfigurator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchitectureData = async () => {
      const docRef = doc(db, "Configurations", id);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(await docSnap.data());
        } else {
          setError("No such document!");
        }
      } catch (e) {
        setError("Error fetching document: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArchitectureData();
    } else {
      setLoading(false);
      setError("Invalid ID");
    }
  }, [id]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  if (loading) {
    return <div className={styles.loader}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const renderModules = (obj, parentKey = '') => {
    const modules = [];
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        modules.push(
          <DraggableModule key={parentKey + key} title={key} data={value} />
        );
        modules.push(...renderModules(value, parentKey + key + '.'));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          modules.push(
            <DraggableModule key={parentKey + key + index} title={`${key} ${index + 1}`} data={item} />
          );
          modules.push(...renderModules(item, parentKey + key + index + '.'));
        });
      }
    }
    return modules;
  };

  return (
    <div className={styles.container}>
      {data && renderModules(data)}
    </div>
  );
};

export default XMLConfigurator;
