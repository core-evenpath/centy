import { registerBlock } from '../../registry';

import ServiceCardBlock, { definition as serviceCardDef } from './service-card';
import CategoryBrowserBlock, { definition as categoryBrowserDef } from './category-browser';
import TechnicianBlock, { definition as technicianDef } from './technician';
import EstimateBlock, { definition as estimateDef } from './estimate';
import SchedulerBlock, { definition as schedulerDef } from './scheduler';
import JobTrackerBlock, { definition as jobTrackerDef } from './job-tracker';
import BeforeAfterBlock, { definition as beforeAfterDef } from './before-after';
import ServiceRequestBlock, { definition as serviceRequestDef } from './service-request';
import MaintenancePlanBlock, { definition as maintenancePlanDef } from './maintenance-plan';
import EmergencyBlock, { definition as emergencyDef } from './emergency';
import HistoryBlock, { definition as historyDef } from './history';
import WarrantyBlock, { definition as warrantyDef } from './warranty';
import ReviewBlock, { definition as reviewDef } from './review';
import AreaCoverageBlock, { definition as areaCoverageDef } from './area-coverage';

export function registerHomePropertyBlocks(): void {
  registerBlock(serviceCardDef, ServiceCardBlock);
  registerBlock(categoryBrowserDef, CategoryBrowserBlock);
  registerBlock(technicianDef, TechnicianBlock);
  registerBlock(estimateDef, EstimateBlock);
  registerBlock(schedulerDef, SchedulerBlock);
  registerBlock(jobTrackerDef, JobTrackerBlock);
  registerBlock(beforeAfterDef, BeforeAfterBlock);
  registerBlock(serviceRequestDef, ServiceRequestBlock);
  registerBlock(maintenancePlanDef, MaintenancePlanBlock);
  registerBlock(emergencyDef, EmergencyBlock);
  registerBlock(historyDef, HistoryBlock);
  registerBlock(warrantyDef, WarrantyBlock);
  registerBlock(reviewDef, ReviewBlock);
  registerBlock(areaCoverageDef, AreaCoverageBlock);
}

export {
  ServiceCardBlock, CategoryBrowserBlock, TechnicianBlock, EstimateBlock,
  SchedulerBlock, JobTrackerBlock, BeforeAfterBlock, ServiceRequestBlock,
  MaintenancePlanBlock, EmergencyBlock, HistoryBlock, WarrantyBlock,
  ReviewBlock, AreaCoverageBlock,
};
