import { registerBlock } from '../../registry';

import TourPackageBlock, { definition as tourPackageDef } from './tour-package';
import ItineraryBlock, { definition as itineraryDef } from './itinerary';
import VisaTrackerBlock, { definition as visaTrackerDef } from './visa-tracker';
import TicketBookingBlock, { definition as ticketBookingDef } from './ticket-booking';
import RideEstimateBlock, { definition as rideEstimateDef } from './ride-estimate';
import ShipmentTrackerBlock, { definition as shipmentTrackerDef } from './shipment-tracker';
import QuoteBuilderBlock, { definition as quoteBuilderDef } from './quote-builder';
import DocumentChecklistBlock, { definition as documentChecklistDef } from './document-checklist';
import ScheduleGridBlock, { definition as scheduleGridDef } from './schedule-grid';
import TravelInsuranceBlock, { definition as travelInsuranceDef } from './travel-insurance';
import TransferBookingBlock, { definition as transferBookingDef } from './transfer-booking';
import TravelerReviewBlock, { definition as travelerReviewDef } from './traveler-review';
import DestinationCardBlock, { definition as destinationCardDef } from './destination-card';
import MovingEstimateBlock, { definition as movingEstimateDef } from './moving-estimate';

export function registerTravelTransportBlocks(): void {
  registerBlock(tourPackageDef, TourPackageBlock);
  registerBlock(itineraryDef, ItineraryBlock);
  registerBlock(visaTrackerDef, VisaTrackerBlock);
  registerBlock(ticketBookingDef, TicketBookingBlock);
  registerBlock(rideEstimateDef, RideEstimateBlock);
  registerBlock(shipmentTrackerDef, ShipmentTrackerBlock);
  registerBlock(quoteBuilderDef, QuoteBuilderBlock);
  registerBlock(documentChecklistDef, DocumentChecklistBlock);
  registerBlock(scheduleGridDef, ScheduleGridBlock);
  registerBlock(travelInsuranceDef, TravelInsuranceBlock);
  registerBlock(transferBookingDef, TransferBookingBlock);
  registerBlock(travelerReviewDef, TravelerReviewBlock);
  registerBlock(destinationCardDef, DestinationCardBlock);
  registerBlock(movingEstimateDef, MovingEstimateBlock);
}

export {
  TourPackageBlock, ItineraryBlock, VisaTrackerBlock, TicketBookingBlock,
  RideEstimateBlock, ShipmentTrackerBlock, QuoteBuilderBlock, DocumentChecklistBlock,
  ScheduleGridBlock, TravelInsuranceBlock, TransferBookingBlock, TravelerReviewBlock,
  DestinationCardBlock, MovingEstimateBlock,
};
