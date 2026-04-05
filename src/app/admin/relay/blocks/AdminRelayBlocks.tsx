'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { seedDefaultBlocksAction, resetAllBlockConfigsAction, toggleBlockStatusAction } from '@/actions/relay-admin-actions';
import { SHARED_BLOCKS, VERTICALS, ALL_BLOCKS } from './previews/registry';
import { getAllFamilies } from './previews/registry';
import type { VerticalBlockDef, VerticalConfig } from './previews/_types';

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
    return blocks;
  }, [filterVertical, filterFamily]);

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

  const sel = selectedBlock ? ALL_BLOCKS.find(b => b.id === selectedBlock) : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

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
            <button onClick={handleSeed} disabled={seeding} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.6 : 1 }}>{seeding ? 'Seeding...' : 'Seed Defaults'}</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "3px", padding: "3px", background: T.bg, borderRadius: "8px" }}>
            <button onClick={() => { setFilterVertical('all'); setFilterFamily('all'); }} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: filterVertical === 'all' ? 600 : 400, background: filterVertical === 'all' ? T.surface : "transparent", color: filterVertical === 'all' ? T.t1 : T.t3, cursor: "pointer", boxShadow: filterVertical === 'all' ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>All ({ALL_BLOCKS.length})</button>
            <button onClick={() => { setFilterVertical('shared'); setFilterFamily('all'); }} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: filterVertical === 'shared' ? 600 : 400, background: filterVertical === 'shared' ? T.surface : "transparent", color: filterVertical === 'shared' ? T.t1 : T.t3, cursor: "pointer", boxShadow: filterVertical === 'shared' ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>Shared ({SHARED_BLOCKS.length})</button>
            {VERTICALS.map(v => (
              <button key={v.id} onClick={() => { setFilterVertical(v.id); setFilterFamily('all'); }} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: filterVertical === v.id ? 600 : 400, background: filterVertical === v.id ? T.surface : "transparent", color: filterVertical === v.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: filterVertical === v.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{v.name} ({v.blocks.length})</button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "4px", padding: "3px", background: T.bg, borderRadius: "8px" }}>
            {([{ id: "grid" as const, l: "Grid" }, { id: "list" as const, l: "List" }]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: viewMode === v.id ? 600 : 400, background: viewMode === v.id ? T.surface : "transparent", color: viewMode === v.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: viewMode === v.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{v.l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "3px", marginTop: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterFamily('all')} style={{ padding: "4px 10px", borderRadius: "9999px", border: filterFamily === 'all' ? "none" : `1px solid ${T.bdr}`, background: filterFamily === 'all' ? T.pri : T.surface, color: filterFamily === 'all' ? "#fff" : T.t3, fontSize: "10px", fontWeight: 500, cursor: "pointer" }}>All families</button>
          {familiesInView.map(f => {
            const count = visibleBlocks.filter(b => b.family === f).length;
            if (filterFamily !== 'all' && filterFamily !== f && count === 0) return null;
            return (
              <button key={f} onClick={() => setFilterFamily(filterFamily === f ? 'all' : f)} style={{ padding: "4px 10px", borderRadius: "9999px", border: filterFamily === f ? "none" : `1px solid ${T.bdr}`, background: filterFamily === f ? getFamilyColor(f) : T.surface, color: filterFamily === f ? "#fff" : T.t3, fontSize: "10px", fontWeight: 500, cursor: "pointer" }}>{getFamilyLabel(f)} ({count})</button>
            );
          })}
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
                  return (
                    <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{ background: T.surface, border: isSel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden", opacity: isOn ? 1 : 0.45, cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
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
                      <div style={{ padding: "5px 10px", borderTop: `1px solid ${T.bdr}`, background: T.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", color: T.t4 }}>Stage: <span style={{ fontWeight: 600, color: T.t2 }}>{b.stage}</span></span>
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
                  return (
                    <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "8px", background: T.surface, border: isSel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, cursor: "pointer", opacity: isOn ? 1 : 0.55, transition: "all 0.15s" }}>
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

          {sel && (
            <div style={{ width: "320px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start" }}>
              <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "12px", borderBottom: `1px solid ${T.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1 }}>{sel.label}</div>
                    <button onClick={() => setSelectedBlock(null)} style={{ background: "none", border: "none", fontSize: "14px", color: T.t4, cursor: "pointer" }}>&#10005;</button>
                  </div>
                  <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{sel.desc}</div>
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                    <span style={{ fontSize: "8px", fontWeight: 600, color: getFamilyColor(sel.family), background: `${getFamilyColor(sel.family)}10`, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{sel.family}</span>
                    <span style={{ fontSize: "8px", fontWeight: 500, color: T.t3, background: T.bg, padding: "2px 6px", borderRadius: "4px" }}>Stage: {sel.stage}</span>
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

                <div style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                  <button onClick={() => toggleBlock(sel.id)} style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "none", background: enabledBlocks[sel.id] !== false ? T.red : T.green, fontSize: "10px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>{enabledBlocks[sel.id] !== false ? "Disable" : "Enable"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
