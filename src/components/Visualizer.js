import React, { useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Formik, Form, Field } from 'formik';
import styles from '../styles/visualizer.module.css';

const Module = ({ module, index, moveModule, updateModule }) => {
    const [, ref] = useDrag({
        type: 'MODULE',
        item: { index },
    });

    const [, drop] = useDrop({
        accept: 'MODULE',
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                moveModule(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    const handleSubmit = (values) => {
        updateModule(index, values);
    };

    return (
        <div ref={(node) => ref(drop(node))} className={styles.module}>
       
        </div>
    );
};

const Visualizer = ({ schema }) => {
    const [modules, setModules] = React.useState(schema.modules);


    useEffect(() => {
        console.log(modules);
    }, [modules]);

    const moveModule = (fromIndex, toIndex) => {
        const updatedModules = [...modules];
        const [movedModule] = updatedModules.splice(fromIndex, 1);
        updatedModules.splice(toIndex, 0, movedModule);
        setModules(updatedModules);
    };

    const updateModule = (index, updatedModule) => {
        const updatedModules = [...modules];
        updatedModules[index] = updatedModule;
        setModules(updatedModules);
    };

    return (
        <div className={styles.visualizer}>
    
        </div>
    );
};

export default Visualizer;
