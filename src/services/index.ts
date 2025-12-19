/**
 * Services - barrel export
 */

export { ConstructionService, type ConstructionServiceConfig } from './construction-service';
export { GanttService, type GanttServiceConfig } from './gantt-service';
export {
  ScheduleService,
  type ScheduleServiceConfig,
  type ScheduleCreateInput,
  type ScheduleUpdateInput,
  type ProgressUpdateInput,
  type AlertConfig,
  type ScheduleAlert,
} from './schedule-service';
export { ReportService, type ReportConfig } from './report-service';
export { DashboardService } from './dashboard-service';
export {
  createConstructionProgressDashboard,
  createEquipmentManagementDashboard,
  createPersonnelAllocationDashboard,
  createSafetyManagementDashboard,
} from './dashboard-templates';
