import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg:         "#F2EFE6",
  card:       "#fdf8f0",
  panel:      "#FFFFFF",
  panelAlt:   "#F5EFEB",
  border:     "rgba(0, 0, 0, 0.08)",
  borderBright:"rgba(0, 0, 0, 0.15)",
  accent:     "#f97316",
  accentSoft: "#f59e0b",
  accentDeep: "#92400e",
  accentGlow: "rgba(249, 115, 22, 0.18)",
  accentLine: "rgba(146, 64, 14, 0.3)",
  text:       "#0D0D0D",
  textSub:    "#3D3D3D",
  textDim:    "#7A7A7A",
  success:    "#10b981",
  successDim: "rgba(16, 185, 129, 0.15)",
  warning:    "#f59e0b",
  warningDim: "rgba(245, 158, 11, 0.15)",
  danger:     "#ef4444",
  dangerDim:  "rgba(239, 68, 68, 0.15)",
  blue:       "#0ea5e9",
  blueDim:    "rgba(14, 165, 233, 0.15)",
};

const LOG_POOL = [
  (c,m,l) => ({ msg:`Edge worker execution: ${c}ms`, type:"info" }),
  ()      => ({ msg:"Supabase connection: Authenticated.", type:"success" }),
  ()      => ({ msg:"Database replica: Synchronized.", type:"success" }),
  (c,m)   => ({ msg:`Pool pressure: ${m}% utilized`, type: m>70?"warning":"info" }),
  (c,m,l) => ({ msg:`KV cache latency: ${l}ms`, type: l>60?"warning":"info" }),
  ()      => ({ msg:"D1 Database query OK.", type:"success" }),
  ()      => ({ msg:"JWT signature verified.", type:"success" }),
  ()      => ({ msg:"Vercel Edge ping received.", type:"info" }),
  ()      => ({ msg:"RAG Embeddings indexed.", type:"info" }),
  (c)     => ({ msg:`Cache HIT ratio: ${(85 + Math.random()*10).toFixed(1)}%`, type:"info" }),
];

function now() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2,"0")).join(":");
}

function MetricRing({ value, max, color, colorDim, label, unit, size = 96 }) {
  const sw = 5.5;
  const r  = (size - sw) / 2;
  const ci = 2 * Math.PI * r;
  const dash = Math.min((value / max) * ci, ci);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }} aria-hidden>
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={C.border} strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${dash} ${ci}`}
            strokeLinecap="round"
            style={{ transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          gap:1,
        }}>
          <span style={{ fontSize:17, fontWeight:600, color, lineHeight:1, fontFamily:"'Space Grotesk', system-ui, sans-serif" }}>
            {value}
          </span>
          <span style={{ fontSize:9, color:C.textDim, letterSpacing:"0.06em", fontFamily:"'Space Grotesk', system-ui, sans-serif", fontWeight:500 }}>
            {unit}
          </span>
        </div>
      </div>
      <span style={{ fontSize:10, color:C.textSub, letterSpacing:"0.12em", fontFamily:"'Space Grotesk', system-ui, sans-serif", fontWeight:500 }}>
        {label}
      </span>
    </div>
  );
}

function StatusPill({ label, ok }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 10px",
      background: ok ? C.successDim : C.dangerDim,
      border:`1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius:6,
      fontSize:10,
      fontWeight:600,
      color: ok ? C.success : C.danger,
      letterSpacing:"0.06em",
      fontFamily:"'Space Grotesk', system-ui, sans-serif",
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%",
        background: ok ? C.success : C.danger,
        display:"inline-block",
        boxShadow: `0 0 8px ${ok ? C.success : C.danger}`,
        animation:"blink 2s infinite",
      }} />
      {label}
    </span>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{
      height:4, borderRadius:4,
      background:C.border, overflow:"hidden",
    }}>
      <div style={{
        height:"100%",
        width:`${Math.min(100,(value/max)*100)}%`,
        background:color,
        borderRadius:4,
        transition:"width 0.6s ease",
      }} />
    </div>
  );
}

export default function LoggerOS() {
  const [cpu,     setCpu]     = useState(18);
  const [mem,     setMem]     = useState(45);
  const [lat,     setLat]     = useState(22);
  const [logs,    setLogs]    = useState(() => {
    const seed = [
      { msg:"Edge worker execution: 18ms",   type:"info"    },
      { msg:"Supabase connection: Authenticated.",    type:"success" },
      { msg:"Database replica: Synchronized.", type:"success" },
      { msg:"JWT signature verified.",     type:"success" },
      { msg:"Edge worker execution: 14ms",             type:"info"    },
    ];
    return seed.map((l,i) => ({ id:i, time:now(), ...l }));
  });
  const [tilt, setTilt]       = useState({ x:0, y:0 });
  const [tick, setTick]       = useState(0);
  const cardRef   = useRef(null);
  const logRef    = useRef(null);
  const idRef     = useRef(10);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left)  / r.width  - 0.5) * 8,
      y: ((e.clientY - r.top)   / r.height - 0.5) * -6,
    });
  },[]);
  const handleMouseLeave = useCallback(() => setTilt({ x:0, y:0 }),[]);

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(p => Math.max(5,  Math.min(92, Math.round(p + (Math.random()-.42)*9))));
      setMem(p => Math.max(28, Math.min(88, Math.round(p + (Math.random()-.50)*5))));
      setLat(p => Math.max(6,  Math.min(130,Math.round(p + (Math.random()-.50)*14))));
      setTick(n => n+1);
    }, 1600);
    return () => clearInterval(t);
  },[]);

  useEffect(() => {
    const t = setInterval(() => {
      const fn  = LOG_POOL[Math.floor(Math.random()*LOG_POOL.length)];
      const { msg, type } = fn(cpu, mem, lat);
      setLogs(prev => [...prev.slice(-24), { id:idRef.current++, time:now(), msg, type }]);
    }, 2200);
    return () => clearInterval(t);
  },[cpu, mem, lat]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  },[logs]);

  const cpuColor  = cpu>70  ? C.danger  : cpu>50  ? C.warning : C.accent;
  const memColor  = mem>70  ? C.danger  : mem>50  ? C.warning : C.blue;
  const latColor  = lat>60  ? C.danger  : lat>30  ? C.warning : C.success;
  const logColor  = { info:C.textDim, success:C.success, warning:C.warning, error:C.danger };

  const health = cpu<75 && mem<75 && lat<60;
  const uptime = "99.998%";

  return (
    <div style={{
      fontFamily:"'Inter', system-ui, sans-serif",
      background:C.bg,
      minHeight:"100vh",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:"2rem",
      backgroundImage: `radial-gradient(circle at 50% -20%, #f9731611 0%, transparent 70%)`
    }}>
      <h2 className="sr-only">Scholar Atlas Code Gen Admin</h2>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width:"100%",
          maxWidth:900,
          background:C.card,
          borderRadius:24,
          border:`1px solid ${C.border}`,
          boxShadow: "0 24px 48px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
          transform:`perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(1.01)`,
          transition:"transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transformStyle:"preserve-3d",
          overflow:"hidden",
          position:"relative",
        }}
      >
        {/* top accent line */}
        <div style={{
          position:"absolute", top:0, left:"10%", width:"80%", height:2,
          background:`linear-gradient(90deg,transparent,${C.accent},transparent)`,
          zIndex:2,
          opacity: 0.6
        }} />

        {/* ── HEADER ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"24px 32px",
          borderBottom:`1px solid ${C.border}`,
          background: "linear-gradient(180deg, #FFFFFF 0%, transparent 100%)"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {/* abstract logo/orb */}
            <div style={{
              width:48, height:48, borderRadius:"12px",
              background:`linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
              boxShadow:`0 8px 16px ${C.accentGlow}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative",
              flexShrink:0,
              transform: "rotate(-10deg)"
            }}>
              <div style={{
                width:20, height:20, borderRadius:"4px",
                background:C.panel,
                transform: "rotate(20deg)"
              }} />
            </div>

            <div>
              <div style={{ 
                fontSize:24, 
                fontWeight:700, 
                letterSpacing:"-0.02em", 
                color:C.text,
                fontFamily:"'Space Grotesk', system-ui, sans-serif"
              }}>
                SCHOLAR SYSTEM
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
                <StatusPill label="SUPABASE: CONNECTED" ok={true} />
                <StatusPill label="CF EDGE: ACTIVE" ok={true} />
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
            <span style={{ 
              fontSize:12, 
              fontWeight: 600,
              color: health ? C.success : C.warning, 
              letterSpacing:"0.06em",
              fontFamily:"'Space Grotesk', system-ui, sans-serif"
            }}>
              {health ? "INFRASTRUCTURE: OPTIMAL" : "INFRASTRUCTURE: LOADED"}
            </span>
            <span style={{ 
              fontSize:11, 
              color:C.textDim, 
              letterSpacing:"0.04em",
              fontFamily:"'Space Grotesk', system-ui, sans-serif",
              fontWeight: 500
            }}>
              {now()} UTC
            </span>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.1fr", minHeight:340 }}>

          {/* LEFT – metrics */}
          <div style={{
            padding:"28px 32px",
            borderRight:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column", gap:28,
            background: "rgba(255,255,255,0.4)"
          }}>
            <div style={{ 
              fontSize:11, 
              fontWeight:600,
              color:C.textSub, 
              letterSpacing:"0.1em",
              fontFamily:"'Space Grotesk', system-ui, sans-serif"
            }}>
              NETWORK METRICS
            </div>

            {/* rings row */}
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <MetricRing value={cpu}  max={100} color={cpuColor}  label="WORKER"  unit="ms" />
              <MetricRing value={mem}  max={100} color={memColor}  label="DB LOAD" unit="%" />
              <MetricRing value={lat}  max={150} color={latColor}  label="LATENCY" unit="ms" />
            </div>

            {/* mini bars */}
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {[
                { label:"EDGE COMPUTE",  value:cpu, max:100,  color:cpuColor, unit:"ms" },
                { label:"CONNECTION POOL", value:mem, max:100,  color:memColor, unit:"%" },
                { label:"ROUTING PING",  value:lat, max:150,  color:latColor, unit:"ms"},
              ].map(({ label, value, max, color, unit }) => (
                <div key={label}>
                  <div style={{
                    display:"flex", justifyContent:"space-between",
                    marginBottom:8,
                  }}>
                    <span style={{ 
                      fontSize:11, 
                      fontWeight: 600,
                      color:C.textSub, 
                      letterSpacing:"0.06em",
                      fontFamily:"'Space Grotesk', system-ui, sans-serif" 
                    }}>
                      {label}
                    </span>
                    <span style={{ 
                      fontSize:12, 
                      color, 
                      fontWeight:700,
                      fontFamily:"'Space Grotesk', system-ui, sans-serif" 
                    }}>
                      {value}{unit}
                    </span>
                  </div>
                  <MiniBar value={value} max={max} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT – console + log */}
          <div style={{
            padding:"28px 32px",
            display:"flex", flexDirection:"column", gap:20,
            background: C.panel
          }}>
            {/* console terminal */}
            <div style={{
              background:C.card,
              border:`1px solid ${C.border}`,
              borderRadius:12,
              overflow:"hidden",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
            }}>
              {/* fake titlebar */}
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"10px 14px",
                borderBottom:`1px solid ${C.border}`,
                background:C.panelAlt,
              }}>
                {["#ef4444","#f59e0b","#10b981"].map((c,i) => (
                  <div key={i} style={{
                    width:10, height:10, borderRadius:"50%", background:c, opacity:.8,
                  }} />
                ))}
                <span style={{ 
                  fontSize:10, 
                  fontWeight: 600,
                  color:C.textDim, 
                  marginLeft:6, 
                  letterSpacing:"0.04em",
                  fontFamily:"'Space Grotesk', system-ui, sans-serif"
                }}>
                  admin_shell — code_generator
                </span>
              </div>
              <div style={{ padding:"16px 20px" }}>
                <div style={{
                  fontSize:12,
                  color:C.textSub,
                  lineHeight:1.7,
                  fontFamily: "'Space Grotesk', monospace",
                  fontWeight: 500
                }}>
                  <span style={{ color:C.accent }}>admin@scholar ❯ </span>
                  <span style={{ color:C.success }}>yarn run generate</span>
                </div>
                <div style={{
                  fontSize:13,
                  color:C.text,
                  lineHeight:1.6,
                  marginTop:8,
                  fontFamily: "system-ui, sans-serif"
                }}>
                  Infrastructure synchronized. Databases and Edge Workers are routing seamlessly. Awaiting input for generation...
                </div>
                <div style={{
                  fontSize:12, color:C.textDim, marginTop:10,
                  display:"flex", alignItems:"center", gap:6,
                  fontFamily: "'Space Grotesk', monospace"
                }}>
                  <span style={{ color: C.accentDeep }}>❯</span>
                  <span style={{ animation:"blink 1.1s step-start infinite", color: C.textSub }}>_</span>
                </div>
              </div>
            </div>

            {/* neural sync stream -> API Request Stream */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
              <div style={{
                display:"flex", alignItems:"center",
                justifyContent:"space-between",
                marginBottom:12,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{
                    width:8, height:8, borderRadius:"50%",
                    background:C.blue,
                    animation:"blink 1.5s infinite",
                    display:"inline-block",
                  }} />
                  <span style={{ 
                    fontSize:11, 
                    fontWeight: 600,
                    color:C.blue, 
                    letterSpacing:"0.08em",
                    fontFamily:"'Space Grotesk', system-ui, sans-serif"
                  }}>
                    LIVE API STREAM
                  </span>
                </div>
              </div>

              <div
                ref={logRef}
                style={{
                  flex:1,
                  overflowY:"auto",
                  maxHeight:160,
                  display:"flex",
                  flexDirection:"column",
                  gap:6,
                  scrollBehavior:"smooth",
                  paddingRight: 8,
                }}
              >
                {logs.map(log => (
                  <div key={log.id} style={{
                    display:"flex", gap:12,
                    fontSize:12,
                    lineHeight:1.5,
                    animation:"fadeUp 0.3s ease",
                    fontFamily:"'Space Grotesk', system-ui, sans-serif"
                  }}>
                    <span style={{
                      color:C.textDim,
                      minWidth:72,
                      flexShrink:0,
                      fontWeight: 500,
                      fontSize: 11
                    }}>
                      [{log.time}]
                    </span>
                    <span style={{ 
                      color: logColor[log.type] || C.textSub,
                      fontWeight: log.type === 'success' || log.type === 'warning' ? 600 : 500
                    }}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          borderTop:`1px solid ${C.border}`,
          padding:"14px 32px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background: C.panelAlt
        }}>
          <div style={{ display:"flex", gap:24 }}>
            {[
              { k:"DATABASE",  v:"ONLINE", c:C.success },
              { k:"WORKERS",   v:"14 INSTANCES", c:C.accentDeep  },
              { k:"CACHE",     v:"HIT",  c:C.blue    },
            ].map(({ k,v,c }) => (
              <span key={k} style={{ 
                fontSize:10, 
                fontWeight: 600,
                color:C.textDim, 
                letterSpacing:"0.06em",
                fontFamily:"'Space Grotesk', system-ui, sans-serif"
              }}>
                {k}: <span style={{ color:c }}>{v}</span>
              </span>
            ))}
          </div>
          <span style={{
            fontSize:10, 
            fontWeight: 600,
            color:C.textDim, 
            letterSpacing:"0.04em",
            fontFamily:"'Space Grotesk', system-ui, sans-serif"
          }}>
            UPTIME {uptime}
          </span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);}
        @keyframes spin {
          to{transform:rotate(360deg);}
        }
        @keyframes blink {
          0%,100%{opacity:1;}50%{opacity:0;}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(8px);}
          to{opacity:1;transform:translateY(0);}
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${C.borderBright};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${C.textDim};
        }
        *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>
    </div>
  );
}
