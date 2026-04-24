'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  seedDefaultBlocksAction,
  seedDefaultFlowAction,
  resetAllBlockConfigsAction,
  getRelayDiagnosticsAction,
} from '@/actions/relay-admin-actions';
import { FLOW_STAGE_STYLES } from './blocks/previews/_types';

interface RelayDashboardProps {
  initialStats: {
    activeBlocks: number;
    totalBlocks: number;
    flowStages: number;
    transitions: number;
    intents: number;
  };
  initialDiagnostics: Array<{
    label: string;
    status: string;
    desc: string;
    icon: string;
  }>;
  initialTemplates: Array<{
    id: string;
    name: string;
    desc: string;
    industry: string;
    stages: number;
    status: string;
  }>;
  initialFlowTemplate: {
    id: string;
    name: string;
    stages: Array<{
      id: string; name: string; type: string; blockIds: string[];
      intentTriggers: string[]; leadScoreImpact: number;
      isEntry?: boolean; isExit?: boolean;
    }>;
    transitions: Array<{ from: string; to: string; trigger: string; priority?: number }>;
  } | null;
}

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

interface Stage {
  id: string;
  label: string;
  type: string;
  color: string;
  textColor: string;
  blocks: string[];
  intents: string[];
  leadScore: number;
  isEntry?: boolean;
  isExit?: boolean;
}

const DEFAULT_STAGES: Stage[] = [
  { id: "greeting", label: "Greeting", type: "greeting", color: "#EEEDFE", textColor: "#534AB7", blocks: ["greeting", "suggestions"], intents: ["browsing"], leadScore: 1, isEntry: true },
  { id: "discovery", label: "Discovery", type: "discovery", color: "#E6F1FB", textColor: "#185FA5", blocks: ["product_card", "suggestions", "skin_quiz"], intents: ["browsing", "returning"], leadScore: 2 },
  { id: "showcase", label: "Showcase", type: "showcase", color: "#E1F5EE", textColor: "#0F6E56", blocks: ["product_detail", "promo", "bundle"], intents: ["pricing", "promo"], leadScore: 3 },
  { id: "comparison", label: "Comparison", type: "comparison", color: "#FAEEDA", textColor: "#854F0B", blocks: ["compare"], intents: ["comparing"], leadScore: 2 },
  { id: "social_proof", label: "Social Proof", type: "social_proof", color: "#FBEAF0", textColor: "#993556", blocks: ["nudge", "loyalty"], intents: ["inquiry"], leadScore: 1 },
  { id: "conversion", label: "Conversion", type: "conversion", color: "#EAF3DE", textColor: "#3B6D11", blocks: ["cart", "booking", "subscription", "order_confirmation"], intents: ["booking", "schedule"], leadScore: 5 },
  { id: "handoff", label: "Handoff", type: "handoff", color: "#FCEBEB", textColor: "#A32D2D", blocks: ["contact"], intents: ["contact", "complaint", "urgent"], leadScore: 0, isExit: true },
  { id: "followup", label: "Follow-up", type: "followup", color: "#E8F0FE", textColor: "#1a56db", blocks: ["order_tracker", "nudge"], intents: ["returning"], leadScore: 1 },
];

interface Transition { from: string; to: string; trigger: string; priority?: number; }

const DEFAULT_TRANSITIONS: Transition[] = [
  { from: "greeting", to: "discovery", trigger: "browsing" },
  { from: "greeting", to: "conversion", trigger: "booking", priority: 1 },
  { from: "greeting", to: "handoff", trigger: "urgent", priority: 2 },
  { from: "discovery", to: "showcase", trigger: "pricing" },
  { from: "discovery", to: "comparison", trigger: "comparing" },
  { from: "discovery", to: "conversion", trigger: "booking", priority: 1 },
  { from: "discovery", to: "handoff", trigger: "complaint" },
  { from: "showcase", to: "conversion", trigger: "booking", priority: 1 },
  { from: "showcase", to: "discovery", trigger: "browsing" },
  { from: "showcase", to: "comparison", trigger: "comparing" },
  { from: "comparison", to: "conversion", trigger: "booking" },
  { from: "comparison", to: "showcase", trigger: "pricing" },
  { from: "social_proof", to: "conversion", trigger: "booking" },
  { from: "conversion", to: "followup", trigger: "returning" },
  { from: "conversion", to: "handoff", trigger: "contact" },
  { from: "followup", to: "discovery", trigger: "browsing" },
  { from: "followup", to: "handoff", trigger: "complaint" },
];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active: { color: T.green, bg: T.greenBg },
  draft: { color: T.t3, bg: T.bg },
  archived: { color: T.red, bg: T.redBg },
};

export default function AdminRelayDashboard({ initialStats, initialDiagnostics, initialTemplates, initialFlowTemplate }: RelayDashboardProps) {
  const STAGES: Stage[] = initialFlowTemplate
    ? initialFlowTemplate.stages.map(s => ({
        id: s.id,
        label: s.name,
        type: s.type,
        color: FLOW_STAGE_STYLES[s.type]?.color || '#F1EFE8',
        textColor: FLOW_STAGE_STYLES[s.type]?.textColor || '#5F5E5A',
        blocks: s.blockIds,
        intents: s.intentTriggers,
        leadScore: s.leadScoreImpact,
        isEntry: s.isEntry,
        isExit: s.isExit,
      }))
    : DEFAULT_STAGES;

  const TRANSITIONS: Transition[] = initialFlowTemplate
    ? initialFlowTemplate.transitions.map(t => ({
        from: t.from,
        to: t.to,
        trigger: t.trigger,
        priority: t.priority,
      }))
    : DEFAULT_TRANSITIONS;

  const [tab, setTab] = useState("overview");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [runningDiag, setRunningDiag] = useState(false);
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);

  const selStage = selectedStage ? STAGES.find(s => s.id === selectedStage) : null;
  const stageTransitions = selectedStage ? TRANSITIONS.filter(t => t.from === selectedStage || t.to === selectedStage) : [];

  const handleSeed = async () => {
    setSeeding(true);
    await seedDefaultBlocksAction();
    await seedDefaultFlowAction();
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

  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    const r = await getRelayDiagnosticsAction();
    if (r.success) setDiagnostics(r.checks);
    setRunningDiag(false);
  };

  const handleQuickAction = (action: string) => {
    if (action === "blocks") { window.location.href = "/admin/relay/blocks"; return; }
    if (action === "flows") { setTab("flows"); return; }
    if (action === "diagnostics") { setTab("diagnostics"); return; }
    if (action === "seed") { setTab("seed"); return; }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: "20px 32px" }}>
        <div>
          {/*
            Cross-page nav used to live here as a row of Link buttons;
            consolidated into the shared RelaySubNav which now sits
            above this dashboard (see src/app/admin/relay/page.tsx).
          */}
          <div style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1.5px" }}>Admin</div>
          <div style={{ fontSize: "22px", fontWeight: 600, color: T.t1, marginTop: "2px" }}>Relay Command Center</div>
          <div style={{ fontSize: "13px", color: T.t3, marginTop: "2px" }}>Manage conversation flows, block registry, and widget configuration</div>
        </div>

        <div style={{ display: "flex", gap: "2px", marginTop: "16px", background: T.bg, borderRadius: "8px", padding: "3px" }}>
          {[{ id: "overview", l: "Overview" }, { id: "flows", l: "Chat Flows" }, { id: "templates", l: "Flow Templates" }, { id: "diagnostics", l: "Diagnostics" }, { id: "seed", l: "Seed & Reset" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedStage(null); }} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? T.surface : "transparent", color: tab === t.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>

        {tab === "overview" && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Active Blocks", value: initialStats.activeBlocks, sub: `of ${initialStats.totalBlocks} total`, color: T.green, bg: T.greenBg },
                { label: "Flow Stages", value: initialStats.flowStages, sub: "in default flow", color: T.blue, bg: T.blueBg },
                { label: "Transitions", value: initialStats.transitions, sub: "stage connections", color: T.amber, bg: T.amberBg },
                { label: "Intent Signals", value: initialStats.intents, sub: "mapped intents", color: T.pink, bg: T.pinkBg },
              ].map((s, i) => (
                <div key={i} style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: s.color, marginTop: "4px" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: T.t4, marginTop: "2px" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "16px" }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "View Block Registry", desc: "Browse and configure all relay blocks", action: "blocks" },
                    { label: "Edit Default Flow", desc: "Modify stages, transitions, and intents", action: "flows" },
                    { label: "Run Diagnostics", desc: "Check system health and connectivity", action: "diagnostics" },
                    { label: "Seed Defaults", desc: "Populate default blocks and flow template", action: "seed" },
                  ].map((a, i) => (
                    <button key={i} onClick={() => handleQuickAction(a.action)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "8px", border: `1px solid ${T.bdr}`, background: T.surface, cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{a.label}</div>
                        <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{a.desc}</div>
                      </div>
                      <span style={{ fontSize: "14px", color: T.t4 }}>&#8250;</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "16px" }}>Diagnostics Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {diagnostics.slice(0, 4).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0" }}>
                      <span style={{ fontSize: "16px" }}>{d.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: T.t1 }}>{d.label}</div>
                      </div>
                      <div style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", background: d.status === "pass" ? T.greenBg : d.status === "warn" ? T.amberBg : T.redBg, color: d.status === "pass" ? T.green : d.status === "warn" ? T.amber : T.red }}>{d.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        )}

        {tab === "flows" && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{initialFlowTemplate ? initialFlowTemplate.name : "Default Conversation Flow (E-commerce)"}</div>
                  <Link href="/admin/relay/flows" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>Open Visual Flow Builder →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {STAGES.map((s, i) => (
                    <React.Fragment key={s.id}>
                      <div onClick={() => setSelectedStage(selectedStage === s.id ? null : s.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "10px", background: s.color, border: `2px solid ${selectedStage === s.id ? s.textColor : "transparent"}`, cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", border: `2px solid ${s.textColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: s.textColor, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: s.textColor }}>{s.label}</div>
                          <div style={{ display: "flex", gap: "3px", marginTop: "4px", flexWrap: "wrap" }}>
                            {s.blocks.map(b => (
                              <span key={b} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.5)", color: s.textColor, fontWeight: 500 }}>{b}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {s.isEntry && <span style={{ fontSize: "8px", fontWeight: 600, color: s.textColor, background: "rgba(255,255,255,0.4)", padding: "2px 6px", borderRadius: "3px" }}>ENTRY</span>}
                          {s.isExit && <span style={{ fontSize: "8px", fontWeight: 600, color: s.textColor, background: "rgba(255,255,255,0.4)", padding: "2px 6px", borderRadius: "3px" }}>EXIT</span>}
                          <div style={{ fontSize: "10px", color: s.textColor, marginTop: "2px", opacity: 0.7 }}>Score: +{s.leadScore}</div>
                        </div>
                      </div>
                      {i < STAGES.length - 1 && <div style={{ textAlign: "center", color: T.bdrM, fontSize: "12px" }}>|</div>}
                    </React.Fragment>
                  ))}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "8px" }}>Intent-to-Stage Map</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {Array.from(new Set(STAGES.flatMap(s => s.intents))).map(intent => {
                      const stages = STAGES.filter(s => s.intents.includes(intent));
                      return (
                        <div key={intent} style={{ padding: "4px 10px", borderRadius: "6px", background: stages.length > 0 ? T.priBg : T.bg, border: `1px solid ${stages.length > 0 ? T.priBg2 : T.bdr}`, fontSize: "11px", color: stages.length > 0 ? T.pri : T.t4 }}>
                          {intent} <span style={{ fontWeight: 600 }}>({stages.length})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selStage && (
                <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px", height: "fit-content", position: "sticky", top: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: selStage.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: selStage.textColor }}>{selStage.label[0]}</div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1 }}>{selStage.label}</div>
                      <div style={{ fontSize: "11px", color: T.t3 }}>Stage: {selStage.type}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Blocks</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selStage.blocks.map(b => (
                        <span key={b} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", background: T.priBg, color: T.pri, fontWeight: 500 }}>{b}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Intents</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selStage.intents.map(i => (
                        <span key={i} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", background: T.accBg, color: T.acc, fontWeight: 500 }}>{i}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Transitions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {stageTransitions.map((tr, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px", background: T.bg, fontSize: "11px" }}>
                          <span style={{ fontWeight: 600, color: T.t1 }}>{tr.from}</span>
                          <span style={{ color: T.t4 }}>&#8594;</span>
                          <span style={{ fontWeight: 600, color: T.t1 }}>{tr.to}</span>
                          <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: "4px", background: T.priBg, color: T.pri, fontSize: "10px", fontWeight: 600 }}>{tr.trigger}</span>
                          {tr.priority != null && <span style={{ fontSize: "9px", fontWeight: 700, color: T.amber }}>P{tr.priority}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {tab === "templates" && (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>Flow Templates ({initialTemplates.length})</div>
              <Link href="/admin/relay/flows" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Manage in Flow Editor</Link>
            </div>
            {initialTemplates.length === 0 ? (
              <div style={{ background: T.surface, borderRadius: "12px", border: `2px dashed ${T.bdr}`, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1, marginBottom: "4px" }}>No Flow Templates Yet</div>
                <div style={{ fontSize: "12px", color: T.t3, marginBottom: "16px" }}>Seed the built-in templates from code, or create new ones in the Flow Editor.</div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button onClick={() => setTab("seed")} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${T.bdr}`, background: T.surface, fontSize: "12px", fontWeight: 600, color: T.t1, cursor: "pointer" }}>Seed Defaults</button>
                  <Link href="/admin/relay/flows" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Open Flow Editor</Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                {initialTemplates.map(tmpl => {
                  const sc = STATUS_COLORS[tmpl.status] || STATUS_COLORS.draft;
                  return (
                    <div key={tmpl.id} style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${expandedTemplate === tmpl.id ? T.pri : T.bdr}`, padding: "20px", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setExpandedTemplate(expandedTemplate === tmpl.id ? null : tmpl.id)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: T.t1 }}>{tmpl.name}</div>
                            <span style={{ fontSize: "8px", fontWeight: 700, color: sc.color, background: sc.bg, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{tmpl.status}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: T.t3, marginTop: "4px" }}>{tmpl.desc}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: T.t4, textTransform: "uppercase" }}>{tmpl.industry}</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: T.pri, marginTop: "2px" }}>{tmpl.stages} stages</div>
                        </div>
                      </div>
                      {expandedTemplate === tmpl.id && (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${T.bdr}` }}>
                          <Link href="/admin/relay/flows" style={{ display: "block", width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${T.pri}`, background: T.priBg, fontSize: "11px", fontWeight: 600, color: T.pri, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>Open in Flow Editor</Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        )}

        {tab === "diagnostics" && (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>System Diagnostics</div>
              <button onClick={handleRunDiagnostics} disabled={runningDiag} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: runningDiag ? "not-allowed" : "pointer", opacity: runningDiag ? 0.6 : 1 }}>{runningDiag ? "Running..." : "Run All Checks"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {diagnostics.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderRadius: "10px", background: T.surface, border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: "20px" }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{d.desc}</div>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: d.status === "pass" ? T.greenBg : d.status === "warn" ? T.amberBg : T.redBg, color: d.status === "pass" ? T.green : d.status === "warn" ? T.amber : T.red, border: `1px solid ${d.status === "pass" ? T.greenBdr : d.status === "warn" ? "rgba(180,83,9,0.12)" : "rgba(185,28,28,0.12)"}` }}>{d.status}</div>
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        {tab === "seed" && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "24px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1, marginBottom: "4px" }}>Seed Default Blocks</div>
                <div style={{ fontSize: "12px", color: T.t3, marginBottom: "20px" }}>Populate the block registry and default flow template with the standard set of 16 blocks and 8 stages.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {[
                    "16 relay blocks across 7 families",
                    "8 conversation stages with intent mapping",
                    "17 transition rules with priority",
                    "Module bindings for catalog blocks",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: T.t2 }}>
                      <span style={{ color: T.green, fontSize: "14px" }}>&#10003;</span> {item}
                    </div>
                  ))}
                </div>
                <button onClick={handleSeed} disabled={seeding} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: seeding ? "not-allowed" : "pointer", opacity: seeding ? 0.6 : 1 }}>{seeding ? "Seeding..." : "Seed Default Blocks & Flows"}</button>
              </div>

              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "24px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1, marginBottom: "4px" }}>Reset & Rebuild</div>
                <div style={{ fontSize: "12px", color: T.t3, marginBottom: "20px" }}>Delete all block configs from the registry. Use this to start fresh or fix corrupted state.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {[
                    "Removes all block configs from Firestore",
                    "Does not affect flow templates",
                    "Re-seed after reset to restore defaults",
                    "Cannot be undone",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: T.t2 }}>
                      <span style={{ color: T.red, fontSize: "14px" }}>&#9888;</span> {item}
                    </div>
                  ))}
                </div>
                <button onClick={handleReset} disabled={resetting} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${T.red}`, background: T.redBg, color: T.red, fontSize: "13px", fontWeight: 600, cursor: resetting ? "not-allowed" : "pointer", opacity: resetting ? 0.6 : 1 }}>{resetting ? "Resetting..." : "Reset Block Configs"}</button>
              </div>
            </div>
          </React.Fragment>
        )}

      </div>
    </div>
  );
}
