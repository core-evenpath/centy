import { registerBlock } from '../../registry';

import ProductCardBlock, { definition as productCardDef } from './product-card';
import LoanCalcBlock, { definition as loanCalcDef } from './loan-calc';
import AccountSnapshotBlock, { definition as accountSnapshotDef } from './account-snapshot';
import ApplicationBlock, { definition as applicationDef } from './application';
import RateCompareBlock, { definition as rateCompareDef } from './rate-compare';
import PortfolioBlock, { definition as portfolioDef } from './portfolio';
import InsuranceBlock, { definition as insuranceDef } from './insurance';
import CreditScoreBlock, { definition as creditScoreDef } from './credit-score';
import TransferBlock, { definition as transferDef } from './transfer';
import DocUploadBlock, { definition as docUploadDef } from './doc-upload';
import AppTrackerBlock, { definition as appTrackerDef } from './app-tracker';
import AdvisorBlock, { definition as advisorDef } from './advisor';
import ReviewBlock, { definition as reviewDef } from './review';
import EligibilityBlock, { definition as eligibilityDef } from './eligibility';

export function registerFinancialServicesBlocks(): void {
  registerBlock(productCardDef, ProductCardBlock);
  registerBlock(loanCalcDef, LoanCalcBlock);
  registerBlock(accountSnapshotDef, AccountSnapshotBlock);
  registerBlock(applicationDef, ApplicationBlock);
  registerBlock(rateCompareDef, RateCompareBlock);
  registerBlock(portfolioDef, PortfolioBlock);
  registerBlock(insuranceDef, InsuranceBlock);
  registerBlock(creditScoreDef, CreditScoreBlock);
  registerBlock(transferDef, TransferBlock);
  registerBlock(docUploadDef, DocUploadBlock);
  registerBlock(appTrackerDef, AppTrackerBlock);
  registerBlock(advisorDef, AdvisorBlock);
  registerBlock(reviewDef, ReviewBlock);
  registerBlock(eligibilityDef, EligibilityBlock);
}

export {
  ProductCardBlock, LoanCalcBlock, AccountSnapshotBlock, ApplicationBlock,
  RateCompareBlock, PortfolioBlock, InsuranceBlock, CreditScoreBlock,
  TransferBlock, DocUploadBlock, AppTrackerBlock, AdvisorBlock,
  ReviewBlock, EligibilityBlock,
};
