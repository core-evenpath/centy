'use client';

import { useState, useEffect } from 'react';
import {
  Layers, Grid3X3, ShoppingBag, Eye, Tag, Package,
  Sparkles, ChevronDown, ChevronRight, Search, RefreshCw,
  Code, Copy, Check, MessageSquare, Shield, Star, Box,
} from 'lucide-react';
import {
  getRegisteredBlocksAction,
  getBlockDetailAction,
  generateBlockFromPromptAction,
} from '@/actions/block-builder-actions';
import type { BlockListItem, BlockDetailResult } from '@/actions/block-builder-actions';

const FAMILY_ICONS: Record<string, any> = {
  navigation: Layers,
  catalog: ShoppingBag,
  detail: Eye,
  compare: Grid3X3,
  form: MessageSquare,
  promo: Tag,
  cart: ShoppingBag,
  confirmation: Check,
  tracking: Package,
  engagement: Star,
  support: Shield,
  shared: Sparkles,
};

const FAMILY_COLORS: Record<string, string> = {
  navigation: '#6366f1',
  catalog: '#c2410c',
  detail: '#0d9488',
  compare: '#2563eb',
  form: '#7c3aed',
  promo: '#d97706',
  cart: '#16a34a',
  confirmation: '#059669',
  tracking: '#0284c7',
  engagement: '#db2777',
  support: '#64748b',
  shared: '#78716c',
};

export default function AdminBlockLibraryPage() {
  const [blocks, setBlocks] = useState<BlockListItem[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [blockDetail, setBlockDetail] = useState<BlockDetailResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genVertical, setGenVertical] = useState('ecommerce');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, [filterFamily]);

  async function loadBlocks() {
    setLoading(true);
    const result = await getRegisteredBlocksAction(
      filterFamily ? { family: filterFamily } : undefined
    );
    if (result.success) {
      setBlocks(result.blocks);
      setFamilies(result.families);
      setTotalCount(result.totalCount);
    }
    setLoading(false);
  }

  async function toggleDetail(blockId: string) {
    if (expandedBlock === blockId) {
      setExpandedBlock(null);
      setBlockDetail(null);
      return;
    }
    setExpandedBlock(blockId);
    setDetailLoading(true);
    const result = await getBlockDetailAction(blockId);
    if (result.success && result.detail) {
      setBlockDetail(result.detail);
    }
    setDetailLoading(false);
  }

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

  const filtered = searchQuery
    ? blocks.filter(
        (b) =>
          b.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blocks;

  const S = {
    page: { padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } as const,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' } as const,
    title: { fontSize: '24px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.5px' } as const,
    sub: { fontSize: '13px', color: '#78716c', marginTop: '4px' } as const,
    filterBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' } as const,
    pill: (active: boolean) => ({ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: active ? 600 : 400, background: active ? '#1c1917' : '#fff', color: active ? '#fff' : '#78716c', border: active ? 'none' : '1px solid #e7e5e4', cursor: 'pointer' }) as const,
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e7e5e4', background: '#fff', flex: 1, maxWidth: '300px' } as const,
    searchInput: { border: 'none', outline: 'none', fontSize: '13px', flex: 1, background: 'transparent', color: '#1c1917' } as const,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' } as const,
    card: (expanded: boolean) => ({ background: '#fff', border: expanded ? '2px solid #1c1917' : '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }) as const,
    cardHeader: { display: 'flex', gap: '12px', padding: '14px 16px', alignItems: 'flex-start' } as const,
    iconBox: (color: string) => ({ width: '36px', height: '36px', borderRadius: '10px', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }) as const,
    badge: (color: string) => ({ fontSize: '10px', fontWeight: 600, color: '#fff', background: color, padding: '2px 8px', borderRadius: '4px' }) as const,
    tag: { fontSize: '10px', color: '#78716c', background: '#faf8f5', padding: '2px 8px', borderRadius: '4px' } as const,
    expandedArea: { padding: '0 16px 14px', borderTop: '1px solid #e7e5e4', marginTop: '0' } as const,
    fieldRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' } as const,
    genBox: { background: '#fff', border: '2px solid #1c1917', borderRadius: '12px', padding: '20px', marginBottom: '24px' } as const,
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: '13px', resize: 'vertical' as const, outline: 'none', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' as const } as const,
    codeBlock: { background: '#1c1917', color: '#e7e5e4', borderRadius: '8px', padding: '14px', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const, overflow: 'auto', maxHeight: '400px', marginTop: '12px', position: 'relative' as const } as const,
    btn: (primary: boolean) => ({ padding: '8px 16px', borderRadius: '8px', border: primary ? 'none' : '1px solid #e7e5e4', background: primary ? '#1c1917' : '#fff', color: primary ? '#fff' : '#1c1917', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }) as const,
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Block Library</div>
          <div style={S.sub}>
            {totalCount} registered blocks across {families.length} families
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowGenerator(!showGenerator)} style={S.btn(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              {showGenerator ? 'Close Builder' : 'Generate Block'}
            </span>
          </button>
          <button onClick={loadBlocks} style={S.btn(false)}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {showGenerator && (
        <div style={S.genBox}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={16} /> Block Builder
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '4px' }}>Vertical</label>
            <select
              value={genVertical}
              onChange={(e) => setGenVertical(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: '13px', background: '#fff' }}
            >
              <option value="ecommerce">E-Commerce</option>
              <option value="hospitality">Hospitality</option>
              <option value="real_estate">Real Estate</option>
              <option value="healthcare">Healthcare</option>
              <option value="services">Services</option>
            </select>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '4px' }}>Describe the block</label>
            <textarea
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder="e.g. A product review block for skincare with star rating distribution, verified purchase badges, skin type tags, and before/after photo slots"
              style={S.textarea}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !genPrompt.trim()}
            style={{ ...S.btn(true), opacity: generating || !genPrompt.trim() ? 0.5 : 1, width: '100%' }}
          >
            {generating ? 'Generating...' : 'Generate Block Code'}
          </button>
          {generatedCode && (
            <div style={{ position: 'relative' }}>
              <div style={S.codeBlock}>{generatedCode.substring(0, 3000)}{generatedCode.length > 3000 ? '\n\n// ... truncated for display' : ''}</div>
              <button
                onClick={copyCode}
                style={{ position: 'absolute', top: '20px', right: '20px', ...S.btn(false), padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: '#2d2d2d', color: '#e7e5e4', border: '1px solid #444' }}
              >
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={S.filterBar}>
        <button onClick={() => setFilterFamily(null)} style={S.pill(!filterFamily)}>All ({totalCount})</button>
        {families.map((f) => {
          const count = blocks.filter((b) => !filterFamily || b.family === f).length;
          return (
            <button key={f} onClick={() => setFilterFamily(filterFamily === f ? null : f)} style={S.pill(filterFamily === f)}>
              {f} {filterFamily === f ? `(${count})` : ''}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={S.searchBox}>
          <Search size={14} color="#a8a29e" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks..."
            style={S.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a8a29e', fontSize: '14px' }}>Loading block registry...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a8a29e', fontSize: '14px' }}>No blocks found{searchQuery ? ` for "${searchQuery}"` : ''}</div>
      ) : (
        <div style={S.grid}>
          {filtered.map((block) => {
            const isExpanded = expandedBlock === block.id;
            const FamilyIcon = FAMILY_ICONS[block.family] || Box;
            const familyColor = FAMILY_COLORS[block.family] || '#78716c';

            return (
              <div key={block.id} style={S.card(isExpanded)} onClick={() => toggleDetail(block.id)}>
                <div style={S.cardHeader}>
                  <div style={S.iconBox(familyColor)}>
                    <FamilyIcon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{block.label}</div>
                        <div style={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'monospace' }}>{block.id}</div>
                      </div>
                      <span style={S.badge(familyColor)}>{block.family}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#78716c', marginTop: '4px', lineHeight: 1.4 }}>{block.description}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={S.tag}>{block.requiredFieldCount} required</span>
                      <span style={S.tag}>{block.optionalFieldCount} optional</span>
                      <span style={S.tag}>{block.variants.length} variant{block.variants.length !== 1 ? 's' : ''}</span>
                      {block.preloadable && <span style={{ ...S.tag, color: '#16a34a', background: 'rgba(22,163,74,0.06)' }}>preloadable</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={16} color="#a8a29e" /> : <ChevronRight size={16} color="#a8a29e" />}
                </div>

                {isExpanded && (
                  <div style={S.expandedArea} onClick={(e) => e.stopPropagation()}>
                    {detailLoading ? (
                      <div style={{ padding: '12px 0', fontSize: '12px', color: '#a8a29e' }}>Loading...</div>
                    ) : blockDetail ? (
                      <div style={{ paddingTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Categories</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {blockDetail.definition.applicableCategories.map((c) => (
                            <span key={c} style={{ fontSize: '10px', color: familyColor, background: `${familyColor}10`, padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>{c}</span>
                          ))}
                        </div>

                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Variants</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {blockDetail.definition.variants.map((v) => (
                            <span key={v} style={{ fontSize: '10px', color: '#1c1917', background: '#faf8f5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e7e5e4' }}>{v}</span>
                          ))}
                        </div>

                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Required Fields</div>
                        <div style={{ background: '#faf8f5', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px' }}>
                          {blockDetail.dataContract.required.map((f) => (
                            <div key={f.field} style={S.fieldRow}>
                              <span style={{ color: '#1c1917', fontWeight: 500 }}>{f.field}</span>
                              <span style={{ color: '#a8a29e' }}>{f.type}</span>
                            </div>
                          ))}
                          {blockDetail.dataContract.required.length === 0 && (
                            <span style={{ fontSize: '11px', color: '#a8a29e' }}>None</span>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Optional Fields</div>
                        <div style={{ background: '#faf8f5', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px' }}>
                          {blockDetail.dataContract.optional.map((f) => (
                            <div key={f.field} style={S.fieldRow}>
                              <span style={{ color: '#1c1917', fontWeight: 500 }}>{f.field}</span>
                              <span style={{ color: '#a8a29e' }}>{f.type}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Intent Triggers</div>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {blockDetail.definition.intentTriggers.keywords.map((kw) => (
                            <span key={kw} style={{ fontSize: '10px', color: '#7c3aed', background: 'rgba(124,58,237,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
