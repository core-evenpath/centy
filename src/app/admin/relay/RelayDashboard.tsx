'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  seedDefaultBlocksAction,
  seedDefaultFlowAction,
  resetAllBlockConfigsAction,
  getRelayDiagnosticsAction,
} from '@/actions/relay-admin-actions';

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

const STAGES: Stage[] = [
  { id: "greeting", label: "Greeting", type: "greeting", color: "#EEEDFE", textColor: "#534AB7", blocks: ["greeting", "suggestions"], intents: ["browsing"], leadScore: 1, isEntry: true },
  { id: "discovery", label: "Discovery", type: "discovery", color: "#E6F1FB", textColor: "#185FA5", blocks: ["product_card", "suggestions", "skin_quiz"], intents: ["browsing", "returning"], leadScore: 2 },
  { id: "showcase", label: "Showcase", type: "showcase", color: "#E1F5EE", textColor: "#0F6E56", blocks: ["product_detail", "promo", "bundle"], intents: ["pricing", "promo"], leadScore: 3 },
  { id: "comparison", label: "Comparison", type: "comparison", color: "#FAEEDA", textColor: "#854F0B", blocks: ["compare"], intents: ["comparing"], leadScore: 2 },
  { id: "social_proof", label: "Social Proof", type: "social_proof", color: "#FBEAF0", textColor: "#993556", blocks: ["nudge", "loyalty"], intents: ["inquiry"], leadScore: 1 },
  { id: "conversion", label: "Conversion", type: "conversion", color: "#EAF3DE", textColor: "#3B6D11", blocks: ["cart", "booking", "subscription", "order_confirmation"], intents: ["booking", "schedule"], leadScore: 5 },
  { id: "handoff", label: "Handoff", type: "handoff", color: "#FCEBEB", textColor: "#A32D2D", blocks: ["contact"], intents: ["contact", "complaint", "urgent"], leadScore: 0, isExit: true },
  { id: "followup", label: "Follow-up", type: "followup", color: "#F1EFE8", textColor: "#5F5E5A", blocks: ["order_tracker", "nudge"], intents: ["returning"], leadScore: 1 },
];

const INTENT_SIGNALS: string[] = ["browsing", "comparing", "pricing", "booking", "inquiry", "complaint", "returning", "urgent", "contact", "promo", "schedule"];

interface Transition {
  from: string;
  to: string;
  trigger: string;
  priority?: number;
}

const TRANSITIONS: Transition[] = [
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

interface FlowTemplate {
  id: string;
  name: string;
  desc: string;
  industry: string;
  stages: number;
}

const FLOW_TEMPLATES: FlowTemplate[] = [
  { id: "ecommerce_d2c", name: "E-commerce D2C", desc: "Product browse → compare → cart → checkout", industry: "Retail", stages: 8 },
  { id: "hotel_resort", name: "Hotels & Resorts", desc: "Room browse → amenities → booking → confirmation", industry: "Hospitality", stages: 7 },
  { id: "restaurant", name: "Full-Service Restaurant", desc: "Menu browse → order → track → feedback", industry: "F&B", stages: 6 },
  { id: "dental_care", name: "Dental Care", desc: "Services → insurance check → booking → reminder", industry: "Healthcare", stages: 6 },
  { id: "fitness_gym", name: "Fitness & Gym", desc: "Classes → membership → trial → booking", industry: "Fitness", stages: 7 },
  { id: "real_estate", name: "Real Estate", desc: "Listings → virtual tour → inquiry → schedule visit", industry: "Real Estate", stages: 6 },
];

export default function AdminRelayDashboard({ initialStats, initialDiagnostics }: RelayDashboardProps) {
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

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      {/* Header with tabs */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1.5px" }}>Admin</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: T.t1, marginTop: "2px" }}>Relay Command Center</div>
            <div style={{ fontSize: "13px", color: T.t3, marginTop: "2px" }}>Manage conversation flows, block registry, and widget configuration</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/admin/relay/blocks" style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${T.bdr}`, background: T.surface, color: T.t1, fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Block Registry →</Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2px", marginTop: "16px", background: T.bg, borderRadius: "8px", padding: "3px" }}>
          {[{ id: "overview", l: "Overview" }, { id: "flows", l: "Chat Flows" }, { id: "templates", l: "Flow Templates" }, { id: "diagnostics", l: "Diagnostics" }, { id: "seed", l: "Seed & Reset" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedStage(null); }} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? T.surface : "transparent", color: tab === t.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <React.Fragment>
            {/* Stats row */}
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
              {/* Quick Actions */}
              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "16px" }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "View Block Registry", desc: "Browse and configure all relay blocks", action: "blocks" },
                    { label: "Edit Default Flow", desc: "Modify stages, transitions, and intents", action: "flows" },
                    { label: "Run Diagnostics", desc: "Check system health and connectivity", action: "diagnostics" },
                    { label: "Seed Defaults", desc: "Populate default blocks and flow template", action: "seed" },
                  ].map((a, i) => (
                    <button key={i} onClick={() => setTab(a.action)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "8px", border: `1px solid ${T.bdr}`, background: T.bg, cursor: "pointer", textAlign: "left" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: T.t1 }}>{a.label}</div>
                        <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{a.desc}</div>
                      </div>
                      <div style={{ fontSize: "14px", color: T.t4 }}>→</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* System Health */}
              <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "16px" }}>System Health</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {diagnostics.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", background: d.status === "pass" ? T.greenBg : d.status === "warn" ? T.amberBg : T.redBg }}>
                      <span style={{ fontSize: "16px" }}>{d.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: T.t1 }}>{d.label}</div>
                        <div style={{ fontSize: "11px", color: T.t3 }}>{d.desc}</div>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: d.status === "pass" ? T.green : d.status === "warn" ? T.amber : T.red }}>{d.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        )}

        {/* ── FLOWS TAB ── */}
        {tab === "flows" && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: selectedStage ? "1fr 360px" : "1fr", gap: "20px" }}>
              {/* Stage list */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "12px" }}>Conversation Stages</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {STAGES.map(stage => (
                    <button key={stage.id} onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "10px", border: `1px solid ${selectedStage === stage.id ? stage.textColor : T.bdr}`, background: selectedStage === stage.id ? stage.color : T.surface, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: stage.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: stage.textColor }}>{stage.label[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{stage.label}</div>
                        <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>
                          {stage.blocks.length} blocks · {stage.intents.length} intents · Lead +{stage.leadScore}
                          {stage.isEntry && <span style={{ marginLeft: "8px", fontSize: "9px", fontWeight: 700, color: T.green, textTransform: "uppercase" }}>Entry</span>}
                          {stage.isExit && <span style={{ marginLeft: "8px", fontSize: "9px", fontWeight: 700, color: T.red, textTransform: "uppercase" }}>Exit</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: "14px", color: T.t4 }}>{selectedStage === stage.id ? "▾" : "▸"}</div>
                    </button>
                  ))}
                </div>

                {/* Intent Signal Map */}
                <div style={{ marginTop: "24px", background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "12px" }}>Intent Signal Map</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {INTENT_SIGNALS.map(intent => {
                      const stages = STAGES.filter(s => s.intents.includes(intent));
                      return (
                        <div key={intent} style={{ padding: "6px 12px", borderRadius: "6px", background: stages.length > 0 ? T.priBg : T.bg, border: `1px solid ${stages.length > 0 ? T.priBg2 : T.bdr}`, fontSize: "11px", color: stages.length > 0 ? T.pri : T.t4 }}>
                          {intent} <span style={{ fontWeight: 600 }}>({stages.length})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail sidebar */}
              {selStage && (
                <div style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${T.bdr}`, padding: "20px", height: "fit-content", position: "sticky", top: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: selStage.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: selStage.textColor }}>{selStage.label[0]}</div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1 }}>{selStage.label}</div>
                      <div style={{ fontSize: "11px", color: T.t3 }}>Stage: {selStage.type}</div>
                    </div>
                  </div>

                  {/* Blocks */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Blocks</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selStage.blocks.map(b => (
                        <span key={b} style={{ padding: "4px 10px", borderRadius: "4px", background: selStage.color, fontSize: "11px", fontWeight: 500, color: selStage.textColor }}>{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* Intents */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Intent Triggers</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selStage.intents.map(intent => (
                        <span key={intent} style={{ padding: "4px 10px", borderRadius: "4px", background: T.priBg, fontSize: "11px", fontWeight: 500, color: T.pri }}>{intent}</span>
                      ))}
                    </div>
                  </div>

                  {/* Lead Score */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Lead Score Impact</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: T.pri }}>+{selStage.leadScore}</div>
                  </div>

                  {/* Transitions */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Transitions ({stageTransitions.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {stageTransitions.map((tr, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px", background: T.bg, fontSize: "11px" }}>
                          <span style={{ fontWeight: 600, color: T.t1 }}>{tr.from}</span>
                          <span style={{ color: T.t4 }}>→</span>
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

        {/* ── TEMPLATES TAB ── */}
        {tab === "templates" && (
          <React.Fragment>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "12px" }}>Flow Templates</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {FLOW_TEMPLATES.map(tmpl => (
                <div key={tmpl.id} style={{ background: T.surface, borderRadius: "12px", border: `1px solid ${expandedTemplate === tmpl.id ? T.pri : T.bdr}`, padding: "20px", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setExpandedTemplate(expandedTemplate === tmpl.id ? null : tmpl.id)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: T.t1 }}>{tmpl.name}</div>
                      <div style={{ fontSize: "11px", color: T.t3, marginTop: "4px" }}>{tmpl.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: T.t4, textTransform: "uppercase" }}>{tmpl.industry}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: T.pri, marginTop: "2px" }}>{tmpl.stages} stages</div>
                    </div>
                  </div>
                  {expandedTemplate === tmpl.id && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${T.bdr}` }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${T.bdr}`, background: T.bg, fontSize: "11px", fontWeight: 600, color: T.t2, cursor: "pointer" }}>Preview</button>
                        <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${T.pri}`, background: T.priBg, fontSize: "11px", fontWeight: 600, color: T.pri, cursor: "pointer" }}>Edit</button>
                        <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${T.red}`, background: T.redBg, fontSize: "11px", fontWeight: 600, color: T.red, cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        {/* ── DIAGNOSTICS TAB ── */}
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

        {/* ── SEED & RESET TAB ── */}
        {tab === "seed" && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Seed panel */}
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
                      <span style={{ color: T.green }}>✓</span> {item}
                    </div>
                  ))}
                </div>
                <button onClick={handleSeed} disabled={seeding} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: seeding ? "not-allowed" : "pointer", opacity: seeding ? 0.6 : 1 }}>{seeding ? "Seeding..." : "Seed Default Blocks & Flows"}</button>
              </div>

              {/* Reset panel */}
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
                      <span style={{ color: T.red }}>⚠</span> {item}
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
