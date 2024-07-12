import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; // Make sure to correctly import your firebase config
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '../styles/visualizer.module.css'; // Import the CSS module
import dagre from 'dagre';
import Scheduler from '../components/Scheduler';
import { extractSchedule } from '../utils/extractSchedule';
import options from '../lib/options';

const nodeWidth = 130;
const nodeHeight = 36;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const parseJsonToNodesAndEdges = (json) => {
  let idCounter = 1;
  const nodes = [];
  const edges = [];
  const levelSpacing = 300; // Horizontal spacing between levels
  const siblingSpacing = 150; // Vertical spacing between sibling nodes

  const createNode = (key, value, parentId = null, level = 0, positionIndex = 0, parentNodeX = 0) => {
    const nodeId = idCounter++;
    const nodeX = parentNodeX + (positionIndex - 1) * levelSpacing; // X position based on level and sibling index
    const nodeY = 200 + level * siblingSpacing; // Y position based on level

    if (typeof value === 'object' && value !== null) {
      nodes.push({
        id: `${nodeId}`,
        data: { label: key, details: value },
        position: { x: nodeX, y: nodeY },
      });

      if (parentId !== null) {
        edges.push({
          id: `e${parentId}-${nodeId}`,
          source: `${parentId}`,
          target: `${nodeId}`,
          type: 'smoothstep',
        });
      }

      // Sort keys alphabetically
      const sortedKeys = Object.keys(value).sort();
      const midIndex = (sortedKeys.length - 1) / 2;
      sortedKeys.forEach((childKey, index) => {
        createNode(childKey, value[childKey], nodeId, level + 1, index - midIndex, nodeX);
      });
    }
  };

  // Sort root keys alphabetically
  const sortedRootKeys = Object.keys(json).sort();
  for (const key of sortedRootKeys) {
    createNode(key, json[key]);
  }

  return { nodes, edges };
};

const NodeDetailsCard = ({ nodeData, onClose, onSave }) => {
  const [details, setDetails] = useState(nodeData.details);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;
    setDetails((prevDetails) => {
      const currentValues = prevDetails[key] ? prevDetails[key].split(';').map(v => v.trim()) : [];
      
      if (checked) {
        console.log(1);
        currentValues.push(value);
      } else {
        console.log(0);

        // If there's only one value left, prevent unchecking
        if (currentValues.length > 1) {
          const index = currentValues.indexOf(value);
          if (index > -1) {
            currentValues.splice(index, 1);
          }
        } else {
          // Prevent unchecking if only one box is checked
          e.preventDefault();
          alert('At least one must be checked');
          return prevDetails;
        }
      }
  
      const updatedValues = currentValues.join('; ');
  
      // Log the number of boxes selected
      console.log(`Number of boxes selected for ${key}: ${currentValues.length}`);
  
      return {
        ...prevDetails,
        [key]: updatedValues,
      };
    });
  };
  
  

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(details);
  };

  const findMatchingOptionKey = (value) => {
    return Object.keys(options).find((key) => options[key].includes(value.trim()));
  };

  const renderInputField = (key, value) => {
    const matchingOptionKey = Object.keys(options).find(optKey =>
      options[optKey].some(option => value.split(';').map(v => v.trim()).includes(option))
    );

    if (matchingOptionKey) {
      if (matchingOptionKey.endsWith('_CHECK')) {
        const currentValues = value.split(';').map(v => v.trim());
        return (
          <div className={styles.checkboxGroup}>
            {options[matchingOptionKey].map((opt) => (
              <label key={opt} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name={key}
                  value={opt}
                  checked={currentValues.includes(opt)}
                  onChange={(e) => handleCheckboxChange(e, key)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.customCheckbox}></span>
                {opt}
              </label>
            ))}
          </div>
        );
      } else {
        return (
          <select name={key} value={value} onChange={handleInputChange}>
            {options[matchingOptionKey].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
    }

    return <input type={key.includes('Seconds') ? 'number' : 'text'} name={key} value={value} onChange={handleInputChange} />;
  };

  return (
    <div className={styles.nodedetailscard}>
      <div className={styles.dataHeader}>
        <h2>{nodeData.label}</h2>
        <button onClick={onClose} className={styles.closebutton}>Close</button>
      </div>
      {nodeData.details.WindowIdentifier ? (
        <p>Please use the scheduler</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.detailsform}>
          {Object.entries(details).filter(([key, value]) => typeof value !== 'object').map(([key, value]) => (
            <div key={key} className={styles.formgroup}>
              <label>{key}</label>
              {renderInputField(key, value)}
            </div>
          ))}
          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
};

const XMLConfigurator = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [majorFrameSeconds, setMajorFrameSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('visualizer'); // Add state for active tab

  const onNodeDragStop = (event, node) => {
    setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)));
  };

  const onConnect = (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const handleSave = async (updatedDetails) => {
    // Update the nodes state with the new details
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              details: updatedDetails,
            },
          };
        }
        return node;
      })
    );

    // Update the Firebase document with the new details
    const updatedData = { ...data };
    const label = selectedNode.data.label;

    // Update the nested structure appropriately
    const updateNestedObject = (obj, label, details) => {
      for (const key in obj) {
        if (key === label) {
          obj[key] = { ...obj[key], ...details };
        } else if (typeof obj[key] === 'object') {
          updateNestedObject(obj[key], label, details);
        }
      }
    };

    updateNestedObject(updatedData, label, updatedDetails);

    try {
      await setDoc(doc(db, 'Configurations', id), updatedData);
      setData(updatedData); // Update the local state with the new data
      setSelectedNode(null);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const fetchArchitectureData = async () => {
    const docRef = doc(db, 'Configurations', id);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const jsonData = docSnap.data();
        setData(jsonData);
        const { nodes, edges } = parseJsonToNodesAndEdges(jsonData);
        const layoutedElements = getLayoutedElements(nodes, edges);
        setNodes(layoutedElements.nodes);
        setEdges(layoutedElements.edges);
        const { schedule, majorFrameSeconds } = extractSchedule(jsonData); // Extract schedule and majorFrameSeconds from JSON data
        setSchedule(schedule);
        setMajorFrameSeconds(majorFrameSeconds);
      } else {
        setError('No such document!');
      }
    } catch (e) {
      setError('Error fetching document: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useMemo(() => {
    if (id) {
      fetchArchitectureData();
    } else {
      setLoading(false);
      setError('Invalid ID');
    }
  }, [id]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  useEffect(() => {
    if (id) {
      fetchArchitectureData();
    }
  }, [activeTab]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ backgroundColor: '#1a1a1a', width: '100vw', minHeight: '100vh' }}>
      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('visualizer')}>Visualizer</button>
        <button onClick={() => setActiveTab('scheduler')}>Scheduler</button>
      </div>
      {activeTab === 'visualizer' && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      )}
      {activeTab === 'scheduler' && data ? <Scheduler data={data} documentId={id} /> : null}
      {selectedNode && (
        <NodeDetailsCard nodeData={selectedNode.data} onClose={() => setSelectedNode(null)} onSave={handleSave} />
      )}
    </div>
  );
};

export default XMLConfigurator;
