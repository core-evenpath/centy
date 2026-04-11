import { registerBlock } from '../../registry';

import ServiceCardBlock, { definition as serviceCardDef } from './service-card';
import ServiceDetailBlock, { definition as serviceDetailDef } from './service-detail';
import CategoryBrowserBlock, { definition as categoryBrowserDef } from './category-browser';
import StylistProfileBlock, { definition as stylistProfileDef } from './stylist-profile';
import AppointmentBlock, { definition as appointmentDef } from './appointment';
import MembershipTierBlock, { definition as membershipTierDef } from './membership-tier';
import BeforeAfterBlock, { definition as beforeAfterDef } from './before-after';
import SpaPackageBlock, { definition as spaPackageDef } from './spa-package';
import ClassScheduleBlock, { definition as classScheduleDef } from './class-schedule';
import GiftCardBlock, { definition as giftCardDef } from './gift-card';
import ProductShopBlock, { definition as productShopDef } from './product-shop';
import LoyaltyProgressBlock, { definition as loyaltyProgressDef } from './loyalty-progress';
import ClientReviewBlock, { definition as clientReviewDef } from './client-review';
import IntakeFormBlock, { definition as intakeFormDef } from './intake-form';

export function registerPersonalWellnessBlocks(): void {
  registerBlock(serviceCardDef, ServiceCardBlock);
  registerBlock(serviceDetailDef, ServiceDetailBlock);
  registerBlock(categoryBrowserDef, CategoryBrowserBlock);
  registerBlock(stylistProfileDef, StylistProfileBlock);
  registerBlock(appointmentDef, AppointmentBlock);
  registerBlock(membershipTierDef, MembershipTierBlock);
  registerBlock(beforeAfterDef, BeforeAfterBlock);
  registerBlock(spaPackageDef, SpaPackageBlock);
  registerBlock(classScheduleDef, ClassScheduleBlock);
  registerBlock(giftCardDef, GiftCardBlock);
  registerBlock(productShopDef, ProductShopBlock);
  registerBlock(loyaltyProgressDef, LoyaltyProgressBlock);
  registerBlock(clientReviewDef, ClientReviewBlock);
  registerBlock(intakeFormDef, IntakeFormBlock);
}

export {
  ServiceCardBlock, ServiceDetailBlock, CategoryBrowserBlock, StylistProfileBlock,
  AppointmentBlock, MembershipTierBlock, BeforeAfterBlock, SpaPackageBlock,
  ClassScheduleBlock, GiftCardBlock, ProductShopBlock, LoyaltyProgressBlock,
  ClientReviewBlock, IntakeFormBlock,
};
