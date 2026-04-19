// Info flow templates registry (P2.info.M03).
//
// Info is the narrowest engine with the shortest flow. 1 template
// covers all 3 info-primary functionIds + info-secondary partners that
// need an info-first flow when activeEngine='info'.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { INFO_DIRECTORY_FLOW_TEMPLATE } from './directory-navigation';

export { INFO_DIRECTORY_FLOW_TEMPLATE };

export const INFO_FLOW_TEMPLATES: Readonly<Record<string, SystemFlowTemplate>> = {
  public_transport: INFO_DIRECTORY_FLOW_TEMPLATE,
  government:       INFO_DIRECTORY_FLOW_TEMPLATE,
  utilities:        INFO_DIRECTORY_FLOW_TEMPLATE,
};

export function getInfoFlowTemplate(
  functionId: string | null | undefined,
): SystemFlowTemplate | null {
  if (!functionId) return null;
  return INFO_FLOW_TEMPLATES[functionId] ?? null;
}
