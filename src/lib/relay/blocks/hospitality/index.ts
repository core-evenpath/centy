import { registerBlock } from '../../registry';

import RoomCardBlock, { definition as roomCardDef } from './room-card';
import RoomDetailBlock, { definition as roomDetailDef } from './room-detail';
import AvailabilityBlock, { definition as availabilityDef } from './availability';
import AmenitiesBlock, { definition as amenitiesDef } from './amenities';
import MealPlanBlock, { definition as mealPlanDef } from './meal-plan';
import GuestReviewBlock, { definition as guestReviewDef } from './guest-review';
import CheckInBlock, { definition as checkInDef } from './check-in';
import HouseRulesBlock, { definition as houseRulesDef } from './house-rules';
import ConciergeBlock, { definition as conciergeDef } from './concierge';
import LocalExperiencesBlock, { definition as localExpDef } from './local-experiences';
import TransferBlock, { definition as transferDef } from './transfer';
import PropertyGalleryBlock, { definition as galleryDef } from './property-gallery';

export function registerHospitalityBlocks(): void {
  registerBlock(roomCardDef, RoomCardBlock);
  registerBlock(roomDetailDef, RoomDetailBlock);
  registerBlock(availabilityDef, AvailabilityBlock);
  registerBlock(amenitiesDef, AmenitiesBlock);
  registerBlock(mealPlanDef, MealPlanBlock);
  registerBlock(guestReviewDef, GuestReviewBlock);
  registerBlock(checkInDef, CheckInBlock);
  registerBlock(houseRulesDef, HouseRulesBlock);
  registerBlock(conciergeDef, ConciergeBlock);
  registerBlock(localExpDef, LocalExperiencesBlock);
  registerBlock(transferDef, TransferBlock);
  registerBlock(galleryDef, PropertyGalleryBlock);
}

export {
  RoomCardBlock, RoomDetailBlock, AvailabilityBlock, AmenitiesBlock,
  MealPlanBlock, GuestReviewBlock, CheckInBlock, HouseRulesBlock,
  ConciergeBlock, LocalExperiencesBlock, TransferBlock, PropertyGalleryBlock,
};
