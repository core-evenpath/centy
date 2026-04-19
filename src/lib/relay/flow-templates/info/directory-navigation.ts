// Info flow template — directory / navigation.
//
// Covers: public_transport, utilities, government (info side).
// Info is the narrowest engine: goal is "find information," not
// transact or commit. Flow is short — greeting → discovery of the
// info surface → handoff when user has their answer or needs escalation.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const INFO_DIRECTORY_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'info_tpl_directory',
  name: 'Info Flow — Directory / Navigation',
  industryId: 'public_nonprofit',
  functionId: 'public_transport',
  industryName: 'Public Information',
  functionName: 'Directory / Navigation',
  description: 'Info-engine flow for directory / hours / location / status partners: greet → point to info surface → handoff.',
  engine: 'info',
  serviceIntentBreaks: ['track-status', 'track-outage', 'report-issue'],
  settings: defaultSettings(),
  stages: [
    { id: 'in_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'in_discovery', type: 'discovery', label: 'Directory / Locations', blockTypes: ['pu_service_directory', 'pu_office_locator', 'facility', 'tl_schedule_grid'], intentTriggers: ['browsing', 'inquiry', 'location'], leadScoreImpact: 2 },
    { id: 'in_showcase', type: 'showcase', label: 'Status / Details', blockTypes: ['pu_outage_status', 'pu_document_portal'], intentTriggers: ['inquiry'], leadScoreImpact: 3 },
    { id: 'in_handoff', type: 'handoff', label: 'Contact / Escalate', blockTypes: ['contact', 'pu_office_locator'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'in_greeting', to: 'in_discovery', trigger: 'browsing' },
    { from: 'in_greeting', to: 'in_discovery', trigger: 'inquiry' },
    { from: 'in_greeting', to: 'in_discovery', trigger: 'location' },
    { from: 'in_greeting', to: 'in_handoff', trigger: 'contact' },
    { from: 'in_discovery', to: 'in_showcase', trigger: 'inquiry' },
    { from: 'in_discovery', to: 'in_handoff', trigger: 'contact' },
    { from: 'in_discovery', to: 'in_handoff', trigger: 'complaint' },
    { from: 'in_showcase', to: 'in_handoff', trigger: 'contact' },
    { from: 'in_showcase', to: 'in_handoff', trigger: 'complaint' },
  ],
};
