import { registerBlock } from '../../registry';

import ServiceCardBlock, { definition as serviceCardDef } from './service-card';
import ProviderProfileBlock, { definition as providerProfileDef } from './provider-profile';
import AppointmentBlock, { definition as appointmentDef } from './appointment';
import SymptomCheckerBlock, { definition as symptomCheckerDef } from './symptom-checker';
import InsuranceBlock, { definition as insuranceDef } from './insurance';
import LabResultsBlock, { definition as labResultsDef } from './lab-results';
import PrescriptionBlock, { definition as prescriptionDef } from './prescription';
import PatientIntakeBlock, { definition as patientIntakeDef } from './patient-intake';
import TreatmentPlanBlock, { definition as treatmentPlanDef } from './treatment-plan';
import TelehealthBlock, { definition as telehealthDef } from './telehealth';
import WaitTimeBlock, { definition as waitTimeDef } from './wait-time';
import FacilityBlock, { definition as facilityDef } from './facility';
import PatientReviewBlock, { definition as patientReviewDef } from './patient-review';
import PetProfileBlock, { definition as petProfileDef } from './pet-profile';

export function registerHealthcareBlocks(): void {
  registerBlock(serviceCardDef, ServiceCardBlock);
  registerBlock(providerProfileDef, ProviderProfileBlock);
  registerBlock(appointmentDef, AppointmentBlock);
  registerBlock(symptomCheckerDef, SymptomCheckerBlock);
  registerBlock(insuranceDef, InsuranceBlock);
  registerBlock(labResultsDef, LabResultsBlock);
  registerBlock(prescriptionDef, PrescriptionBlock);
  registerBlock(patientIntakeDef, PatientIntakeBlock);
  registerBlock(treatmentPlanDef, TreatmentPlanBlock);
  registerBlock(telehealthDef, TelehealthBlock);
  registerBlock(waitTimeDef, WaitTimeBlock);
  registerBlock(facilityDef, FacilityBlock);
  registerBlock(patientReviewDef, PatientReviewBlock);
  registerBlock(petProfileDef, PetProfileBlock);
}

export {
  ServiceCardBlock, ProviderProfileBlock, AppointmentBlock, SymptomCheckerBlock,
  InsuranceBlock, LabResultsBlock, PrescriptionBlock, PatientIntakeBlock,
  TreatmentPlanBlock, TelehealthBlock, WaitTimeBlock, FacilityBlock,
  PatientReviewBlock, PetProfileBlock,
};
