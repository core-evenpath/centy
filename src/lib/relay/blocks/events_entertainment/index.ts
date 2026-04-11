import { registerBlock } from '../../registry';

import ServiceCardBlock, { definition as serviceCardDef } from './service-card';
import PortfolioBlock, { definition as portfolioDef } from './portfolio';
import VendorProfileBlock, { definition as vendorProfileDef } from './vendor-profile';
import EventPackageBlock, { definition as eventPackageDef } from './event-package';
import AvailabilityBlock, { definition as availabilityDef } from './availability';
import QuoteBuilderBlock, { definition as quoteBuilderDef } from './quote-builder';
import TimelineBlock, { definition as timelineDef } from './timeline';
import VenueCardBlock, { definition as venueCardDef } from './venue-card';
import ShowListingBlock, { definition as showListingDef } from './show-listing';
import MoodBoardBlock, { definition as moodBoardDef } from './mood-board';
import EquipmentBlock, { definition as equipmentDef } from './equipment';
import ClientReviewBlock, { definition as clientReviewDef } from './client-review';
import SeatingChartBlock, { definition as seatingChartDef } from './seating-chart';
import InviteRsvpBlock, { definition as inviteRsvpDef } from './invite-rsvp';

export function registerEventsEntertainmentBlocks(): void {
  registerBlock(serviceCardDef, ServiceCardBlock);
  registerBlock(portfolioDef, PortfolioBlock);
  registerBlock(vendorProfileDef, VendorProfileBlock);
  registerBlock(eventPackageDef, EventPackageBlock);
  registerBlock(availabilityDef, AvailabilityBlock);
  registerBlock(quoteBuilderDef, QuoteBuilderBlock);
  registerBlock(timelineDef, TimelineBlock);
  registerBlock(venueCardDef, VenueCardBlock);
  registerBlock(showListingDef, ShowListingBlock);
  registerBlock(moodBoardDef, MoodBoardBlock);
  registerBlock(equipmentDef, EquipmentBlock);
  registerBlock(clientReviewDef, ClientReviewBlock);
  registerBlock(seatingChartDef, SeatingChartBlock);
  registerBlock(inviteRsvpDef, InviteRsvpBlock);
}

export {
  ServiceCardBlock, PortfolioBlock, VendorProfileBlock, EventPackageBlock,
  AvailabilityBlock, QuoteBuilderBlock, TimelineBlock, VenueCardBlock,
  ShowListingBlock, MoodBoardBlock, EquipmentBlock, ClientReviewBlock,
  SeatingChartBlock, InviteRsvpBlock,
};
