import React, { useState, useEffect, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Component for draggable and resizable boxes
const DraggableResizableBox = ({ item, children, width, height, minConstraints, maxConstraints, onResizeStop, left, handleFieldChange, windowSchedule, majorFrameSeconds, velocityFactor = 0.5 }) => {
    const ref = useRef(null);
    const [initialX, setInitialX] = useState(null);

    const handleDragStart = (e) => {
        setInitialX(e.clientX);
    };

    const handleDrag = (e) => {
        if (initialX !== null) {
            const deltaX = (e.clientX - initialX) * velocityFactor; // Apply the velocity factor here
            const newStartSeconds = parseFloat(windowSchedule.WindowStartSeconds) + (deltaX / width) * majorFrameSeconds;

            if (newStartSeconds >= 0 && newStartSeconds <= majorFrameSeconds - parseFloat(windowSchedule.WindowDurationSeconds)) {
                handleFieldChange('WindowStartSeconds', newStartSeconds.toFixed(4), item);
                setInitialX(e.clientX);
            }
        }
    };

    const handleDragEnd = () => {
        setInitialX(null);
    };

    return (
        <div
            ref={ref}
            style={{ position: 'absolute', left: `${left}px`, cursor: 'grab' }}
            draggable
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
        >
            <ResizableBox
                width={width}
                height={height}
                axis="x"
                resizeHandles={['e']}
                onResizeStop={onResizeStop}
                minConstraints={minConstraints}
                maxConstraints={maxConstraints}
            >
                {children}
            </ResizableBox>
        </div>
    );
};
// Main scheduler component

export default DraggableResizableBox;
