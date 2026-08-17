/**
 * Central Table Name Configuration
 */

module.exports = {
  // User Management  
  APP_USER: 'app_user',
  USER_CUSTOMER_ASSIGNMENTS: 'user_customer_assignments',
  USERS: 'app_user',

  // Oracle Instances
  ORACLE_INSTANCES: 'cus_instance',
  ORACLE_INSTANCE_USER_METADATA: 'oracle_instance_user_metadata',
  ORACLE_SESSIONS: 'oracle_sessions',

  // Customer Tables
  CUSTOMERS: 'customers',
  CUS_CUSTOMER: 'cus_customer',
  CUS_INSTANCE: 'cus_instance',
  CUS_INSTANCE_LOGIN_STEPS: 'cus_instance_login_steps',
  CUS_SCRIPT: 'cus_script',
  CUS_SCRIPT_STEPS: 'cus_script_steps',
  CUS_RECORDINGS: 'cus_recordings',
  CUS_INSTANCE_USER: 'cus_instance_user',
  
  CUS_CREDENTIAL: 'cus_credential',
  USER_ORACLE_INSTANCES: 'user_oracle_instances',
  CUSTOMER_INSTANCE_ASSIGNMENTS: 'customer_instance_assignments',
  APP_USER_CUSTOMER: 'app_user_customer',
  CUS_SCRIPT_PARAM: 'cus_script_param',
  CUS_SCRIPT_DEEPLINK_MAP: 'cus_script_deeplink_map',
  

  // Oracle Tables
  ORA_SCRIPT: 'ora_script',
  ORA_SCRIPT_STEPS: 'ora_script_steps',
  ORA_RELEASES: 'ora_releases',
  ORA_RELEASE_DETAILS: 'ora_release_details',

  // API Configuration
  USER_API_PAYLOAD_CONFIG: 'ora_script_api_payload_config',
  USER_API_PAYLOAD_VALUES: 'ora_script_api_payload_values',
  MASTER_API_PAYLOAD: 'ora_script_api_payload',

  // Process Areas
  MASTER_PROCESS_AREA: 'ora_script',
  MASTER_PROCESS_AREA_API: 'ora_script_api',
  MASTER_PROCESS_AREA_SCRIPT_STEPS: 'ora_script_step',

  // Modules and Tracks
  MASTER_MODULE: 'ora_module',
  MASTER_TRACK: 'ora_track',
  INSTANCE_MODULE_ACCESS_MAPPING: 'instance_module_access_mapping',

  // API Execution
  API_EXECUTION_HISTORY: 'api_execution_history',

  // Learned labels for Oracle validation messages ("Duplicate Data",
  // "Missing Data"). Written by the replay runner the first time a message is
  // seen, read on every run after that so the same message is never paid for
  // twice. Safe to edit by hand — a corrected row wins on the next run.
  CUS_ORACLE_ERROR_TYPE: 'cus_oracle_error_type',
  API_EXECUTION_STATUS_HISTORY: 'api_execution_status_history',

  // Reports
  EXECUTION_REPORTS: 'execution_reports',

  // Timezones
  TIMEZONES: 'timezones',
  
  // API Projects
  API_PROJECTS: 'api_project',
  API_PROJECT_SCHEDULES: 'api_project_schedule',
  API_PROJECT_EXECUTIONS: 'api_project_execution',
  API_PROJECT_ITEMS: 'api_project_item',

  // Oracle Roles
  MASTER_ORACLE_FUSION_ROLES: 'master_oracle_fusion_roles',

  // Business Process Packs
  BUSINESS_PROCESS_TEST_PACK: 'business_process_test_pack',
  PROCESS_PACK_PROCESS_AREA_MAP: 'process_pack_process_area_map',
  ORA_PROCESS_PACK: 'ora_process_pack'
  
};
