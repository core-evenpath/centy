// ── Curated schema: food_beverage_operations ────────────────────────
//
// Back-office checklists, prep schedules, FOH briefings, closing
// procedures, cleaning routines, inventory + maintenance tasks.
// Mostly internal; surfaces in chat only when staff ask "what's
// on the closing checklist?" or similar internal queries via the
// staff-facing channel.

import type { CuratedSchema } from '../types';

const operations: CuratedSchema = {
  name: 'Operations',
  description:
    'Back-office checklists, prep schedules, FOH briefings, closing procedures, cleaning routines.',
  contentCategory: 'operations',
  itemLabel: 'Procedure',
  itemLabelPlural: 'Procedures',
  defaultCurrency: 'USD',
  fields: [
    // ── Identity ────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Kitchen prep schedule, FOH briefing',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Full procedure description.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Kitchen Prep',
        'FOH Briefing',
        'Opening',
        'Closing',
        'Cleaning',
        'Inventory',
        'Stocktake',
        'Maintenance',
        'Safety',
        'Training',
        'Health & Hygiene',
        'Cash Handling',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Schedule ────────────────────────────────────────────────
    {
      name: 'frequency',
      type: 'select',
      options: ['Per shift', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Yearly', 'On demand'],
    },
    {
      name: 'shift',
      type: 'select',
      options: ['Morning', 'Lunch', 'Dinner', 'Late', 'All-day', 'Overnight'],
    },
    {
      name: 'day_of_week',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      name: 'time_of_day',
      type: 'time',
      description: 'Anchor time the procedure starts.',
    },
    {
      name: 'duration_minutes',
      type: 'number',
      placeholder: 'How long it usually takes',
    },

    // ── Ownership & resourcing ──────────────────────────────────
    {
      name: 'owner_role',
      type: 'select',
      options: [
        'Head Chef',
        'Sous Chef',
        'Pastry Chef',
        'GM',
        'FOH Manager',
        'Bar Manager',
        'Server',
        'Host',
        'Cleaner',
        'Maintenance',
        'Owner',
      ],
    },
    {
      name: 'staff_required',
      type: 'number',
      description: 'How many staff members the task needs.',
    },
    {
      name: 'station',
      type: 'text',
      placeholder: 'e.g. Pantry, Sauce, Grill, Bar, Dish pit',
    },

    // ── Process detail ──────────────────────────────────────────
    {
      name: 'prep_steps',
      type: 'textarea',
      placeholder: '1. Mise en place stations\n2. Stock check\n3. ...',
      description: 'Step-by-step procedure.',
    },
    {
      name: 'cleanup_steps',
      type: 'textarea',
      placeholder: 'Closing-specific breakdown procedure.',
    },
    {
      name: 'equipment_required',
      type: 'tags',
      description: 'Equipment / tools needed.',
    },
    {
      name: 'chemicals_required',
      type: 'tags',
      description: 'Cleaning chemicals — surface MSDS warnings in training.',
    },
    {
      name: 'safety_notes',
      type: 'textarea',
      description: 'Safety reminders, PPE requirements, hazards.',
    },

    // ── Tracking ────────────────────────────────────────────────
    {
      name: 'last_completed_at',
      type: 'date',
      description: 'When was this last marked done.',
    },
    {
      name: 'next_due_at',
      type: 'date',
    },
    {
      name: 'priority',
      type: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'],
    },

    // ── Compliance ──────────────────────────────────────────────
    {
      name: 'requires_signoff',
      type: 'toggle',
      description: 'Manager must sign off after completion.',
    },
    {
      name: 'audit_trail',
      type: 'toggle',
      description: 'Record completions in the audit log.',
    },
    {
      name: 'compliance_standard',
      type: 'text',
      placeholder: 'e.g. ServSafe, HACCP, Local health code',
      description: 'Regulatory standard this procedure satisfies.',
    },

    // ── Marketing meta (mostly internal, but useful for tagging) ─
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — opening, closing, deep-clean, weekly.',
    },

    // ── Internal ────────────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default operations;
