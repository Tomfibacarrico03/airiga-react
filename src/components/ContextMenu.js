import React from 'react';
import styles from '../styles/contextMenu.module.css';

const ContextMenu = ({ x, y, onSplit }) => (
    <div className={styles.contextMenu} style={{ top: y, left: x }}>
        <button onClick={onSplit}>Split</button>
    </div>
);

export default ContextMenu;