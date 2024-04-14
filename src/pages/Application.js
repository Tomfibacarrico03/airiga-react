import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DiagramEngine,
  DiagramModel,
  DefaultNodeModel,
  DiagramWidget,
  DefaultPortModel,
} from "storm-react-diagrams";
import "storm-react-diagrams/dist/style.min.css";
import styles from "../styles/app.module.css";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useReload } from "../context/ReloadContext";
const Application = () => {
  const { appId } = useParams(); // This hook gives you access to the parameters of the current route

  const [engine] = useState(() => {
    const eng = new DiagramEngine();
    eng.installDefaultFactories();
    return eng;
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [portType, setPortType] = useState("Out"); // Default to "Out" for port type
  const [model, setModel] = useState(new DiagramModel());
  const { triggerReload } = useReload();

  const setupListeners = (model, handleModelChange, handleLinkCreation) => {
    // Handler for node selection changes
    const handleSelectionChange = (node, isSelected) => {
      // Set or unset the selected node based on the event
      setSelectedNode(isSelected ? node : null);
    };

    // Register listeners for all existing nodes in the model
    model.getNodes().forEach((node) => {
      node.addListener({
        selectionChanged: (event) =>
          handleSelectionChange(node, event.isSelected),
      });
    });

    // Listener for the model to handle node additions and other model-wide changes
    const eventHandlers = {
      nodesUpdated: (event) => {
        if (event.isCreated) {
          handleModelChange();

          event.node.addListener({
            selectionChanged: (event) => {
              handleModelChange();
              setSelectedNode(event.isSelected ? event.entity : null);
            },
          });
        }
      },
      linksUpdated: (event) => {
        if (event.isCreated) {
          handleModelChange();

          handleLinkCreation(event.link);
        }
      },
      selectionChanged: (event) => {
        if (event.isCreated) {
          handleModelChange();
        }
      },
      offsetUpdated: handleModelChange,
      zoomUpdated: handleModelChange,
      lockChanged: handleModelChange,
      gridUpdated: handleModelChange,
      entityRemoved: handleModelChange,
    };
    model.addListener(eventHandlers);
  };

  const addNode = useCallback(() => {
    const node = new DefaultNodeModel("Partition", "rgb(0,192,255)");
    node.setPosition(100, 100);
    model.addNode(node);
    engine.repaintCanvas();

    addDoc(collection(db, "Partition"), {
      appId: appId,
      name: "Partition",
      color: "rgb(0,192,255)",
      positionX: 100,
      positionY: 100,
    })
      .then((docRef) => {
        console.log("Partition document written with ID: ", docRef.id);
        node.extras = { ...node.extras, firestoreId: docRef.id }; // Storing Firestore ID in the node extras
        engine.repaintCanvas(); // Refresh the canvas to apply any updates
        triggerReload();
      })
      .catch((error) => {
        console.error("Error adding partition document: ", error);
      });
  }, [engine, appId, model]);

  const addPort = useCallback(() => {
    if (selectedNode) {
      const port = new DefaultPortModel(portType === "Out", portType, portType);
      selectedNode.addPort(port);
      engine.repaintCanvas();

      // Accessing the Firestore document ID stored in the node
      const partitionId = selectedNode.extras.firestoreId;

      if (partitionId) {
        const newPortData = {
          partitionId: partitionId,
          type: portType,
          nodeName: selectedNode.name,
        };

        addDoc(collection(db, "Ports"), newPortData)
          .then((docRef) => {
            console.log("Port document written with ID: ", docRef.id);
            triggerReload();
          })
          .catch((error) => {
            console.error("Error adding port document: ", error);
          });
      } else {
        console.log("No Firestore ID found for this node");
      }
    }
  }, [selectedNode, portType, engine]);
  const addMemory = useCallback(() => {
    const node = new DefaultNodeModel("Partition", "rgb(0,192,255)");
    node.setPosition(100, 100);
    model.addNode(node);
    engine.repaintCanvas();

    addDoc(collection(db, "Partition"), {
      appId: appId,
      name: "Partition",
      color: "rgb(0,192,255)",
      positionX: 100,
      positionY: 100,
    })
      .then((docRef) => {
        console.log("Partition document written with ID: ", docRef.id);
        node.extras = { ...node.extras, firestoreId: docRef.id }; // Storing Firestore ID in the node extras
        engine.repaintCanvas(); // Refresh the canvas to apply any updates
        triggerReload();
      })
      .catch((error) => {
        console.error("Error adding partition document: ", error);
      });
  }, [engine, appId, model]);
  const saveDiagramState = useCallback(async () => {
    const serializedModel = model.serializeDiagram();
    const diagramData = {
      diagramState: JSON.stringify(serializedModel),
      updatedAt: new Date(),
      appId: appId, // Ensure appId is part of your component's state or props
    };

    const diagramQuery = query(
      collection(db, "Diagrams"),
      where("appId", "==", appId)
    );

    try {
      const diagramSnapshot = await getDocs(diagramQuery);
      const docRef = doc(db, "Diagrams", appId); // Using appId as the document ID for direct reference

      if (diagramSnapshot.docs.length > 0) {
        // Document exists, update it
        await updateDoc(docRef, diagramData);
        console.log("Diagram state updated");
      } else {
        // Document does not exist, create it
        await setDoc(docRef, diagramData);
        console.log("Diagram state created");
      }
    } catch (error) {
      console.error("Error accessing Firestore: ", error);
    }
  }, [appId, model]);
  // Handler function for link naming
  const handleLinkCreation = (link) => {
    const linkName = "Comunication Channel";
    if (linkName) {
      link.addLabel(linkName);
      console.log(`Link named ${linkName} was created`, link);
    } else {
      model.removeLink(link);
      engine.repaintCanvas();
    }
  };
  useEffect(() => {
    engine.setDiagramModel(model);
    engine.repaintCanvas();
  }, [model, engine]);
  useEffect(() => {
    // Load diagram state if it exists
    const handleModelChange = () => {
      saveDiagramState();
    };

    const loadDiagramState = async () => {
      const docRef = doc(db, "Diagrams", appId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const diagramState = JSON.parse(data.diagramState);
        const handleModelChange = () => {
          saveDiagramState();
        };
        // Event handlers for nodes and links
        const eventHandlers = {
          nodesUpdated: (event) => {
            if (event.isCreated) {
              handleModelChange();

              event.node.addListener({
                selectionChanged: (event) => {
                  handleModelChange();
                  setSelectedNode(event.isSelected ? event.entity : null);
                },
              });
            }
          },
          linksUpdated: (event) => {
            if (event.isCreated) {
              handleModelChange();
            }
          },
          selectionChanged: (event) => {
            if (event.isCreated) {
              handleModelChange();
            }
          },
          offsetUpdated: handleModelChange,
          zoomUpdated: handleModelChange,
          lockChanged: handleModelChange,
          gridUpdated: handleModelChange,
          entityRemoved: handleModelChange,
        };
        const newModel = new DiagramModel();
        newModel.deSerializeDiagram(diagramState, engine);

        newModel.addListener(eventHandlers);
        setModel(newModel);
        engine.setDiagramModel(newModel); // Set the model on the engine again after update
        engine.repaintCanvas();
      }
    };

    if (appId) {
      loadDiagramState();
    }
  }, []);

  useEffect(() => {
    const handleModelChange = () => {
      saveDiagramState();
    };
    // Event handlers for nodes and links
    const eventHandlers = {
      nodesUpdated: (event) => {
        if (event.isCreated) {
          handleModelChange();

          event.node.addListener({
            selectionChanged: (event) => {
              handleModelChange();
              setSelectedNode(event.isSelected ? event.entity : null);
            },
          });
        }
      },
      linksUpdated: (event) => {
        if (event.isCreated) {
          handleModelChange();

          event.link.addLabel("Comunication Channel")
        }
      },
      selectionChanged: (event) => {
        if (event.isCreated) {
          handleModelChange();
        }
      },
      offsetUpdated: handleModelChange,
      zoomUpdated: handleModelChange,
      lockChanged: handleModelChange,
      gridUpdated: handleModelChange,
      entityRemoved: handleModelChange,
    };

    // Register listeners on model
    model.addListener(eventHandlers);
    return () => {
      model.removeListener(eventHandlers);
    };
  }, [model, engine, saveDiagramState]); // Engine should be stable and not change, ensuring listeners are set up once.

  return (
    <div className={styles.App}>
      <div className={styles.contentsBar}>
        <button onClick={addNode}>Add Partition</button>
        <button onClick={addMemory}>Add Shared memory</button>
        {selectedNode && (
          <>
            <p>Ports</p>
            <select
              value={portType}
              onChange={(e) => setPortType(e.target.value)}
            >
              <option value="Out">Destination</option>
              <option value="In">Source</option>
            </select>
            <button onClick={addPort}>Add Port</button>
          </>
        )}
      </div>
      <DiagramWidget diagramEngine={engine} className={styles.diagram} />
    </div>
  );
};

export default Application;
