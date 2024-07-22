import React, { useState, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Component for draggable and resizable boxes
const DraggableResizableBox = ({ item, children, width, height, minConstraints, maxConstraints, onResizeStop, left, handleFieldChange, windowSchedule, majorFrameSeconds, velocityFactor = 0.5 }) => {
    const ref = useRef(null);
    const [initialX, setInitialX] = useState(null);
    const [initialStartSeconds, setInitialStartSeconds] = useState(null);

    const handleDragStart = (e) => {
        setInitialX(e.clientX);
        setInitialStartSeconds(parseFloat(windowSchedule.WindowStartSeconds));
    };

    const handleDrag = (e) => {
        if (initialX !== null && initialStartSeconds !== null) {
            const deltaX = (e.clientX - initialX) * velocityFactor;
            var newStartSeconds = initialStartSeconds + (deltaX / width) * majorFrameSeconds;

            if (newStartSeconds >= 0 && newStartSeconds <= majorFrameSeconds - parseFloat(windowSchedule.WindowDurationSeconds)) {
                if(newStartSeconds < 0.009){
                    newStartSeconds = 0
                }
                if (newStartSeconds + parseFloat(windowSchedule.WindowDurationSeconds) > majorFrameSeconds - 0.009) {
                    newStartSeconds = majorFrameSeconds - parseFloat(windowSchedule.WindowDurationSeconds)
                }
                handleFieldChange('WindowStartSeconds', newStartSeconds.toFixed(4), item);
            }   
        }
    };

    const handleDragEnd = () => {
        setInitialX(null);
        setInitialStartSeconds(null);
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
            <div
                style={{width:width+"px", height:height+"px"}}
            >
                {children}
            </div>
        </div>
    );
};

export default DraggableResizableBox;
