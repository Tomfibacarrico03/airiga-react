function extractSchedule(jsonData) {
    if (!jsonData || !jsonData.ARINC_653_Module || !jsonData.ARINC_653_Module.Module_Schedule) {
        return { schedule: [], majorFrameSeconds: 0 };
    }

    // Normalize Partition_Schedule to be an array
    const partitionSchedule = Array.isArray(jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule)
        ? jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule
        : [jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule];

    console.log(partitionSchedule);

    const schedule = partitionSchedule.flatMap(partition => {
        const windowSchedules = Array.isArray(partition.Window_Schedule)
            ? partition.Window_Schedule
            : [partition.Window_Schedule];

        return windowSchedules.map(ws => ({
            start: parseFloat(ws?.WindowStartSeconds),
            end: parseFloat(ws?.WindowStartSeconds) + parseFloat(ws?.WindowDurationSeconds),
            content: partition.PartitionName
        }));
    });

    const majorFrameSeconds = parseFloat(jsonData.ARINC_653_Module.Module_Schedule.MajorFrameSeconds);

    return { schedule, majorFrameSeconds };
}

export { extractSchedule };
