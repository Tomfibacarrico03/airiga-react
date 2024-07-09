function extractSchedule(jsonData) {
  if (!jsonData || !jsonData.ARINC_653_Module || !jsonData.ARINC_653_Module.Module_Schedule) {
      return { schedule: [], majorFrameSeconds: 0 };
  }

  // Normalize Partition_Schedule to be an array
  const partitionSchedule = Array.isArray(jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule)
      ? jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule
      : [jsonData.ARINC_653_Module.Module_Schedule.Partition_Schedule];

  const schedule = partitionSchedule.map(partition => {
      return {
          start: parseFloat(partition.Window_Schedule.WindowStartSeconds),
          end: parseFloat(partition.Window_Schedule.WindowStartSeconds) + parseFloat(partition.Window_Schedule.WindowDurationSeconds),
          content: partition.PartitionName
      };
  });

  const majorFrameSeconds = parseFloat(jsonData.ARINC_653_Module.Module_Schedule.MajorFrameSeconds);

  return { schedule, majorFrameSeconds };
}

export { extractSchedule };
