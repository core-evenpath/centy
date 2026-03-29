const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

const newRelayDemo = `function RelayDemo() {
  const relayRef = useRef<HTMLElement>(null);
  const [rVisible, setRVisible] = useState(false);
  const [rDone, setRDone] = useState(false);

  useEffect(() => {
    const el = relayRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !rVisible) setRVisible(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rVisible]);

  useEffect(() => {
    if (rVisible) {
      const timer = setTimeout(() => setRDone(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setRDone(false);
    }
  }, [rVisible]);

  const replayRelay = () => { setRVisible(false); setTimeout(() => setRVisible(true), 300); };

  const STORE_BRAND = { name: "AirPro HVAC", emoji: "��", tagline: "24/7 AI service assistant", accent: "#ea580c" };
  const STORE_TILES = [
    { id: "services", label: "Our Services", sub: "HVAC · Plumbing · Electrical", icon: "🔧", size: "large" },
    { id: "pricing", label: "Pricing", sub: "Transparent rates", icon: "💰", size: "medium" },
    { id: "book", label: "Book a Visit", sub: "Same-day available", icon: "📅", size: "medium" },
    { id: "reviews", label: "Reviews", sub: "4.9 ★ · 847 reviews", icon: "⭐", size: "small" },
    { id: "area", label: "Service Area", sub: "Phoenix metro", icon: "📍", size: "small" },
    { id: "faq", label: "Quick Answers", sub: "Common questions", icon: "💬", size: "small" },
  ];

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
            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(-8px)",
                transition: "all 0.4s ease 0.2s"
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Not a chatbot</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">A branded storefront with interactive service cards, booking forms, and payments — all inside one conversation.</p>
            </div>
            
            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(-8px)",
                transition: "all 0.4s ease 0.4s"
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Your industry, built in</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">142 business functions across 14 verticals. AI generates the right storefront automatically.</p>
            </div>

            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(-8px)",
                transition: "all 0.4s ease 0.6s"
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Every conversation = revenue</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">AI qualifies leads, recommends services, and tracks every interaction as pipeline.</p>
            </div>
          </div>

          {/* Center Phone Mockup */}
          <div 
            className="relative mx-auto w-full max-w-[280px] h-[500px] rounded-[2.5rem] border-[3px] border-stone-300 shadow-2xl mt-4 md:mt-0" 
            style={{ 
              background: '#fafafa',
              animation: rVisible ? "relay-float 5s ease-in-out 1.2s infinite" : "none"
            }}
          >
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2 bg-black z-50">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-8 h-1 rounded-full bg-neutral-700" />
            </div>

            <div className="absolute top-3 left-3 right-3 bottom-3 rounded-[2rem] overflow-hidden flex flex-col bg-[#fafafa]">
              {/* Phone Header */}
              <div className="px-4 pt-8 pb-3.5 flex items-center gap-3 bg-white border-b border-stone-100 shrink-0 relative z-20">
                <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-orange-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-[16px]">{STORE_BRAND.emoji}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-[16px] text-stone-900 leading-none mb-1">{STORE_BRAND.name}</span>
                  <div className="text-[12px] text-stone-400">{STORE_BRAND.tagline}</div>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="flex-1 relative overflow-hidden flex flex-col bg-[#fafafa] z-10 p-3 pb-2 pt-4">
                <div className="grid grid-cols-2 gap-2 mb-auto">
                  {STORE_TILES.map((tile, index) => (
                    <div 
                      key={tile.id}
                      className={\`bg-white border border-stone-200 rounded-[12px] \${tile.size === 'large' ? 'col-span-2 flex items-center justify-between p-4' : 'flex flex-col items-center justify-center p-3.5'}\`}
                      style={{
                        opacity: rVisible ? 1 : 0,
                        transform: rVisible ? "translateY(0)" : "translateY(8px)",
                        transition: \`opacity 0.4s ease \${index * 0.1}s, transform 0.4s ease \${index * 0.1}s\`
                      }}
                    >
                      {tile.size === 'large' ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="text-[28px]">{tile.icon}</div>
                            <div>
                              <div className="text-[13px] font-semibold text-stone-900 mb-0.5">{tile.label}</div>
                              <div className="text-[11px] text-stone-400">{tile.sub}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-stone-400" />
                        </>
                      ) : (
                        <>
                          <div className="text-[24px] mb-1.5 leading-none">{tile.icon}</div>
                          <div className="text-[13px] font-semibold text-stone-900 text-center leading-tight">{tile.label}</div>
                          <div className="text-[11px] text-stone-400 text-center mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{tile.sub}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input Bar */}
                <div 
                  className="mt-4 pt-10"
                  style={{
                    opacity: rVisible ? 1 : 0,
                    transform: rVisible ? "translateY(0)" : "translateY(8px)",
                    transition: \`opacity 0.4s ease 0.7s, transform 0.4s ease 0.7s\`
                  }}
                >
                  <div className="bg-[#fafafa] border border-stone-200 rounded-[10px] px-3.5 py-3 flex items-center gap-2 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                    <div className="text-[13px] text-stone-400">Describe what you need...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(8px)",
                transition: "all 0.4s ease 0.3s"
              }}
            >
              <h3 className="text-sm font-semibold text-stone-900 mb-2">yourname.pingbox.io</h3>
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 flex items-center gap-2 mb-2 w-full truncate">
                <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-mono text-[11px] text-stone-600">acmehvac.pingbox.io</span>
              </div>
              <p className="text-xs text-stone-500">One link. Customers land in your AI storefront.</p>
            </div>

            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(8px)",
                transition: "all 0.4s ease 0.5s"
              }}
            >
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Every channel, one brain</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Web', 'SMS', 'WhatsApp', 'Telegram'].map(ch => (
                  <span key={ch} className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-medium text-stone-600">{ch}</span>
                ))}
              </div>
              <p className="text-xs text-stone-500">Same storefront, same AI, everywhere.</p>
            </div>

            <div 
              className="rounded-2xl p-4 border border-stone-200 bg-white"
              style={{
                opacity: rVisible ? 1 : 0,
                transform: rVisible ? "translateX(0)" : "translateX(8px)",
                transition: "all 0.4s ease 0.7s"
              }}
            >
              <h3 className="text-sm font-semibold text-stone-900 mb-1.5">Complex? → Your team</h3>
              <p className="text-xs text-stone-500">AI handles routine. Humans get the hard stuff with full context.</p>
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
        <div className="text-center mt-8 min-h-[4rem]">
          <div 
            style={{
              opacity: rVisible ? 1 : 0,
              transition: "opacity 0.5s ease 1s",
            }}
          >
            <p className="text-sm text-stone-400 mb-2">
              This is what your customers see at <span className="font-mono text-stone-500">yourname.pingbox.io</span>
            </p>
            {rDone && (
              <button 
                onClick={replayRelay} 
                className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 font-medium transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" /> Replay
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`;

content = content.replace(/function RelayDemo\(\) \{[\s\S]*?export default function HomePage/m, `${newRelayDemo}\n\nexport default function HomePage`);

content = content.replace(/\.relay-card \{[\s\S]*?\}\s*\}\s*`}<\/style>/, `@keyframes relay-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      \`}</style>`);

fs.writeFileSync('src/app/page.tsx', content);
