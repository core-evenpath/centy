'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { seedDefaultBlocksAction, resetAllBlockConfigsAction, toggleBlockStatusAction, syncRegistryToFirestoreAction, bulkToggleBlockStatusAction } from '@/actions/relay-admin-actions';
import { SHARED_BLOCKS, VERTICALS, ALL_BLOCKS } from './previews/registry';
import { getAllFamilies } from './previews/registry';
import type { VerticalBlockDef } from './previews/_types';
import { FLOW_STAGE_STYLES } from './previews/_types';

const T = {
  pri: "#2d4a3e", priLt: "#3d6354", priBg: "rgba(45,74,62,0.06)", priBg2: "rgba(45,74,62,0.12)",
  acc: "#c4704b", accBg: "rgba(196,112,75,0.06)", accBg2: "rgba(196,112,75,0.12)",
  bg: "#f7f3ec", surface: "#ffffff", card: "#f2ede5",
  t1: "#1a1a18", t2: "#3d3d38", t3: "#7a7a70", t4: "#a8a89e",
  bdr: "#e8e4dc", bdrM: "#d4d0c8",
  green: "#2d6a4f", greenBg: "rgba(45,106,79,0.06)", greenBdr: "rgba(45,106,79,0.12)",
  red: "#b91c1c", redBg: "rgba(185,28,28,0.05)",
  amber: "#b45309", amberBg: "rgba(180,83,9,0.06)",
  blue: "#1d4ed8", blueBg: "rgba(29,78,216,0.06)",
  pink: "#be185d", pinkBg: "rgba(190,24,93,0.06)",
};

const ALL_FAMILIES = getAllFamilies();

function getFamilyColor(family: string): string {
  return ALL_FAMILIES[family]?.color || T.t3;
}

function getFamilyLabel(family: string): string {
  return ALL_FAMILIES[family]?.label || family;
}

interface Props {
  initialBlocks?: Array<{ id: string; status: string }>;
}

export default function AdminRelayBlocks({ initialBlocks }: Props) {
  const [enabledBlocks, setEnabledBlocks] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    ALL_BLOCKS.forEach(b => {
      const init = initialBlocks?.find(ib => ib.id === b.id);
      m[b.id] = init ? init.status === 'active' : b.status === 'active';
    });
    return m;
  });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterFamily, setFilterFamily] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSyncStatus, setFilterSyncStatus] = useState<'all' | 'synced' | 'not_synced' | 'active' | 'disabled'>('all');
  const [filterStage, setFilterStage] = useState('all');
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);

  // ── Diagnostics: cross-reference registry vs Firestore ──────────────
  const diagnostics = useMemo(() => {
    const fsMap = new Map((initialBlocks || []).map(b => [b.id, b.status]));
    const blockVerticalMap = new Map<string, string>();
    for (const v of VERTICALS) {
      for (const b of v.blocks) blockVerticalMap.set(b.id, v.id);
    }
    for (const b of SHARED_BLOCKS) {
      if (!blockVerticalMap.has(b.id)) blockVerticalMap.set(b.id, 'shared');
    }

    const perBlock: Record<string, { syncState: 'synced_active' | 'synced_disabled' | 'not_synced'; inFirestore: boolean }> = {};
    let synced = 0, active = 0, disabled = 0, notSynced = 0, moduleBound = 0;
    const byVertical: Record<string, { total: number; synced: number; active: number; notSynced: number }> = {};

    for (const b of ALL_BLOCKS) {
      const fsStatus = fsMap.get(b.id) || null;
      const inFs = !!fsStatus;
      const syncState = inFs ? (fsStatus === 'active' ? 'synced_active' as const : 'synced_disabled' as const) : 'not_synced' as const;
      perBlock[b.id] = { syncState, inFirestore: inFs };

      if (inFs) { synced++; if (fsStatus === 'active') active++; else disabled++; } else { notSynced++; }
      if (b.module) moduleBound++;

      const vId = blockVerticalMap.get(b.id) || 'shared';
      if (!byVertical[vId]) byVertical[vId] = { total: 0, synced: 0, active: 0, notSynced: 0 };
      byVertical[vId].total++;
      if (inFs) { byVertical[vId].synced++; if (fsStatus === 'active') byVertical[vId].active++; }
      else byVertical[vId].notSynced++;
    }

    return { perBlock, total: ALL_BLOCKS.length, synced, active, disabled, notSynced, moduleBound, byVertical };
  }, [initialBlocks]);

  const visibleBlocks = useMemo(() => {
    let blocks: VerticalBlockDef[] = [];
    if (filterVertical === 'all') {
      blocks = ALL_BLOCKS;
    } else if (filterVertical === 'shared') {
      blocks = SHARED_BLOCKS;
    } else {
      const v = VERTICALS.find(v => v.id === filterVertical);
      blocks = v ? [...SHARED_BLOCKS, ...v.blocks] : ALL_BLOCKS;
    }
    if (filterFamily !== 'all') {
      blocks = blocks.filter(b => b.family === filterFamily);
    }
    if (filterStage !== 'all') {
      blocks = blocks.filter(b => b.stage === filterStage);
    }
    if (filterSyncStatus !== 'all') {
      blocks = blocks.filter(b => {
        const d = diagnostics.perBlock[b.id];
        if (!d) return false;
        switch (filterSyncStatus) {
          case 'synced': return d.inFirestore;
          case 'not_synced': return !d.inFirestore;
          case 'active': return d.syncState === 'synced_active';
          case 'disabled': return d.syncState === 'synced_disabled';
          default: return true;
        }
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      blocks = blocks.filter(b =>
        b.label.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.family.toLowerCase().includes(q) ||
        b.stage.toLowerCase().includes(q) ||
        b.intents.some(i => i.toLowerCase().includes(q))
      );
    }
    return blocks;
  }, [filterVertical, filterFamily, filterStage, filterSyncStatus, searchQuery, diagnostics]);

  const familiesInView = useMemo(() => {
    let blocks: VerticalBlockDef[] = [];
    if (filterVertical === 'all') blocks = ALL_BLOCKS;
    else if (filterVertical === 'shared') blocks = SHARED_BLOCKS;
    else {
      const v = VERTICALS.find(v => v.id === filterVertical);
      blocks = v ? [...SHARED_BLOCKS, ...v.blocks] : ALL_BLOCKS;
    }
    return [...new Set(blocks.map(b => b.family))];
  }, [filterVertical]);

  const toggleBlock = async (id: string) => {
    const newVal = !enabledBlocks[id];
    setEnabledBlocks(prev => ({ ...prev, [id]: newVal }));
    await toggleBlockStatusAction(id, newVal);
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedDefaultBlocksAction();
    setSeeding(false);
    window.location.reload();
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all block configs? This cannot be undone.')) return;
    setResetting(true);
    await resetAllBlockConfigsAction();
    setResetting(false);
    window.location.reload();
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncRegistryToFirestoreAction();
    setSyncing(false);
    window.location.reload();
  };

  const handleBulkToggle = async (enabled: boolean) => {
    const ids = visibleBlocks.map(b => b.id);
    const label = enabled ? 'enable' : 'disable';
    if (!window.confirm(`Are you sure you want to ${label} ${ids.length} blocks?`)) return;
    setBulkActing(true);
    await bulkToggleBlockStatusAction(ids, enabled);
    setEnabledBlocks(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = enabled; });
      return next;
    });
    setBulkActing(false);
  };

  const sel = selectedBlock ? ALL_BLOCKS.find(b => b.id === selectedBlock) : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Link href="/admin/relay" style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1.5px", textDecoration: "none" }}>Admin / Relay</Link>
            <div style={{ fontSize: "22px", fontWeight: 600, color: T.t1, marginTop: "2px" }}>Block Registry</div>
            <div style={{ fontSize: "13px", color: T.t3, marginTop: "2px" }}>
              {ALL_BLOCKS.length} blocks across {VERTICALS.length} verticals. Enable, disable, and preview.
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleReset} disabled={resetting} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${T.red}`, background: T.redBg, color: T.red, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: resetting ? 0.6 : 1 }}>{resetting ? 'Resetting...' : 'Reset All'}</button>
            <button onClick={handleSync} disabled={syncing} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${T.pri}`, background: T.priBg, color: T.pri, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: syncing ? 0.6 : 1 }}>{syncing ? 'Syncing...' : 'Sync Registry'}</button>
            <button onClick={handleSeed} disabled={seeding} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.6 : 1 }}>{seeding ? 'Seeding...' : 'Seed Defaults'}</button>
          </div>
        </div>
      </div>

      {/* ── Diagnostics Panel ─────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}` }}>
        <button onClick={() => setShowDiagnostics(!showDiagnostics)} style={{ width: "100%", padding: "8px 32px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "1px" }}>
          <span style={{ transform: showDiagnostics ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>&#9654;</span>
          Diagnostics
        </button>
        {showDiagnostics && (
          <div style={{ padding: "0 32px 16px" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { label: "Total", value: diagnostics.total, color: T.t1, bg: T.bg },
                { label: "Synced", value: diagnostics.synced, color: T.green, bg: T.greenBg },
                { label: "Active", value: diagnostics.active, color: T.green, bg: T.greenBg },
                { label: "Disabled", value: diagnostics.disabled, color: T.amber, bg: T.amberBg },
                { label: "Not Synced", value: diagnostics.notSynced, color: T.red, bg: T.redBg },
                { label: "Module-bound", value: diagnostics.moduleBound, color: T.blue, bg: T.blueBg },
              ].map(s => (
                <div key={s.label} style={{ flex: "1 1 100px", padding: "10px 14px", borderRadius: "10px", background: s.bg, border: `1px solid ${s.color}15`, minWidth: "100px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px", opacity: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Sync health bar */}
            {diagnostics.total > 0 && (
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", marginTop: "12px", background: T.bg }}>
                {diagnostics.active > 0 && <div style={{ flex: diagnostics.active, background: T.green, transition: "flex 0.3s" }} />}
                {diagnostics.disabled > 0 && <div style={{ flex: diagnostics.disabled, background: T.amber, transition: "flex 0.3s" }} />}
                {diagnostics.notSynced > 0 && <div style={{ flex: diagnostics.notSynced, background: T.red, transition: "flex 0.3s" }} />}
              </div>
            )}
            {/* Per-vertical table (only if issues) */}
            {diagnostics.notSynced > 0 && (
              <div style={{ marginTop: "12px", borderRadius: "8px", border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 80px", padding: "6px 12px", background: T.bg, fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <span>Vertical</span><span style={{ textAlign: "center" }}>Total</span><span style={{ textAlign: "center" }}>Synced</span><span style={{ textAlign: "center" }}>Active</span><span style={{ textAlign: "center" }}>Not Synced</span>
                </div>
                {[{ id: 'shared', name: 'Shared' }, ...VERTICALS.map(v => ({ id: v.id, name: v.name }))].map(v => {
                  const s = diagnostics.byVertical[v.id];
                  if (!s) return null;
                  return (
                    <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 80px", padding: "5px 12px", fontSize: "11px", color: T.t2, borderTop: `1px solid ${T.bdr}`, background: s.notSynced > 0 ? T.redBg : "transparent" }}>
                      <span style={{ fontWeight: 500 }}>{v.name}</span>
                      <span style={{ textAlign: "center" }}>{s.total}</span>
                      <span style={{ textAlign: "center", color: T.green }}>{s.synced}</span>
                      <span style={{ textAlign: "center", color: T.green }}>{s.active}</span>
                      <span style={{ textAlign: "center", color: s.notSynced > 0 ? T.red : T.t4, fontWeight: s.notSynced > 0 ? 600 : 400 }}>{s.notSynced}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Quick action */}
            {diagnostics.notSynced > 0 && (
              <button onClick={handleSeed} disabled={seeding} style={{ marginTop: "10px", padding: "6px 14px", borderRadius: "7px", border: "none", background: T.red, color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.6 : 1 }}>
                {seeding ? 'Seeding...' : `Seed ${diagnostics.notSynced} missing blocks`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Filters (sticky) ──────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: "12px 32px" }}>
        {/* Search bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search blocks by name, description, intent, family, stage..."
          style={{ width: "100%", padding: "9px 14px", borderRadius: "8px", border: `1px solid ${T.bdr}`, fontSize: "13px", color: T.t1, background: T.bg, outline: "none", fontFamily: "inherit" }}
        />
        {/* Filter row */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Vertical dropdown */}
          <select
            value={filterVertical}
            onChange={e => { setFilterVertical(e.target.value); setFilterFamily('all'); }}
            style={{ padding: "6px 10px", borderRadius: "7px", border: `1px solid ${T.bdr}`, fontSize: "12px", color: T.t1, background: T.surface, cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="all">All verticals ({ALL_BLOCKS.length})</option>
            <option value="shared">Shared ({SHARED_BLOCKS.length})</option>
            {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.name} ({v.blocks.length})</option>)}
          </select>
          {/* Stage dropdown */}
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "7px", border: `1px solid ${T.bdr}`, fontSize: "12px", color: T.t1, background: T.surface, cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="all">All stages</option>
            {Object.keys(FLOW_STAGE_STYLES).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          {/* Sync status chips */}
          <div style={{ display: "flex", gap: "3px", padding: "3px", background: T.bg, borderRadius: "8px" }}>
            {([
              { id: 'all' as const, label: 'All', count: diagnostics.total, color: T.t3 },
              { id: 'active' as const, label: 'Active', count: diagnostics.active, color: T.green },
              { id: 'disabled' as const, label: 'Disabled', count: diagnostics.disabled, color: T.amber },
              { id: 'not_synced' as const, label: 'Not Synced', count: diagnostics.notSynced, color: T.red },
            ]).map(c => (
              <button key={c.id} onClick={() => setFilterSyncStatus(c.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: filterSyncStatus === c.id ? 600 : 400, background: filterSyncStatus === c.id ? T.surface : "transparent", color: filterSyncStatus === c.id ? c.color : T.t4, cursor: "pointer", boxShadow: filterSyncStatus === c.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                {c.label} ({c.count})
              </button>
            ))}
          </div>
          {/* View mode toggle */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "4px", padding: "3px", background: T.bg, borderRadius: "8px" }}>
            {([{ id: "grid" as const, l: "Grid" }, { id: "list" as const, l: "List" }]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: viewMode === v.id ? 600 : 400, background: viewMode === v.id ? T.surface : "transparent", color: viewMode === v.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: viewMode === v.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{v.l}</button>
            ))}
          </div>
        </div>
        {/* Family pills + bulk actions */}
        <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setFilterFamily('all')} style={{ padding: "5px 12px", borderRadius: "9999px", border: filterFamily === 'all' ? "none" : `1px solid ${T.bdr}`, background: filterFamily === 'all' ? T.pri : T.surface, color: filterFamily === 'all' ? "#fff" : T.t3, fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>All families</button>
          {familiesInView.map(f => {
            const count = visibleBlocks.filter(b => b.family === f).length;
            if (filterFamily !== 'all' && filterFamily !== f && count === 0) return null;
            return (
              <button key={f} onClick={() => setFilterFamily(filterFamily === f ? 'all' : f)} style={{ padding: "5px 12px", borderRadius: "9999px", border: filterFamily === f ? "none" : `1px solid ${T.bdr}`, background: filterFamily === f ? getFamilyColor(f) : T.surface, color: filterFamily === f ? "#fff" : T.t3, fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>{getFamilyLabel(f)} ({count})</button>
            );
          })}
          {/* Bulk actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            <button onClick={() => handleBulkToggle(true)} disabled={bulkActing} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${T.green}`, background: T.greenBg, color: T.green, fontSize: "10px", fontWeight: 600, cursor: "pointer", opacity: bulkActing ? 0.6 : 1 }}>Enable All Visible ({visibleBlocks.length})</button>
            <button onClick={() => handleBulkToggle(false)} disabled={bulkActing} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${T.red}`, background: T.redBg, color: T.red, fontSize: "10px", fontWeight: 600, cursor: "pointer", opacity: bulkActing ? 0.6 : 1 }}>Disable All Visible</button>
          </div>
        </div>
        {/* Results count */}
        <div style={{ fontSize: "11px", color: T.t4, marginTop: "8px" }}>
          Showing {visibleBlocks.length} of {ALL_BLOCKS.length} blocks
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ flex: 1 }}>
            {viewMode === 'grid' ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "12px" }}>
                {visibleBlocks.map(b => {
                  const Preview = b.preview;
                  const isOn = enabledBlocks[b.id] !== false;
                  const isSel = selectedBlock === b.id;
                  const fc = getFamilyColor(b.family);
                  const syncDot = diagnostics.perBlock[b.id]?.syncState === 'synced_active' ? T.green : diagnostics.perBlock[b.id]?.syncState === 'synced_disabled' ? T.amber : T.red;
                  const stageStyle = FLOW_STAGE_STYLES[b.stage];
                  return (
                    <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{ background: T.surface, border: isSel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden", opacity: isOn ? 1 : 0.45, cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span title={diagnostics.perBlock[b.id]?.syncState?.replace(/_/g, ' ') || ''} style={{ width: 7, height: 7, borderRadius: "50%", background: syncDot, flexShrink: 0 }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: T.t1 }}>{b.label}</span>
                          <span style={{ fontSize: "7px", fontWeight: 600, color: fc, background: `${fc}10`, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase" }}>{b.family}</span>
                          {b.status === 'new' && <span style={{ fontSize: "7px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "1px 5px", borderRadius: "3px" }}>NEW</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleBlock(b.id); }} style={{ width: 34, height: 18, borderRadius: 9, cursor: "pointer", position: "relative", border: "none", padding: 0, background: isOn ? T.green : T.bdrM, transition: "background 0.2s", flexShrink: 0 }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isOn ? 18 : 2, transition: "left 0.2s" }} />
                        </button>
                      </div>
                      <div style={{ padding: "8px", pointerEvents: "none", transform: "scale(0.94)", transformOrigin: "top center" }}>
                        <Preview />
                      </div>
                      <div style={{ padding: "5px 10px", borderTop: `1px solid ${T.bdr}`, background: stageStyle?.color || T.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", color: stageStyle?.textColor || T.t4, fontWeight: 600 }}>{b.stage.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: "8px", color: b.module ? T.blue : T.t4 }}>{b.module ? 'Module-bound' : 'Config only'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {visibleBlocks.map(b => {
                  const isOn = enabledBlocks[b.id] !== false;
                  const isSel = selectedBlock === b.id;
                  const fc = getFamilyColor(b.family);
                  const syncDotL = diagnostics.perBlock[b.id]?.syncState === 'synced_active' ? T.green : diagnostics.perBlock[b.id]?.syncState === 'synced_disabled' ? T.amber : T.red;
                  const stageStyleL = FLOW_STAGE_STYLES[b.stage];
                  return (
                    <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "8px", background: T.surface, border: isSel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, borderLeft: `3px solid ${stageStyleL?.textColor || T.bdr}`, cursor: "pointer", opacity: isOn ? 1 : 0.55, transition: "all 0.15s" }}>
                      <span title={diagnostics.perBlock[b.id]?.syncState?.replace(/_/g, ' ') || ''} style={{ width: 8, height: 8, borderRadius: "50%", background: syncDotL, flexShrink: 0 }} />
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${fc}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: fc, fontWeight: 700, flexShrink: 0 }}>{b.label[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{b.label}</span>
                          {b.status === 'new' && <span style={{ fontSize: "7px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "1px 5px", borderRadius: "3px" }}>NEW</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: T.t3, marginTop: "1px" }}>{b.desc}</div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                          <span style={{ fontSize: "8px", color: fc, background: `${fc}10`, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase", fontWeight: 600 }}>{b.family}</span>
                          <span style={{ fontSize: "8px", color: T.t4, background: T.bg, padding: "1px 5px", borderRadius: "3px" }}>Stage: {b.stage}</span>
                          {b.module && <span style={{ fontSize: "8px", color: T.blue, background: T.blueBg, padding: "1px 5px", borderRadius: "3px" }}>module</span>}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleBlock(b.id); }} style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", position: "relative", border: "none", padding: 0, background: isOn ? T.green : T.bdrM, transition: "background 0.2s", flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isOn ? 18 : 2, transition: "left 0.2s" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {sel && (() => {
            const selDiag = diagnostics.perBlock[sel.id];
            const selSyncColor = selDiag?.syncState === 'synced_active' ? T.green : selDiag?.syncState === 'synced_disabled' ? T.amber : T.red;
            const selSyncLabel = selDiag?.inFirestore ? (selDiag.syncState === 'synced_active' ? 'Synced - Active' : 'Synced - Disabled') : 'Not Synced';
            const selStageStyle = FLOW_STAGE_STYLES[sel.stage];
            return (
            <div style={{ width: "360px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start" }}>
              <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "12px", borderBottom: `1px solid ${T.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: selSyncColor, flexShrink: 0 }} />
                      <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1 }}>{sel.label}</div>
                    </div>
                    <button onClick={() => setSelectedBlock(null)} style={{ background: "none", border: "none", fontSize: "14px", color: T.t4, cursor: "pointer" }}>&#10005;</button>
                  </div>
                  <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{sel.desc}</div>
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "8px", fontWeight: 600, color: getFamilyColor(sel.family), background: `${getFamilyColor(sel.family)}10`, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{sel.family}</span>
                    <span style={{ fontSize: "8px", fontWeight: 500, color: selStageStyle?.textColor || T.t3, background: selStageStyle?.color || T.bg, padding: "2px 6px", borderRadius: "4px" }}>{sel.stage.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: "8px", fontWeight: 500, color: enabledBlocks[sel.id] !== false ? T.green : T.red, background: enabledBlocks[sel.id] !== false ? T.greenBg : T.redBg, padding: "2px 6px", borderRadius: "4px" }}>{enabledBlocks[sel.id] !== false ? "Active" : "Disabled"}</span>
                  </div>
                </div>

                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Live preview</div>
                  <div style={{ transform: "scale(0.92)", transformOrigin: "top left" }}>
                    <sel.preview />
                  </div>
                </div>

                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Intent triggers ({sel.intents.length})</div>
                  {sel.intents.length > 0 ? (
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                      {sel.intents.map(i => <span key={i} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "9999px", background: T.priBg, color: T.pri, fontWeight: 500 }}>{i}</span>)}
                    </div>
                  ) : (
                    <div style={{ fontSize: "10px", color: T.t4, fontStyle: "italic" }}>System-triggered only</div>
                  )}
                </div>

                {sel.module && (
                  <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Module binding</div>
                    <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", background: T.blueBg, color: T.blue, fontWeight: 500, fontFamily: "monospace" }}>{sel.module}</span>
                  </div>
                )}

                {/* Sync status */}
                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Backend sync</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: selSyncColor }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: selSyncColor }}>{selSyncLabel}</span>
                  </div>
                  {!selDiag?.inFirestore && (
                    <div style={{ fontSize: "10px", color: T.t4, marginTop: "4px", lineHeight: 1.4 }}>
                      This block exists in the registry but hasn&apos;t been seeded to Firestore yet. Click &quot;Seed Defaults&quot; to sync.
                    </div>
                  )}
                </div>

                <div style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                  <button onClick={() => toggleBlock(sel.id)} style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "none", background: enabledBlocks[sel.id] !== false ? T.red : T.green, fontSize: "10px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>{enabledBlocks[sel.id] !== false ? "Disable" : "Enable"}</button>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
