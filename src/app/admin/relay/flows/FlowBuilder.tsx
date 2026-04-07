'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import FlowCanvas from './FlowCanvas';
import StagePanel from './StagePanel';
import { T } from './flow-builder-types';
import type {
  FlowBuilderTemplate,
  FlowBuilderStage,
  FlowBuilderTransition,
  SubVerticalFlowSummary,
  VerticalGroup,
} from './flow-builder-types';
import {
  updateSystemFlowTemplateAction,
  createSystemFlowTemplateAction,
  seedSystemFlowTemplatesToDB,
  getSystemFlowTemplatesFromDB,
} from '@/actions/flow-engine-actions';
import { generateFlowForSubVertical } from '@/lib/flow-templates';

// ── Props ────────────────────────────────────────────────────────────

interface FlowBuilderProps {
  initialTemplates: FlowBuilderTemplate[];
  verticalGroups: VerticalGroup[];
  subVerticalSummaries: SubVerticalFlowSummary[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function mapTemplateToBuilder(t: { id: string; name: string; status?: string; stages: Array<{ id: string; label?: string; name?: string; type: string; blockTypes?: string[]; blockIds?: string[]; intentTriggers?: unknown[]; leadScoreImpact?: number; isEntry?: boolean; isExit?: boolean }>; transitions: Array<{ from: string; to: string; trigger: string | unknown; priority?: number }> }): FlowBuilderTemplate {
  return {
    id: t.id,
    name: t.name,
    status: t.status || 'draft',
    stages: (t.stages || []).map(s => ({
      id: s.id,
      name: s.label || s.name || s.id,
      type: s.type || s.id,
      blockIds: s.blockTypes || s.blockIds || [],
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
  };
}

// ── Component ────────────────────────────────────────────────────────

export default function FlowBuilder({ initialTemplates, verticalGroups, subVerticalSummaries }: FlowBuilderProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [editedStages, setEditedStages] = useState<FlowBuilderStage[]>([]);
  const [editedTransitions, setEditedTransitions] = useState<FlowBuilderTransition[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sub-vertical navigation state
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [expandedVerticals, setExpandedVerticals] = useState<Set<string>>(new Set());
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [templateSource, setTemplateSource] = useState<'db' | 'custom' | 'generated' | null>(null);

  // Build a lookup from functionId → summary
  const summaryMap = useMemo(() => {
    const m = new Map<string, SubVerticalFlowSummary>();
    for (const sv of subVerticalSummaries) m.set(sv.functionId, sv);
    return m;
  }, [subVerticalSummaries]);

  // Build a lookup from functionId → DB template
  const dbTemplateMap = useMemo(() => {
    const m = new Map<string, FlowBuilderTemplate>();
    for (const t of templates) {
      // Match by functionId embedded in template id (tpl_{functionId})
      const fnId = t.id.startsWith('tpl_') ? t.id.slice(4) : null;
      if (fnId) m.set(fnId, t);
    }
    return m;
  }, [templates]);

  // Filter sub-verticals by sidebar search
  const filteredVerticalGroups = useMemo(() => {
    if (!sidebarSearch.trim()) return verticalGroups;
    const q = sidebarSearch.toLowerCase();
    return verticalGroups
      .map(vg => ({
        ...vg,
        subVerticalIds: vg.subVerticalIds.filter(svId => {
          const sv = summaryMap.get(svId);
          return sv && (sv.name.toLowerCase().includes(q) || sv.verticalName.toLowerCase().includes(q));
        }),
      }))
      .filter(vg => vg.subVerticalIds.length > 0);
  }, [verticalGroups, sidebarSearch, summaryMap]);

  // Load flow when a sub-vertical is selected
  useEffect(() => {
    if (!selectedFunctionId) return;

    // 1. Check DB template
    const dbTpl = dbTemplateMap.get(selectedFunctionId);
    if (dbTpl) {
      setEditedStages(dbTpl.stages);
      setEditedTransitions(dbTpl.transitions);
      setSelectedTemplateId(dbTpl.id);
      setTemplateSource('db');
      setDirty(false);
      setSelectedStageId(null);
      return;
    }

    // 2. Generate from registry (includes hand-crafted check internally)
    const generated = generateFlowForSubVertical(selectedFunctionId);
    if (generated) {
      const mapped = mapTemplateToBuilder(generated);
      setEditedStages(mapped.stages);
      setEditedTransitions(mapped.transitions);
      setSelectedTemplateId(mapped.id);
      setTemplateSource(generated.description?.startsWith('Auto-generated') ? 'generated' : 'custom');
      setDirty(false);
      setSelectedStageId(null);
      return;
    }

    // 3. No flow available
    setEditedStages([]);
    setEditedTransitions([]);
    setSelectedTemplateId(null);
    setTemplateSource(null);
    setDirty(false);
    setSelectedStageId(null);
  }, [selectedFunctionId, dbTemplateMap]);

  // Legacy: populate from template pills (when no sub-vertical selected)
  useEffect(() => {
    if (selectedFunctionId) return; // sub-vertical mode takes precedence
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (tpl) {
      setEditedStages(tpl.stages);
      setEditedTransitions(tpl.transitions);
      setDirty(false);
      setSelectedStageId(null);
    }
  }, [selectedTemplateId, templates, selectedFunctionId]);

  const selectedStage = editedStages.find(s => s.id === selectedStageId) ?? null;
  const selectedSummary = selectedFunctionId ? summaryMap.get(selectedFunctionId) : null;

  const handleUpdateStage = useCallback((updated: FlowBuilderStage) => {
    setEditedStages(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedTemplateId || !dirty) return;
    setSaving(true);
    try {
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

      if (templateSource === 'db') {
        // Update existing DB template
        await updateSystemFlowTemplateAction(
          selectedTemplateId,
          { stages: firestoreStages, transitions: firestoreTransitions } as Record<string, unknown>,
          'admin',
        );
      } else if (selectedFunctionId) {
        // Create new DB template from generated/custom flow
        const summary = summaryMap.get(selectedFunctionId);
        await createSystemFlowTemplateAction({
          id: selectedTemplateId,
          name: summary?.name ? `${summary.name} Flow` : selectedTemplateId,
          industryId: summary?.industryId || '',
          functionId: selectedFunctionId,
          industryName: summary?.verticalName || '',
          functionName: summary?.name || '',
          description: `Flow template for ${summary?.name || selectedFunctionId}`,
          stages: firestoreStages,
          transitions: firestoreTransitions,
        } as Record<string, unknown>, 'admin');
        setTemplateSource('db');
      }
      setDirty(false);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [selectedTemplateId, dirty, editedStages, editedTransitions, templateSource, selectedFunctionId, summaryMap]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await seedSystemFlowTemplatesToDB('admin');
      const res = await getSystemFlowTemplatesFromDB();
      if (res.success && res.templates) {
        const mapped: FlowBuilderTemplate[] = res.templates.map(t => mapTemplateToBuilder(t));
        setTemplates(mapped);
      }
    } catch (e) {
      console.error('Seed failed:', e);
    } finally {
      setSeeding(false);
    }
  }, []);

  function toggleVertical(id: string) {
    setExpandedVerticals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectSubVertical(functionId: string) {
    setSelectedFunctionId(functionId);
    setSelectedStageId(null);
  }

  // Count stats for header
  const totalSubVerticals = subVerticalSummaries.length;
  const coveredCount = subVerticalSummaries.filter(
    sv => sv.hasDbTemplate || sv.hasCustomTemplate,
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link href="/admin/relay" style={{ fontSize: 9, fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '1.5px', textDecoration: 'none' }}>Admin / Relay</Link>
            <div style={{ fontSize: 20, fontWeight: 600, color: T.t1, marginTop: 2 }}>Flow Builder</div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
              {totalSubVerticals} sub-verticals &middot; {coveredCount} with templates &middot; {templates.length} saved
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSeed} disabled={seeding} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.surface, color: T.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: seeding ? 0.6 : 1 }}>
              {seeding ? 'Seeding...' : 'Seed Defaults'}
            </button>
            <button onClick={handleSave} disabled={!dirty || saving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: dirty ? T.pri : T.bdrM, color: '#fff', fontSize: 11, fontWeight: 600, cursor: dirty ? 'pointer' : 'default', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Main layout: Sidebar + Canvas + StagePanel */}
      <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>

        {/* Left Sidebar — Vertical Accordion */}
        <div style={{
          width: 260, flexShrink: 0, background: T.surface,
          borderRight: `1px solid ${T.bdr}`, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.bdr}` }}>
            <input
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              placeholder="Search sub-verticals..."
              style={{
                width: '100%', fontSize: 11, padding: '6px 10px', borderRadius: 6,
                border: `1px solid ${T.bdr}`, background: T.bg, color: T.t1,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Vertical list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredVerticalGroups.map(vg => {
              const isExpanded = expandedVerticals.has(vg.id) || sidebarSearch.trim().length > 0;
              const svCount = vg.subVerticalIds.length;
              const dbCount = vg.subVerticalIds.filter(id => summaryMap.get(id)?.hasDbTemplate).length;

              return (
                <div key={vg.id}>
                  {/* Vertical header */}
                  <button
                    onClick={() => toggleVertical(vg.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      borderBottom: `1px solid ${T.bdr}`,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: vg.accentColor, flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.t1 }}>
                      {vg.name}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
                      background: dbCount === svCount && svCount > 0 ? T.greenBg : T.bg,
                      color: dbCount === svCount && svCount > 0 ? T.green : T.t4,
                    }}>
                      {dbCount}/{svCount}
                    </span>
                    <span style={{ fontSize: 10, color: T.t4, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      &#9654;
                    </span>
                  </button>

                  {/* Sub-vertical list */}
                  {isExpanded && (
                    <div style={{ background: T.bg }}>
                      {vg.subVerticalIds.map(svId => {
                        const sv = summaryMap.get(svId);
                        if (!sv) return null;
                        const isSelected = selectedFunctionId === svId;
                        const dotColor = sv.hasDbTemplate ? T.green : sv.hasCustomTemplate ? T.amber : T.t4;

                        return (
                          <button
                            key={svId}
                            onClick={() => selectSubVertical(svId)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px 6px 28px', border: 'none',
                              background: isSelected ? T.priBg : 'transparent',
                              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            }}
                          >
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: dotColor, flexShrink: 0,
                            }} />
                            <span style={{
                              flex: 1, fontSize: 10, fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? T.t1 : T.t2,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {sv.name}
                            </span>
                            <span style={{ fontSize: 8, color: T.t4 }}>{sv.blockCount}b</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar footer — legacy template pills */}
          {!selectedFunctionId && templates.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.bdr}`, padding: '8px 12px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Saved Templates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {templates.map(tpl => {
                  const active = tpl.id === selectedTemplateId && !selectedFunctionId;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => { setSelectedFunctionId(null); setSelectedTemplateId(tpl.id); }}
                      style={{
                        padding: '4px 8px', borderRadius: 5, border: 'none', fontSize: 10,
                        fontWeight: active ? 600 : 400, textAlign: 'left',
                        background: active ? T.priBg : 'transparent',
                        color: active ? T.t1 : T.t3,
                        cursor: 'pointer', fontFamily: 'inherit',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {tpl.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center — Canvas area */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Sub-vertical header bar */}
          {selectedSummary && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '10px 14px', background: T.surface, border: `1px solid ${T.bdr}`,
              borderRadius: 10,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>{selectedSummary.name}</div>
                <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>
                  {selectedSummary.verticalName} &middot; {selectedSummary.blockCount} blocks &middot; {editedStages.length} stages
                </div>
              </div>
              {templateSource && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                  background: templateSource === 'db' ? T.greenBg : templateSource === 'custom' ? T.blueBg : T.amberBg,
                  color: templateSource === 'db' ? T.green : templateSource === 'custom' ? T.blue : T.amber,
                  textTransform: 'uppercase', letterSpacing: '0.3px',
                }}>
                  {templateSource === 'db' ? 'Saved' : templateSource === 'custom' ? 'Built-in' : 'Auto-generated'}
                </span>
              )}
              {dirty && (
                <span style={{ fontSize: 9, fontWeight: 500, color: T.amber }}>Unsaved changes</span>
              )}
            </div>
          )}

          {/* Flow canvas */}
          {editedStages.length > 0 ? (
            <FlowCanvas
              stages={editedStages}
              transitions={editedTransitions}
              selectedStageId={selectedStageId}
              onSelectStage={setSelectedStageId}
            />
          ) : (
            <div style={{
              padding: 60, textAlign: 'center', color: T.t4, fontSize: 13,
              background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 12,
            }}>
              {selectedFunctionId
                ? 'No blocks found for this sub-vertical. Check the block registry.'
                : 'Select a sub-vertical from the sidebar to view its conversation flow.'}
            </div>
          )}
        </div>

        {/* Right — Stage Panel */}
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
