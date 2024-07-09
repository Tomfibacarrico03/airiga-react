import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; // Make sure to correctly import your firebase config
import { doc, getDoc } from 'firebase/firestore';
import styles from '../styles/visualizer.module.css'; // Import the CSS module
import dagre from 'dagre';
import Scheduler from '../components/Scheduler';
import { extractSchedule } from '../utils/extractSchedule';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(details);
  };

  const filteredDetails = Object.entries(details).filter(([key, value]) => typeof value !== 'object');

  return (
    <div className={styles.nodedetailscard}>
      <button onClick={onClose} className={styles.closebutton}>Close</button>
      <h2>{nodeData.label}</h2>
      <form onSubmit={handleSubmit} className={styles.detailsform}>
        {filteredDetails.map(([key, value]) => (
          <div key={key} className={styles.formgroup}>
            <label>{key}</label>
            <input type="text" name={key} value={value} onChange={handleInputChange} />
          </div>
        ))}
        <button type="submit">Save</button>
      </form>
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

  const handleSave = (updatedDetails) => {
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
    setSelectedNode(null);
  };

  useMemo(() => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ backgroundColor: '#1a1a1a', width: '100vw', height: '100vh' }}>
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
      {activeTab === 'scheduler' ?<Scheduler data={data}/>:null}
      {selectedNode && (
        <NodeDetailsCard nodeData={selectedNode.data} onClose={() => setSelectedNode(null)} onSave={handleSave} />
      )}
    </div>
  );
};

export default XMLConfigurator;
