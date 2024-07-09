import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styles from "../styles/partitionScheduleTimeline.module.css"; // Import the CSS module

const PartitionScheduleTimeline = ({ partitionSchedules, onSave, majorFrameSeconds }) => {
  const [schedules, setSchedules] = useState(partitionSchedules);

  console.log('Partition Schedules:', partitionSchedules); // Debugging log

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedSchedules = Array.from(schedules);
    const [movedSchedule] = reorderedSchedules.splice(result.source.index, 1);
    reorderedSchedules.splice(result.destination.index, 0, movedSchedule);

    setSchedules(reorderedSchedules);
  };

  const handleSave = () => {
    onSave(schedules);
  };

  const timelineStyle = {
    display: 'flex',
    position: 'relative',
    width: '100%',
    height: '100px',
    border: '1px solid #ccc',
    margin: '20px 0',
  };

  const itemStyle = (schedule) => ({
    position: 'absolute',
    left: `${(schedule.Window_Schedule.WindowStartSeconds / majorFrameSeconds) * 100}%`,
    width: `${(schedule.Window_Schedule.WindowDurationSeconds / majorFrameSeconds) * 100}%`,
    backgroundColor: '#4caf50',
    color: '#fff',
    textAlign: 'center',
    borderRadius: '4px',
    padding: '5px',
    boxSizing: 'border-box',
  });

  return (
    <div className={styles.timelineEditor}>
      <h2>Partition Schedules Timeline</h2>
      <div style={timelineStyle}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="schedules" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', width: '100%' }}>
                {schedules.map((schedule, index) => (
                  <Draggable key={schedule.PartitionIdentifier.toString()} draggableId={schedule.PartitionIdentifier.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...itemStyle(schedule), ...provided.draggableProps.style }}
                      >
                        <p>{`Partition ${schedule.PartitionName}`}</p>
                        <p>{`${schedule.Window_Schedule.WindowDurationSeconds} s`}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <button onClick={handleSave} className={styles.saveButton}>Save</button>
    </div>
  );
};

export default PartitionScheduleTimeline;
