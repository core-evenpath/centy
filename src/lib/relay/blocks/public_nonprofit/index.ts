import { registerBlock } from '../../registry';

import ServiceDirectoryBlock, { definition as serviceDirectoryDef } from './service-directory';
import ApplicationTrackerBlock, { definition as applicationTrackerDef } from './application-tracker';
import DocumentPortalBlock, { definition as documentPortalDef } from './document-portal';
import EventCalendarBlock, { definition as eventCalendarDef } from './event-calendar';
import DonationBlock, { definition as donationDef } from './donation';
import ImpactReportBlock, { definition as impactReportDef } from './impact-report';
import VolunteerBlock, { definition as volunteerDef } from './volunteer';
import ProgramCardBlock, { definition as programCardDef } from './program-card';
import BillPayBlock, { definition as billPayDef } from './bill-pay';
import OutageStatusBlock, { definition as outageStatusDef } from './outage-status';
import ComplaintBlock, { definition as complaintDef } from './complaint';
import OfficeLocatorBlock, { definition as officeLocatorDef } from './office-locator';
import AppointmentBlock, { definition as appointmentDef } from './appointment';
import FeedbackBlock, { definition as feedbackDef } from './feedback';

export function registerPublicNonprofitBlocks(): void {
  registerBlock(serviceDirectoryDef, ServiceDirectoryBlock);
  registerBlock(applicationTrackerDef, ApplicationTrackerBlock);
  registerBlock(documentPortalDef, DocumentPortalBlock);
  registerBlock(eventCalendarDef, EventCalendarBlock);
  registerBlock(donationDef, DonationBlock);
  registerBlock(impactReportDef, ImpactReportBlock);
  registerBlock(volunteerDef, VolunteerBlock);
  registerBlock(programCardDef, ProgramCardBlock);
  registerBlock(billPayDef, BillPayBlock);
  registerBlock(outageStatusDef, OutageStatusBlock);
  registerBlock(complaintDef, ComplaintBlock);
  registerBlock(officeLocatorDef, OfficeLocatorBlock);
  registerBlock(appointmentDef, AppointmentBlock);
  registerBlock(feedbackDef, FeedbackBlock);
}

export {
  ServiceDirectoryBlock, ApplicationTrackerBlock, DocumentPortalBlock, EventCalendarBlock,
  DonationBlock, ImpactReportBlock, VolunteerBlock, ProgramCardBlock,
  BillPayBlock, OutageStatusBlock, ComplaintBlock, OfficeLocatorBlock,
  AppointmentBlock, FeedbackBlock,
};
