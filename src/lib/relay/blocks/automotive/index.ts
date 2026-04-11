import { registerBlock } from '../../registry';

import VehicleCardBlock, { definition as vehicleCardDef } from './vehicle-card';
import VehicleDetailBlock, { definition as vehicleDetailDef } from './vehicle-detail';
import ServiceMenuBlock, { definition as serviceMenuDef } from './service-menu';
import ServiceSchedulerBlock, { definition as serviceSchedulerDef } from './service-scheduler';
import PartFinderBlock, { definition as partFinderDef } from './part-finder';
import FinanceCalcBlock, { definition as financeCalcDef } from './finance-calc';
import TradeInBlock, { definition as tradeInDef } from './trade-in';
import ServiceTrackerBlock, { definition as serviceTrackerDef } from './service-tracker';
import TestDriveBlock, { definition as testDriveDef } from './test-drive';
import RentalBuilderBlock, { definition as rentalBuilderDef } from './rental-builder';
import WarrantyBlock, { definition as warrantyDef } from './warranty';
import FleetDashboardBlock, { definition as fleetDashboardDef } from './fleet-dashboard';
import AutoReviewBlock, { definition as autoReviewDef } from './auto-review';
import EvChargerBlock, { definition as evChargerDef } from './ev-charger';

export function registerAutomotiveBlocks(): void {
  registerBlock(vehicleCardDef, VehicleCardBlock);
  registerBlock(vehicleDetailDef, VehicleDetailBlock);
  registerBlock(serviceMenuDef, ServiceMenuBlock);
  registerBlock(serviceSchedulerDef, ServiceSchedulerBlock);
  registerBlock(partFinderDef, PartFinderBlock);
  registerBlock(financeCalcDef, FinanceCalcBlock);
  registerBlock(tradeInDef, TradeInBlock);
  registerBlock(serviceTrackerDef, ServiceTrackerBlock);
  registerBlock(testDriveDef, TestDriveBlock);
  registerBlock(rentalBuilderDef, RentalBuilderBlock);
  registerBlock(warrantyDef, WarrantyBlock);
  registerBlock(fleetDashboardDef, FleetDashboardBlock);
  registerBlock(autoReviewDef, AutoReviewBlock);
  registerBlock(evChargerDef, EvChargerBlock);
}

export {
  VehicleCardBlock, VehicleDetailBlock, ServiceMenuBlock, ServiceSchedulerBlock,
  PartFinderBlock, FinanceCalcBlock, TradeInBlock, ServiceTrackerBlock,
  TestDriveBlock, RentalBuilderBlock, WarrantyBlock, FleetDashboardBlock,
  AutoReviewBlock, EvChargerBlock,
};
