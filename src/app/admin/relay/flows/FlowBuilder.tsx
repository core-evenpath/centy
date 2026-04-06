'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FlowCanvas from './FlowCanvas';
import StagePanel from './StagePanel';
import { T } from './flow-builder-types';
import type {
  FlowBuilderTemplate,
  FlowBuilderStage,
  FlowBuilderTransition,
} from './flow-builder-types';
import {
  updateSystemFlowTemplateAction,
  seedSystemFlowTemplatesToDB,
  getSystemFlowTemplatesFromDB,
} from '@/actions/flow-engine-actions';

// ── Props ────────────────────────────────────────────────────────────

interface FlowBuilderProps {
  initialTemplates: FlowBuilderTemplate[];
}

// ── Component ────────────────────────────────────────────────────────

export default function FlowBuilder({ initialTemplates }: FlowBuilderProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplates[0]?.id ?? null,
  );
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [editedStages, setEditedStages] = useState<FlowBuilderStage[]>([]);
  const [editedTransitions, setEditedTransitions] = useState<FlowBuilderTransition[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Populate edited state when template selection changes
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (tpl) {
      setEditedStages(tpl.stages);
      setEditedTransitions(tpl.transitions);
      setDirty(false);
      setSelectedStageId(null);
    }
  }, [selectedTemplateId, templates]);

  const selectedStage = editedStages.find(s => s.id === selectedStageId) ?? null;

  const handleUpdateStage = useCallback((updated: FlowBuilderStage) => {
    setEditedStages(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedTemplateId || !dirty) return;
    setSaving(true);
    try {
      // Convert FlowBuilderStage back to FlowStage shape for Firestore
      const firestoreStages = editedStages.map(s => ({
        id: s.id,
        type: s.type,
        label: s.name,
        blockTypes: s.blockIds,
        intentTriggers: s.intentTriggers,
        leadScoreImpact: s.leadScoreImpact,
        ...(s.isEntry ? { isEntry: true } : {}),
        ...(s.isExit ? { isExit: true } : {}),
      }));
      const firestoreTransitions = editedTransitions.map(tr => ({
        from: tr.from,
        to: tr.to,
        trigger: tr.trigger,
        ...(tr.priority != null ? { priority: tr.priority } : {}),
      }));

      await updateSystemFlowTemplateAction(
        selectedTemplateId,
        { stages: firestoreStages, transitions: firestoreTransitions } as Record<string, unknown>,
        'admin',
      );
      setDirty(false);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [selectedTemplateId, dirty, editedStages, editedTransitions]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await seedSystemFlowTemplatesToDB('admin');
      // Reload templates
      const res = await getSystemFlowTemplatesFromDB();
      if (res.success && res.templates) {
        const mapped: FlowBuilderTemplate[] = res.templates.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status || 'draft',
          stages: (t.stages || []).map(s => ({
            id: s.id,
            name: s.label || s.id,
            type: s.type || s.id,
            blockIds: s.blockTypes || [],
            intentTriggers: (s.intentTriggers || []) as string[],
            leadScoreImpact: s.leadScoreImpact || 0,
            isEntry: s.isEntry,
            isExit: s.isExit,
          })),
          transitions: (t.transitions || []).map(tr => ({
            from: tr.from,
            to: tr.to,
            trigger: tr.trigger as string,
            priority: tr.priority,
          })),
        }));
        setTemplates(mapped);
        if (!selectedTemplateId && mapped.length > 0) {
          setSelectedTemplateId(mapped[0].id);
        }
      }
    } catch (e) {
      console.error('Seed failed:', e);
    } finally {
      setSeeding(false);
    }
  }, [selectedTemplateId]);

  const totalStages = editedStages.length;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link href="/admin/relay" style={{ fontSize: 9, fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '1.5px', textDecoration: 'none' }}>Admin / Relay</Link>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.t1, marginTop: 2 }}>Flow Builder</div>
            <div style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>
              {templates.length} template{templates.length !== 1 ? 's' : ''} &middot; {totalStages} stage{totalStages !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSeed} disabled={seeding} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.surface, color: T.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: seeding ? 0.6 : 1 }}>
              {seeding ? 'Seeding...' : 'Seed Defaults'}
            </button>
            <button onClick={handleSave} disabled={!dirty || saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: dirty ? T.pri : T.bdrM, color: '#fff', fontSize: 12, fontWeight: 600, cursor: dirty ? 'pointer' : 'default', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Template selector pills */}
        {templates.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 16, padding: 3, background: T.bg, borderRadius: 8, overflowX: 'auto' }}>
            {templates.map(tpl => {
              const active = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    background: active ? T.surface : 'transparent',
                    color: active ? T.t1 : T.t3,
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tpl.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main layout: Canvas + Panel */}
      <div style={{ display: 'flex', padding: '24px 32px', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editedStages.length > 0 ? (
            <FlowCanvas
              stages={editedStages}
              transitions={editedTransitions}
              selectedStageId={selectedStageId}
              onSelectStage={setSelectedStageId}
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: T.t4, fontSize: 13 }}>
              {templates.length === 0
                ? 'No templates yet. Click "Seed Defaults" to create default flow templates.'
                : 'Select a template above to view its flow.'}
            </div>
          )}
        </div>

        {selectedStage && (
          <StagePanel
            stage={selectedStage}
            allStages={editedStages}
            transitions={editedTransitions}
            onUpdateStage={handleUpdateStage}
            onClose={() => setSelectedStageId(null)}
          />
        )}
      </div>
    </div>
  );
}
