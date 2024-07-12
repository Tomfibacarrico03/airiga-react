import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '../styles/visualizer.module.css';
import dagre from 'dagre';
import Scheduler from '../components/Scheduler';
import { extractSchedule } from '../utils/extractSchedule';
import options from '../lib/options';
import logo from "../images/airLogo-removebg-preview.png";

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
        currentValues.push(value);
      } else {
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

const jsonToXml = (json) => {
  const { ARINC_653_Module } = json;
  const { ModuleName, Partition, AIR_Configuration, Module_Schedule } = ARINC_653_Module;

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  xml += `<ARINC_653_Module xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ModuleName="${ModuleName}">\n`;

  if (Partition && Partition.length > 0) {
    Partition.forEach(partition => {
      xml += `  <Partition PartitionIdentifier="${partition.PartitionIdentifier}" PartitionName="${partition.PartitionName}" Criticality="${partition.Criticality}" EntryPoint="${partition.EntryPoint}" SystemPartition="${partition.SystemPartition}">\n`;
      const { PartitionConfiguration } = partition;
      if (PartitionConfiguration) {
        xml += `    <PartitionConfiguration Personality="${PartitionConfiguration.Personality}" Cores="${PartitionConfiguration.Cores}">\n`;
        xml += `      <Libs>${PartitionConfiguration.Libs}</Libs>\n`;
        xml += `      <Devices>${PartitionConfiguration.Devices}</Devices>\n`;
        xml += `      <Cache>${PartitionConfiguration.Cache}</Cache>\n`;
        xml += `      <Memory Size="${PartitionConfiguration.Memory.Size}" />\n`;
        xml += `      <Permissions>${PartitionConfiguration.Permissions}</Permissions>\n`;
        xml += `    </PartitionConfiguration>\n`;
      }
      xml += `  </Partition>\n`;
    });
  }

  if (Module_Schedule) {
    xml += `  <Module_Schedule ScheduleIdentifier="${Module_Schedule.ScheduleIdentifier}" ScheduleName="${Module_Schedule.ScheduleName}" InitialModuleSchedule="${Module_Schedule.InitialModuleSchedule}" MajorFrameSeconds="${Module_Schedule.MajorFrameSeconds}">\n`;

    if (Module_Schedule.Partition_Schedule && Module_Schedule.Partition_Schedule.length > 0) {
      Module_Schedule.Partition_Schedule.forEach(schedule => {
        xml += `    <Partition_Schedule PartitionIdentifier="${schedule.PartitionIdentifier}" PartitionName="${schedule.PartitionName}" PeriodDurationSeconds="${schedule.PeriodDurationSeconds}" PeriodSeconds="${schedule.PeriodSeconds}">\n`;

        if (Array.isArray(schedule.Window_Schedule)) {
          schedule.Window_Schedule.forEach(window => {
            xml += `      <Window_Schedule WindowIdentifier="${window.WindowIdentifier}" PartitionPeriodStart="${window.PartitionPeriodStart}" WindowDurationSeconds="${window.WindowDurationSeconds}" WindowStartSeconds="${window.WindowStartSeconds}" />\n`;
          });
        } else if (schedule.Window_Schedule) {
          const window = schedule.Window_Schedule;
          xml += `      <Window_Schedule WindowIdentifier="${window.WindowIdentifier}" PartitionPeriodStart="${window.PartitionPeriodStart}" WindowDurationSeconds="${window.WindowDurationSeconds}" WindowStartSeconds="${window.WindowStartSeconds}" />\n`;
        }

        if (Array.isArray(schedule.WindowConfiguration)) {
          schedule.WindowConfiguration.forEach(config => {
            xml += `      <WindowConfiguration WindowIdentifier="${config.WindowIdentifier}" Cores="${config.Cores}" />\n`;
          });
        } else if (schedule.WindowConfiguration) {
          const config = schedule.WindowConfiguration;
          xml += `      <WindowConfiguration WindowIdentifier="${config.WindowIdentifier}" Cores="${config.Cores}" />\n`;
        }

        xml += `    </Partition_Schedule>\n`;
      });
    }
    xml += `  </Module_Schedule>\n`;
  }

  if (AIR_Configuration) {
    xml += `  <AIR_Configuration TicksPerSecond="${AIR_Configuration.TicksPerSecond}" RequiredCores="${AIR_Configuration.RequiredCores}" />\n`;
  }

  xml += `</ARINC_653_Module>\n`;

  return xml;
};


const downloadXml = (data) => {
  const xmlString = jsonToXml(data);
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'configuration.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  const [activeTab, setActiveTab] = useState('visualizer');

  const onNodeDragStop = (event, node) => {
    setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)));
  };

  const onConnect = (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const handleSave = async (updatedDetails) => {
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

    const updatedData = { ...data };
    const label = selectedNode.data.label;

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
      setData(updatedData);
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
        const { schedule, majorFrameSeconds } = extractSchedule(jsonData);
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
    if (data!= null) {
      
      const { nodes, edges } = parseJsonToNodesAndEdges(data);
      const layoutedElements = getLayoutedElements(nodes, edges);
      setNodes(layoutedElements.nodes);
      setEdges(layoutedElements.edges);
    }
  }, [data]);

  useEffect(() => {
    if (id) {
      fetchArchitectureData();
      
    }
  }, [activeTab]);

  if (loading) {
    return <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)"}}>
                    <img src={logo} alt="Logo" key={logo} />

    </div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ backgroundColor: '#1a1a1a', width: '100vw', minHeight: '100vh' }}>
      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('visualizer')}>Visualizer</button>
        <button onClick={() => setActiveTab('scheduler')}>Scheduler</button>
        <button onClick={() => downloadXml(data)} className={styles.downloadButton}>Download XML</button>
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
