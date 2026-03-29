const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

// Replace 1: Replace function definition
content = content.replace(/function RelayShowcase\(\) \{[\s\S]*?export default function HomePage/m, `function RelayDemo() {
  const relayRef = useRef<HTMLElement>(null);
  const [rStep, setRStep] = useState(-1);
  const [rGo, setRGo] = useState(false);

  useEffect(() => {
    const el = relayRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !rGo) setRGo(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rGo]);

  useEffect(() => {
    if (!rGo) return;
    let s = 0;
    let timeoutId: NodeJS.Timeout;
    setRStep(0);
    const tick = () => { s++; setRStep(s); if (s <= 6) { timeoutId = setTimeout(tick, 650); } };
    timeoutId = setTimeout(tick, 650);
    return () => clearTimeout(timeoutId);
  }, [rGo]);

  const replayRelay = () => { setRGo(false); setRStep(-1); setTimeout(() => setRGo(true), 200); };

  return (
    <section ref={relayRef} id="relay" className="py-24 px-4 relative overflow-hidden bg-[#faf8f5] border-b border-stone-200">
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-14">
          <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">Relay</p>
          <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900 mb-4">
            Your AI storefront, inside a chat
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto leading-relaxed">
            Not a chatbot. An AI storefront that renders interactive UI — catalogs, booking forms, payments — right inside the chat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px_1fr] gap-6 md:gap-8 items-center max-w-5xl mx-auto">
          {/* Left Side */}
          <div className="space-y-4">
            <div className={\`relay-card-left rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 1 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Not chat bubbles</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">Service catalogs, booking forms, payments — interactive blocks rendered inside the conversation.</p>
            </div>
            
            <div className={\`relay-card-left rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 3 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Your industry, built in</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">14 verticals. 142 business functions. AI generates the right blocks automatically.</p>
            </div>

            <div className={\`relay-card-left rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 5 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Leads, not just chats</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">Every conversation scored, staged, and tracked as revenue. AI knows when to nudge, upsell, or hand off.</p>
            </div>
          </div>

          {/* Center Phone */}
          <div className="relative mx-auto w-full max-w-[280px] h-[500px] rounded-[2.5rem] border-[3px] border-stone-300 shadow-2xl transition-all duration-500 mt-4 md:mt-0" style={{ background: '#fafafa' }}>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2 bg-black z-50">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-8 h-1 rounded-full bg-neutral-700" />
            </div>

            <div className="absolute top-3 left-3 right-3 bottom-3 rounded-[2rem] overflow-hidden flex flex-col bg-[#fafafa]">
              <div className="px-4 pt-8 pb-3 flex flex-col items-center bg-white border-b border-stone-100 shrink-0 relative z-20">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded overflow-hidden bg-orange-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">⚡</span>
                  </div>
                  <span className="font-semibold text-[13px] text-stone-900 leading-none">AirPro HVAC</span>
                </div>
                <div className="text-[10px] text-stone-400">24/7 AI service assistant</div>
              </div>

              <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className={\`absolute inset-0 p-3 pt-4 flex flex-col relay-phone-fade bg-white \${rStep < 2 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}\`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 bg-[#fff7ed] border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">🔧</div>
                        <div>
                          <div className="text-[12px] font-semibold text-stone-900 mb-0.5">Our Services</div>
                          <div className="text-[9px] text-stone-600">HVAC · Plumbing · Electrical</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-orange-600" />
                    </div>
                    
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 cursor-default">
                      <div className="text-lg mb-1.5 flex justify-center">💰</div>
                      <div className="text-[11px] font-medium text-stone-800 text-center leading-tight">Pricing</div>
                      <div className="text-[9px] text-stone-400 text-center mt-0.5">Service rates</div>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 cursor-default">
                      <div className="text-lg mb-1.5 flex justify-center">📅</div>
                      <div className="text-[11px] font-medium text-stone-800 text-center leading-tight">Book</div>
                      <div className="text-[9px] text-stone-400 text-center mt-0.5">Schedule a visit</div>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 cursor-default flex flex-col justify-center items-center gap-1">
                      <div className="text-sm">⭐</div>
                      <div className="text-[10px] font-medium text-stone-700">Reviews</div>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 cursor-default flex flex-col justify-center items-center gap-1">
                      <div className="text-sm">💬</div>
                      <div className="text-[10px] font-medium text-stone-700">FAQ</div>
                    </div>
                  </div>

                  {rStep === 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-30">
                      <div className="bg-stone-900 text-white text-[10px] px-3 py-1.5 rounded-full animate-bounce">
                        Tap to ask AI
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 pb-2">
                    <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                      <div className="text-[11px] text-stone-400">Describe what you need...</div>
                    </div>
                  </div>
                </div>

                <div className={\`absolute inset-0 flex flex-col bg-[#fafafa] relay-phone-fade \${rStep >= 2 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}\`}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100 overflow-x-auto shrink-0 hide-scrollbar bg-white">
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-stone-100 shrink-0">
                      <div className="w-3 h-3 border-2 border-stone-500 rounded-[2px]" />
                    </div>
                    <div className="w-[1px] h-4 bg-stone-200 shrink-0 mx-0.5" />
                    <div className="px-2.5 py-1 rounded-full bg-orange-600 text-white text-[10px] font-medium shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px]">🔧</span> Services
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px]">💰</span> Pricing
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px]">📅</span> Book
                    </div>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto pb-16 flex flex-col gap-3 relative">
                    <div className="self-end max-w-[85%] bg-stone-900 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] shadow-sm leading-relaxed mt-1">
                      AC blowing warm air. 108°F outside, I have a newborn. Need someone ASAP.
                    </div>

                    <div className="flex gap-2 w-full mt-1">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                        <span className="text-[12px]">🤖</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {rStep === 2 ? (
                          <div className="self-start bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm inline-block w-fit">
                            <TypingDots />
                          </div>
                        ) : (
                          rStep >= 3 && (
                            <div className="self-start max-w-[90%] bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-[12px] text-stone-800 leading-relaxed">
                              I understand the urgency. Here's what I can dispatch right now:
                            </div>
                          )
                        )}

                        {rStep >= 4 && (
                          <div className={\`w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm transform transition-all duration-300 \${rStep >= 6 ? 'opacity-0 scale-95 h-0 overflow-hidden mb-0' : 'opacity-100 scale-100'}\`}>
                            <div className="p-2.5">
                              <div className="flex gap-3 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shrink-0">
                                  <span className="text-xl">❄️</span>
                                </div>
                                <div>
                                  <div className="text-[12px] font-bold text-stone-900 leading-snug">Emergency AC<br/>Repair</div>
                                  <div className="text-[9px] text-stone-500 mt-0.5">Diagnostic + repair</div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mb-2.5 px-1">
                                <span className="text-[13px] font-black text-orange-600">$189</span>
                                <span className="text-[9px] text-stone-500 font-medium">⭐ 4.9 <span className="text-stone-300">(127)</span></span>
                              </div>
                              <div className="bg-emerald-50 rounded text-emerald-700 text-[9px] font-medium px-2 py-1 mb-2.5 w-max">
                                Earliest: Today 2:30 PM
                              </div>
                              <div className="w-full bg-orange-600 text-white text-center rounded-lg py-1.5 text-[11px] font-bold shadow-sm">
                                Book Now
                              </div>
                            </div>
                          </div>
                        )}

                        {rStep >= 5 && rStep < 6 && (
                          <div className="w-full bg-white border border-stone-200 rounded-xl p-2 shadow-sm flex items-center justify-between pb-2 mb-10">
                            <div>
                              <div className="text-[11px] font-bold text-stone-900">🔧 AC Gas Refill</div>
                              <div className="text-[9px] text-stone-500">R-410A refrigerant</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-orange-600">$120</span>
                              <div className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-[9px] font-bold border border-stone-200">+ Add</div>
                            </div>
                          </div>
                        )}

                        {rStep >= 6 && (
                          <div className="w-full bg-white border border-emerald-200 rounded-xl flex flex-col shadow-sm overflow-hidden mb-2 relay-phone-fade transition-all duration-300">
                            <div className="bg-emerald-50 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-2.5 border-b border-emerald-100 flex items-center gap-2">
                              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
                              <div>
                                <div className="text-[11px] font-bold text-emerald-800">Booking Confirmed</div>
                                <div className="text-[9px] text-emerald-600">#APR-847291</div>
                              </div>
                            </div>
                            <div className="p-3 bg-white space-y-1.5">
                              <div className="flex justify-between items-start">
                                <span className="text-[11px] font-semibold text-stone-900">❄️ Emergency AC Repair</span>
                                <span className="text-[11px] font-bold text-stone-900">$189</span>
                              </div>
                              <div className="text-[10px] text-stone-600">Today 2:30 PM</div>
                              <div className="text-[10px] text-stone-400">Tech: Mike R. · 2.3 mi away</div>
                            </div>
                            <div className="bg-[#f0fdf4] p-2 m-2 mt-0 rounded-lg flex flex-col gap-1 border border-emerald-100">
                              <div className="text-[10px] text-emerald-800 font-medium">📍 ETA: 45 minutes</div>
                              <div className="text-[10px] text-emerald-700">📱 Updates via SMS</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={\`absolute bottom-4 right-3 transition-all duration-300 \${rStep === 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}\`}>
                    <div className="bg-orange-600 text-white rounded-full px-3 py-2 flex items-center gap-2 shadow-[0_4px_16px_rgba(234,88,12,0.35)]">
                      <div className="relative">
                        <span className="text-sm">🛒</span>
                        <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-orange-600">1</span>
                      </div>
                      <div className="w-[1px] h-3 bg-white/30" />
                      <span className="text-[11px] font-bold">$189</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            <div className={\`relay-card-right rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 2 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <h3 className="text-sm font-semibold text-stone-900 mb-2">yourname.pingbox.io</h3>
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 flex items-center gap-2 mb-2 w-full truncate">
                <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-mono text-[11px] text-stone-600">acmehvac.pingbox.io</span>
              </div>
              <p className="text-xs text-stone-500">One link. Your AI storefront. No app needed.</p>
            </div>

            <div className={\`relay-card-right rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 4 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Every channel, one brain</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Web', 'SMS', 'WhatsApp', 'Telegram'].map(ch => (
                  <span key={ch} className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-medium text-stone-600">{ch}</span>
                ))}
              </div>
              <p className="text-xs text-stone-500">Same AI, same documents, every channel.</p>
            </div>

            <div className={\`relay-card-right rounded-2xl p-4 border border-stone-200 bg-white \${rStep >= 6 ? 'opacity-100 translate-x-0' : 'r-inactive'}\`}>
              <h3 className="text-sm font-semibold text-stone-900 mb-1.5">Complex? → Your team</h3>
              <p className="text-xs text-stone-500">AI handles routine. Humans get the complex stuff — with full conversation context.</p>
              <div className="mt-3 flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-blue-700 z-20">JD</div>
                <div className="w-6 h-6 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-rose-700 z-10">MR</div>
                <div className="w-6 h-6 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-stone-600 z-0">
                  <User className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar & Replay */}
        <div className="text-center mt-12 min-h-[4rem]">
          {rStep >= 0 && rStep < 6 && (
            <span className="text-sm text-stone-400 transition-all font-medium">
              {rStep < 2 ? "Customer lands on your storefront..." : rStep < 4 ? "AI responds with interactive blocks..." : "Booking confirmed. Revenue tracked."}
            </span>
          )}
          {rStep >= 6 && (
            <div className="opacity-100 transition-opacity duration-500">
              <p className="text-sm text-emerald-600 font-semibold mb-2">Storefront → conversation → booked. In one chat.</p>
              <button 
                onClick={replayRelay} 
                className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 font-medium transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" /> Watch again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomePage`);

// Replace 2: Replace Old CSS with New CSS
content = content.replace(/\.relay-card \{[\s\S]*?\}\s*\}\s*`}<\/style>/, `@keyframes relay-fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .relay-card-left {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .relay-card-left.r-inactive {
          opacity: 0;
          transform: translateX(-12px);
        }
        .relay-card-right {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .relay-card-right.r-inactive {
          opacity: 0;
          transform: translateX(12px);
        }
        .relay-phone-fade {
          transition: opacity 0.4s ease;
        }
      \`}</style>`);

// Replace 3: Insert <RelayDemo /> between "Why speed wins" section and "The platform"
content = content.replace(/<\/section>\s*\{\/\* Animated Grid Flow Section \*\/\}/, `</section>

      <RelayDemo />

      {/* Animated Grid Flow Section */}`);

// Replace 4: Remove old <RelayShowcase /> invocation
content = content.replace(/<RelayShowcase \/>\s*\{\/\* How It Works \*\/\}/, `{/* How It Works */}`);

fs.writeFileSync('src/app/page.tsx', content);
