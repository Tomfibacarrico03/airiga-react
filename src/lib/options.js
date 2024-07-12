// options.js

const options = {
    // Architecture options
    ARCH_OPTS: ["ARM", "SPARC"],
    TARGET_BSP_OPTS_1: ["laysim_gr740", "leon3_or_tsim2", "tsim", "leon4"],
    TARGET_BSP_OPTS_0: ["zynq_main_board", "zynqz1"],
    FPU_OPTS: ["Enabled", "Disabled"],
    DEBUG_OPTS: ["GRMON", "DMON", "NONE"],
    RTOS_OPTS: ["bare", "posixrtems5", "rtems48i", "rtems5"],
  
    // BSP (board support package) options
    SIMU_OPTS: ["Board", "SIM1", "SIM2", "SIM3"],
  
    // Shared Memory
    SHARED_MEM_PERMISSIONS: ["Read Only", "Execute Only", "Read/Execute", "Read/Write", "Read/Write/Execute"],
    SHARED_MEM_PERMISSIONS_OPTS: ["R", "X", "RX", "RW", "RWX"],
  
    // Schedule
    ON_SCHEDULE_CHANGE_OPTS: ["COLD_START", "WARM_START", "IDLE", "IGNORE"],
  
    // Application options
    MODULE_TYPE_OPTS: ["AIR"],
  
    // Partition Options
    PART_CRITICALITY_OPTS: ["LEVEL_A", "LEVEL_B", "LEVEL_C", "LEVEL_D", "LEVEL_E", "LEVEL_F"],
    PERSONALITY_OPTS_CHECK: ["BARE", "RTEMS48I", "RTEMS5", "POSIXRTEMS5"],
    LIBS_OPTS_CHECK: ["LIBPRINTF", "LIBAIR", "LIBIOP", "LIBTEST", "IMASPEX", "LIBCOV"],
    CACHE_OPTS_CHECK: ["CODE", "DATA", "PERMISSION (DEPRECATED)"],
    PERMISSIONS_CHECK: ["SET_TOD", "SET_PARTITION_MODE", "CACHE_CONTROL", "GLOBAL_TIME", "FPU_CONTROL", "MODULE_CONTROL", "SUPERVISOR"],
  
    // Partition Port
    DIRECTION_OPTS: ["SOURCE", "DESTINATION"],
    PORT_TYPE_OPTS: ["Sampling", "Queuing"],
  
    // Health Monitor Table
    SYSTEM_ERROR_LEVELS: ["MODULE", "PARTITION"],
    MODULE_ERROR_ACTIONS: ["IGNORE", "SHUTDOWN", "RESET"],
};

export default options;