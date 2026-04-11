import { registerBlock } from '../../registry';

import CourseCardBlock, { definition as courseCardDef } from './course-card';
import CourseDetailBlock, { definition as courseDetailDef } from './course-detail';
import ScheduleBlock, { definition as scheduleDef } from './schedule';
import InstructorBlock, { definition as instructorDef } from './instructor';
import CurriculumBlock, { definition as curriculumDef } from './curriculum';
import EnrollmentBlock, { definition as enrollmentDef } from './enrollment';
import ProgressBlock, { definition as progressDef } from './progress';
import AssessmentBlock, { definition as assessmentDef } from './assessment';
import FeeStructureBlock, { definition as feeStructureDef } from './fee-structure';
import StudentReviewBlock, { definition as studentReviewDef } from './student-review';
import BatchSelectorBlock, { definition as batchSelectorDef } from './batch-selector';
import CertificateBlock, { definition as certificateDef } from './certificate';
import ResourcesBlock, { definition as resourcesDef } from './resources';
import FacilityBlock, { definition as facilityDef } from './facility';

export function registerEducationBlocks(): void {
  registerBlock(courseCardDef, CourseCardBlock);
  registerBlock(courseDetailDef, CourseDetailBlock);
  registerBlock(scheduleDef, ScheduleBlock);
  registerBlock(instructorDef, InstructorBlock);
  registerBlock(curriculumDef, CurriculumBlock);
  registerBlock(enrollmentDef, EnrollmentBlock);
  registerBlock(progressDef, ProgressBlock);
  registerBlock(assessmentDef, AssessmentBlock);
  registerBlock(feeStructureDef, FeeStructureBlock);
  registerBlock(studentReviewDef, StudentReviewBlock);
  registerBlock(batchSelectorDef, BatchSelectorBlock);
  registerBlock(certificateDef, CertificateBlock);
  registerBlock(resourcesDef, ResourcesBlock);
  registerBlock(facilityDef, FacilityBlock);
}

export {
  CourseCardBlock, CourseDetailBlock, ScheduleBlock, InstructorBlock,
  CurriculumBlock, EnrollmentBlock, ProgressBlock, AssessmentBlock,
  FeeStructureBlock, StudentReviewBlock, BatchSelectorBlock, CertificateBlock,
  ResourcesBlock, FacilityBlock,
};
