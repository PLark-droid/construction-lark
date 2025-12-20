/**
 * Services - barrel export
 */

export { ConstructionService, type ConstructionServiceConfig } from './construction-service';
export { GanttService, type GanttServiceConfig } from './gantt-service';
export { DashboardService } from './dashboard-service';
export {
  createConstructionProgressDashboard,
  createEquipmentManagementDashboard,
  createPersonnelAllocationDashboard,
  createSafetyManagementDashboard,
} from './dashboard-templates';
export { SimpleBaseService, type SimpleBaseConfig } from './simple-base-service';
