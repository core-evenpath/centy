'use server';

// ── Block context (PR fix-16a) ──────────────────────────────────────
//
// One server roundtrip that returns everything test-chat (or any
// future consumer) needs to know about a block firing in this
// partner's context: schema (from relaySchemas — the
// /admin/relay/data store of record), Transaction Flow membership
// from flow-definitions.ts, and per-partner binding override from
// relayBlockConfigs.
//
// Replaces the older systemModules-driven dispatch on the
// schema-lookup path. Live partner item retrieval still goes through
// businessModules (separate concern — partner data, not schema).

import { db as adminDb } from '@/lib/firebase-admin';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { FLOW_DEFINITIONS } from '@/app/admin/relay/engine/components/flow-definitions';
import type {
  BlockContext,
  BlockContextField,
  BlockContextFlow,
  BlockContextSchema,
} from '@/lib/relay/block-context-types';

// Schema field shape from the relaySchemas doc. Reused across schema
// reads — keeping it loose to match the legacy SystemModule field
// shape without dragging the whole type in.
interface RelaySchemaFieldDoc {
  name?: string;
  fieldName?: string;
  field?: string;
  label?: string;
  type?: string;
  isRequired?: boolean;
  required?: boolean;
}

interface RelaySchemaDoc {
  slug?: string;
  name?: string;
  schema?: { fields?: RelaySchemaFieldDoc[] };
  fields?: RelaySchemaFieldDoc[];
}

/**
 * Fetch the BlockContext for a block in a partner's context.
 *
 * Three reads in parallel: relaySchemas/{slug}, relayBlockConfigs/{blockId},
 * and the in-memory block registry + flow-definitions table. Total
 * ~one Firestore round-trip in practice (in-memory tables are free).
 */
export async function getBlockContextAction(
  partnerId: string,
  blockId: string,
): Promise<{ success: boolean; context?: BlockContext; error?: string }> {
  try {
    const block = ALL_BLOCKS_DATA.find((b) => b.id === blockId);
    if (!block) {
      return { success: false, error: `Unknown block id: ${blockId}` };
    }

    // Schema slug = block.module. Null only for blocks without a
    // schema binding (rare; e.g. some shared helper blocks).
    const slug = block.module ?? null;

    const [schemaDoc, bindingDoc] = await Promise.all([
      slug
        ? adminDb.collection('relaySchemas').doc(slug).get()
        : Promise.resolve(null),
      adminDb.collection('relayBlockConfigs').doc(blockId).get(),
    ]);

    // ── Schema -----------------------------------------------------
    let schema: BlockContextSchema | null = null;
    if (slug && schemaDoc && schemaDoc.exists) {
      const data = schemaDoc.data() as RelaySchemaDoc;
      const rawFields = data.schema?.fields ?? data.fields ?? [];
      const reads = new Set(block.reads ?? []);

      const fields: BlockContextField[] = rawFields.map((f) => {
        const name = f.name ?? f.fieldName ?? f.field ?? '';
        return {
          name,
          label: f.label,
          type: f.type,
          isRead: reads.has(name),
          isRequired: f.isRequired ?? f.required,
        };
      });

      const schemaNames = new Set(fields.map((f) => f.name));
      const drift = (block.reads ?? []).filter((r) => !schemaNames.has(r));

      schema = {
        slug,
        name: data.name ?? slug,
        fieldCount: fields.length,
        fields,
        drift,
      };
    }

    // ── Flow -------------------------------------------------------
    let flow: BlockContextFlow | null = null;
    for (const def of FLOW_DEFINITIONS) {
      const step = def.happyPath.find((s) => s.blockId === blockId);
      if (step) {
        flow = {
          engine: def.engine,
          label: def.label,
          role: step.role,
          required: step.required,
        };
        break;
      }
      // Block might be referenced as a "fires X" callout in chatExample
      // even when it isn't on the canonical happy path. Surface that
      // membership too so test-chat can label the flow context.
      const hit = def.chatExample.some(
        (t) => t.from === 'bot' && t.blockId === blockId,
      );
      if (hit) {
        flow = {
          engine: def.engine,
          label: def.label,
          role: null,
          required: null,
        };
        break;
      }
    }

    // ── Binding ----------------------------------------------------
    // Default is bound — only an explicit `false` in relayBlockConfigs
    // unbinds (matches loadBlockSchemaBindingsAction semantics).
    const bindingData = bindingDoc.exists ? bindingDoc.data() ?? {} : {};
    const isBound = bindingData.bindsSchema !== false;

    void partnerId; // partnerId is currently unused (binding override is
    // global, not per-partner). Keeping the param for API symmetry with
    // the live-data path that does need it.

    const context: BlockContext = {
      block: {
        id: block.id,
        label: block.label,
        family: block.family,
        stage: block.stage,
        desc: block.desc,
      },
      schema,
      flow,
      binding: {
        isBound,
        moduleSlug: slug,
      },
    };

    return { success: true, context };
  } catch (err: any) {
    console.error('[relay-block-context] failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}
