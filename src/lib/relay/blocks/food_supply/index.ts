import { registerBlock } from '../../registry';

import ProductCardBlock, { definition as productCardDef } from './product-card';
import ProductDetailBlock, { definition as productDetailDef } from './product-detail';
import CatalogBrowserBlock, { definition as catalogBrowserDef } from './catalog-browser';
import BulkOrderBlock, { definition as bulkOrderDef } from './bulk-order';
import SupplierProfileBlock, { definition as supplierProfileDef } from './supplier-profile';
import WholesalePricingBlock, { definition as wholesalePricingDef } from './wholesale-pricing';
import DeliverySchedulerBlock, { definition as deliverySchedulerDef } from './delivery-scheduler';
import OrderTrackerBlock, { definition as orderTrackerDef } from './order-tracker';
import CertComplianceBlock, { definition as certComplianceDef } from './cert-compliance';
import StockStatusBlock, { definition as stockStatusDef } from './stock-status';
import SampleRequestBlock, { definition as sampleRequestDef } from './sample-request';
import QualityReportBlock, { definition as qualityReportDef } from './quality-report';
import RecurringOrderBlock, { definition as recurringOrderDef } from './recurring-order';
import BuyerReviewBlock, { definition as buyerReviewDef } from './buyer-review';

export function registerFoodSupplyBlocks(): void {
  registerBlock(productCardDef, ProductCardBlock);
  registerBlock(productDetailDef, ProductDetailBlock);
  registerBlock(catalogBrowserDef, CatalogBrowserBlock);
  registerBlock(bulkOrderDef, BulkOrderBlock);
  registerBlock(supplierProfileDef, SupplierProfileBlock);
  registerBlock(wholesalePricingDef, WholesalePricingBlock);
  registerBlock(deliverySchedulerDef, DeliverySchedulerBlock);
  registerBlock(orderTrackerDef, OrderTrackerBlock);
  registerBlock(certComplianceDef, CertComplianceBlock);
  registerBlock(stockStatusDef, StockStatusBlock);
  registerBlock(sampleRequestDef, SampleRequestBlock);
  registerBlock(qualityReportDef, QualityReportBlock);
  registerBlock(recurringOrderDef, RecurringOrderBlock);
  registerBlock(buyerReviewDef, BuyerReviewBlock);
}

export {
  ProductCardBlock, ProductDetailBlock, CatalogBrowserBlock, BulkOrderBlock,
  SupplierProfileBlock, WholesalePricingBlock, DeliverySchedulerBlock, OrderTrackerBlock,
  CertComplianceBlock, StockStatusBlock, SampleRequestBlock, QualityReportBlock,
  RecurringOrderBlock, BuyerReviewBlock,
};
