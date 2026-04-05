'use client';

import { useState, useEffect, useRef } from 'react';
import { T, BLOCK_SECTIONS, SCENARIOS, CATS, buildScenario } from './block-data';
import type { ScenarioMessage } from './block-data';
import { renderBlock } from './block-previews';
import {
  generateBlockFromPromptAction,
} from '@/actions/block-builder-actions';

export default function AdminBlockLibraryPage() {
  const [scenario, setScenario] = useState('first_visit');
  const [msgs, setMsgs] = useState<ScenarioMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [tab, setTab] = useState<'flows' | 'blocks'>('flows');
  const [expandedSection, setExpandedSection] = useState<string | null>('entry');
  const [highlightedBlocks, setHighlightedBlocks] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const allMsgs = useRef<ScenarioMessage[]>([]);

  // Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genVertical, setGenVertical] = useState('ecommerce');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Scenario playback ─────────────────────────────────────────────
  useEffect(() => {
    const built = buildScenario(scenario);
    allMsgs.current = built;
    setMsgs([]);
    setVisibleCount(0);
    const sc = SCENARIOS.find(s => s.id === scenario);
    setHighlightedBlocks(sc?.tags || []);
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      if (idx > built.length) { clearInterval(iv); return; }
      setVisibleCount(idx);
    }, 450);
    return () => clearInterval(iv);
  }, [scenario]);

  useEffect(() => { setMsgs(allMsgs.current.slice(0, visibleCount)); }, [visibleCount]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // ── Generator ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!genPrompt.trim()) return;
    setGenerating(true);
    setGeneratedCode(null);
    const result = await generateBlockFromPromptAction(genPrompt, genVertical);
    if (result.success && result.result) {
      setGeneratedCode(result.result.componentCode);
    } else {
      setGeneratedCode(`// Error: ${result.error || 'Generation failed'}`);
    }
    setGenerating(false);
  }

  function copyCode() {
    if (generatedCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────
  const totalBlocks = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.length, 0);
  const newB = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.filter(b => b.status === 'NEW').length, 0);
  const existB = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.filter(b => b.status === 'EXISTS' || b.status === 'EXTEND').length, 0);
  const statusColor = (s: string) => s === 'NEW' ? T.pri : s === 'EXTEND' ? T.amber : T.green;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#e8e3db', fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}*{box-sizing:border-box;}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${T.bdrM};border-radius:3px;}`}</style>

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <div style={{ width: '280px', borderRight: `1px solid ${T.bdr}`, background: T.surface, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Relay Block System</div>
          <div style={{ fontSize: '20px', fontWeight: 300, color: T.t1, lineHeight: 1.2, marginTop: '4px', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VEIL — Clean Beauty</div>
          <div style={{ fontSize: '10px', color: T.t3, marginTop: '3px' }}>US-based D2C skincare · DTC.com model</div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
            <div style={{ padding: '4px 8px', background: T.bg, borderRadius: '5px', textAlign: 'center' }}><div style={{ fontSize: '15px', fontWeight: 700, color: T.t1 }}>{totalBlocks}</div><div style={{ fontSize: '7px', color: T.t4 }}>Total</div></div>
            <div style={{ padding: '4px 8px', background: T.priBg, borderRadius: '5px', textAlign: 'center' }}><div style={{ fontSize: '15px', fontWeight: 700, color: T.pri }}>{newB}</div><div style={{ fontSize: '7px', color: T.pri }}>New</div></div>
            <div style={{ padding: '4px 8px', background: T.greenBg, borderRadius: '5px', textAlign: 'center' }}><div style={{ fontSize: '15px', fontWeight: 700, color: T.green }}>{existB}</div><div style={{ fontSize: '7px', color: T.green }}>Exists</div></div>
          </div>

          {/* Generate Block button */}
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            style={{ width: '100%', marginTop: '8px', padding: '7px', borderRadius: '7px', border: 'none', background: T.t1, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px' }}
          >
            {showGenerator ? '✕ Close Generator' : '✦ Generate Block'}
          </button>
        </div>

        {/* ── Generator Panel ──────────────────────────────────────── */}
        {showGenerator && (
          <div style={{ padding: '0 16px 12px', borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: T.t4, display: 'block', marginBottom: '3px' }}>Vertical</label>
              <select
                value={genVertical}
                onChange={e => setGenVertical(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${T.bdr}`, fontSize: '10px', background: T.surface }}
              >
                <option value="ecommerce">E-Commerce</option>
                <option value="hospitality">Hospitality</option>
                <option value="real_estate">Real Estate</option>
                <option value="healthcare">Healthcare</option>
                <option value="services">Services</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '9px', fontWeight: 600, color: T.t4, display: 'block', marginBottom: '3px' }}>Describe the block</label>
              <textarea
                value={genPrompt}
                onChange={e => setGenPrompt(e.target.value)}
                placeholder="e.g. A review block with star distribution, verified badges, and skin type tags"
                style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: `1px solid ${T.bdr}`, fontSize: '10px', resize: 'vertical', outline: 'none', minHeight: '60px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !genPrompt.trim()}
              style={{ width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', opacity: generating || !genPrompt.trim() ? 0.5 : 1 }}
            >
              {generating ? 'Generating...' : 'Generate Block Code'}
            </button>
            {generatedCode && (
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <pre style={{ background: T.t1, color: T.bdr, borderRadius: '6px', padding: '8px', fontSize: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '200px' }}>
                  {generatedCode.substring(0, 2000)}{generatedCode.length > 2000 ? '\n\n// ... truncated' : ''}
                </pre>
                <button
                  onClick={copyCode}
                  style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px 6px', borderRadius: '3px', border: `1px solid #444`, background: '#2d2d2d', color: '#e7e5e4', fontSize: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.bdr}`, borderTop: `1px solid ${T.bdr}` }}>
          {([{ id: 'flows' as const, l: 'Chat Flows' }, { id: 'blocks' as const, l: 'Block Index' }]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px', fontSize: '10px', fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? T.pri : T.t3, background: tab === t.id ? T.priBg : 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${T.pri}` : '2px solid transparent', cursor: 'pointer' }}>{t.l}</button>
          ))}
        </div>

        {/* ── Flows Tab ────────────────────────────────────────────── */}
        {tab === 'flows' && (
          <div style={{ padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '8px', fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>12 Scenarios</div>
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)} style={{ width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: '7px', border: scenario === s.id ? `1.5px solid ${T.pri}` : `1px solid ${T.bdr}`, background: scenario === s.id ? T.priBg : T.bg, cursor: 'pointer', marginBottom: '3px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: scenario === s.id ? T.pri : T.t1 }}>{s.label}</div>
                <div style={{ fontSize: '9px', color: T.t4, marginTop: '1px' }}>{s.desc}</div>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '3px' }}>
                  {s.tags.slice(0, 3).map(tag => <span key={tag} style={{ fontSize: '6px', fontWeight: 500, color: T.pri, background: T.priBg2, padding: '1px 4px', borderRadius: '3px' }}>{tag}</span>)}
                  {s.tags.length > 3 && <span style={{ fontSize: '6px', color: T.t4 }}>+{s.tags.length - 3}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Block Index Tab ──────────────────────────────────────── */}
        {tab === 'blocks' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {BLOCK_SECTIONS.map(sec => (
              <div key={sec.id} style={{ marginBottom: '3px' }}>
                <button onClick={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 7px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: expandedSection === sec.id ? T.bg : T.surface, cursor: 'pointer' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{sec.title}</span>
                  <span style={{ fontSize: '9px', color: T.t4 }}>{sec.blocks.length} · {expandedSection === sec.id ? '▾' : '▸'}</span>
                </button>
                {expandedSection === sec.id && (
                  <div style={{ padding: '3px 0 3px 8px' }}>
                    {sec.blocks.map(bl => (
                      <div key={bl.type} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 5px', borderRadius: '4px', marginBottom: '1px', background: highlightedBlocks.includes(bl.type) ? T.priBg : 'transparent' }}>
                        <span style={{ fontSize: '6px', fontWeight: 700, color: statusColor(bl.status), background: bl.status === 'NEW' ? T.priBg : bl.status === 'EXTEND' ? T.amberBg : T.greenBg, padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }}>{bl.status}</span>
                        <div><div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{bl.label}</div><div style={{ fontSize: '7px', color: T.t4, fontFamily: 'monospace' }}>{bl.type}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Phone Mockup ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '375px', height: '720px', borderRadius: '32px', border: '6px solid #1a1a18', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '110px', height: '24px', background: '#1a1a18', borderRadius: '0 0 14px 14px', zIndex: 30 }} />

          <div style={{ width: '100%', height: '100%', borderRadius: '26px', overflow: 'hidden', background: T.surface, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '32px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface, borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 300, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>V</div>
                <div style={{ fontSize: '14px', fontWeight: 400, color: T.t1, letterSpacing: '4px', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VEIL</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: T.priBg, borderRadius: '9999px' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.pri, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>{SCENARIOS.find(s => s.id === scenario)?.label}</span>
              </div>
            </div>

            {/* Category pills */}
            <div style={{ borderBottom: `1px solid ${T.bdr}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '3px', padding: '6px 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {CATS.map((c, i) => (
                  <button key={c.id} style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '9px', fontWeight: i === 0 ? 600 : 400, background: i === 0 ? T.pri : T.surface, color: i === 0 ? '#fff' : T.t3, border: i === 0 ? 'none' : `1px solid ${T.bdr}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: T.bg, display: 'flex', flexDirection: 'column' }}>
              {msgs.map(m => renderBlock(m))}
              <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '8px 12px', borderTop: `1px solid ${T.bdr}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: T.bg, borderRadius: '9px', border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: '11px', color: T.t4, flex: 1 }}>Ask about products, ingredients...</span>
                </div>
                <button style={{ width: 32, height: 32, borderRadius: 7, background: T.pri, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>↑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
