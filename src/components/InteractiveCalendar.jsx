"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const US_HOLIDAYS = {
  "1-1":  "New Year's Day",
  "1-15": "MLK Day",
  "2-19": "Presidents' Day",
  "5-27": "Memorial Day",
  "6-19": "Juneteenth",
  "7-4":  "Independence Day",
  "9-2":  "Labor Day",
  "10-14":"Columbus Day",
  "11-11":"Veterans Day",
  "11-28":"Thanksgiving",
  "12-25":"Christmas Day",
};

// Unique Unsplash hero image per month
const MONTH_PHOTOS = [
  "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=900&q=80", // Jan – snowy forest
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&q=80", // Feb – pink flowers
  "https://images.unsplash.com/photo-1490750967868-88df5691166e?w=900&q=80", // Mar – cherry blossom
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=900&q=80", // Apr – tulips
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80", // May – lavender
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80", // Jun – beach
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=900&q=80", // Jul – fireworks
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80", // Aug – sunflower
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80", // Sep – forest path
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=900&q=80", // Oct – pumpkins
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80", // Nov – snowy mountains
  "https://images.unsplash.com/photo-1513297887119-d46091b24bcd?w=900&q=80", // Dec – Christmas lights
];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y, m)  { return new Date(y, m, 1).getDay(); }
function toKey(y, m, d)    { return `${y}-${m+1}-${d}`; }
function isSame(a, b)      { return a && b && a.y===b.y && a.m===b.m && a.d===b.d; }
function toDate(o)         { return o ? new Date(o.y, o.m, o.d) : null; }
function inRange(cell, s, e) {
  if (!s || !e) return false;
  const [lo, hi] = toDate(s) <= toDate(e) ? [s, e] : [e, s];
  const cd = toDate(cell);
  return cd > toDate(lo) && cd < toDate(hi);
}

// ── main component ────────────────────────────────────────────────────────────
export default function InteractiveCalendar() {
  const today = new Date();
  const [view, setView]       = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [dark, setDark]       = useState(false);
  const [rangeStart, setRS]   = useState(null);
  const [rangeEnd,   setRE]   = useState(null);
  const [hoverDay,   setHD]   = useState(null);
  const [noteText,   setNT]   = useState("");
  const [savedNotes, setSN]   = useState([]);
  const [tooltip,    setTT]   = useState(null);
  const [animDir,    setAD]   = useState(null); // "left" | "right"
  const [animKey,    setAK]   = useState(0);
  const noteRef = useRef(null);

  const { y, m } = view;
  const totalDays = daysInMonth(y, m);
  const firstDay  = firstDayOf(y, m);
  const photo     = MONTH_PHOTOS[m];

  // Load saved notes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cal_notes");
      if (raw) setSN(JSON.parse(raw));
    } catch {}
  }, []);

  // Navigate months with animation
  const navigate = useCallback((dir) => {
    setAD(dir === 1 ? "left" : "right");
    setAK(k => k + 1);
    setView(v => {
      let nm = v.m + dir, ny = v.y;
      if (nm < 0)  { nm = 11; ny--; }
      if (nm > 11) { nm = 0;  ny++; }
      return { y: ny, m: nm };
    });
    setRS(null); setRE(null); setHD(null);
  }, []);

  // Day click logic
  const handleDayClick = (d) => {
    const cell = { y, m, d };
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRS(cell); setRE(null);
    } else {
      if (isSame(rangeStart, cell)) { setRS(null); return; }
      setRE(cell);
    }
  };

  // Save note
  const saveNote = () => {
    if (!noteText.trim()) return;
    const s = rangeStart, e = rangeEnd || rangeStart;
    if (!s) return;
    const [lo, hi] = toDate(s) <= toDate(e) ? [s, e] : [e, s];
    const entry = {
      id: Date.now(),
      start: lo, end: hi,
      text: noteText.trim(),
      label: `${MONTHS[lo.m].slice(0,3)} ${lo.d}${isSame(lo,hi)?"":" – "+MONTHS[hi.m].slice(0,3)+" "+hi.d}`,
    };
    const updated = [entry, ...savedNotes];
    setSN(updated);
    try { localStorage.setItem("cal_notes", JSON.stringify(updated)); } catch {}
    setNT("");
  };

  const loadNote = (n) => {
    setView({ y: n.start.y, m: n.start.m });
    setRS(n.start); setRE(n.end);
    setNT(n.text);
    noteRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const deleteNote = (id, e) => {
    e.stopPropagation();
    const updated = savedNotes.filter(n => n.id !== id);
    setSN(updated);
    try { localStorage.setItem("cal_notes", JSON.stringify(updated)); } catch {}
  };

  // Effective hover end for preview
  const effectiveEnd = rangeStart && !rangeEnd && hoverDay
    ? { y, m, d: hoverDay } : rangeEnd;

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && m === today.getMonth() && y === today.getFullYear();

  const holidayKey = (d) => `${m+1}-${d}`;

  // ── styles (inline for portability) ──────────────────────────────────────
  const bg    = dark ? "#0f1117" : "#f5f0e8";
  const card  = dark ? "#1a1d27" : "#ffffff";
  const text  = dark ? "#e8e4d9" : "#1a1510";
  const muted = dark ? "#6b7280" : "#9ca3af";
  const acc   = "#3b6fd4";       // blue accent
  const gold  = "#c9a84c";
  const red   = "#e05c5c";

  const rangeStartColor  = acc;
  const rangeEndColor    = acc;
  const rangeInColor     = dark ? "#1e3a6e" : "#dbeafe";
  const hoverPreview     = dark ? "#1e2d50" : "#eff6ff";

  return (
    <div style={{ minHeight:"100vh", background:bg, color:text,
                  fontFamily:"'Georgia', 'Times New Roman', serif",
                  transition:"background .3s, color .3s", padding:"20px 12px" }}>

      {/* ── Header bar ── */}
      <div style={{ maxWidth:1100, margin:"0 auto 18px",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ margin:0, fontSize:"clamp(1.2rem,3vw,1.8rem)",
                     fontWeight:700, letterSpacing:"0.04em", color: acc }}>
          📅 Wall Calendar
        </h1>
        <button onClick={() => setDark(d=>!d)}
          style={{ background:"none", border:`1.5px solid ${muted}`, borderRadius:20,
                   padding:"6px 16px", cursor:"pointer", color:text, fontSize:13,
                   transition:"all .2s" }}>
          {dark ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ maxWidth:1100, margin:"0 auto",
                    display:"grid", gridTemplateColumns:"1fr 300px", gap:20,
                    alignItems:"start" }} className="cal-layout">

        {/* ── Calendar card ── */}
        <div style={{ background:card, borderRadius:16,
                      boxShadow: dark ? "0 8px 40px #0008" : "0 8px 40px #0002",
                      overflow:"hidden", position:"relative" }}>

          {/* Spiral binding */}
          <div style={{ background: dark?"#2a2d3a":"#d1c9b8", height:28, display:"flex",
                        alignItems:"center", justifyContent:"center", gap:18, flexWrap:"wrap",
                        padding:"0 12px" }}>
            {Array.from({length:18}).map((_,i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:"50%",
                background: dark?"#3a3d4a":"#b0a898",
                border:`2px solid ${dark?"#555":"#888"}`,
                boxShadow:"inset 0 1px 2px #0004" }} />
            ))}
          </div>

          {/* Hero photo */}
          <div style={{ position:"relative", height:220, overflow:"hidden" }}>
            <img key={`${y}-${m}`} src={photo} alt={MONTHS[m]}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                       display:"block",
                       animation: animDir
                         ? `slideIn${animDir === "left" ? "L" : "R"} .4s ease`
                         : "fadeIn .5s ease" }} />
            {/* Gradient overlay */}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55))" }} />
            {/* Month badge */}
            <div style={{ position:"absolute", bottom:16, left:20,
                          background: acc, color:"#fff",
                          borderRadius:8, padding:"6px 18px",
                          fontSize:"clamp(1rem,3vw,1.4rem)", fontWeight:700,
                          letterSpacing:"0.06em", boxShadow:"0 4px 16px #0004" }}>
              {MONTHS[m].toUpperCase()} {y}
            </div>
            {/* Nav arrows */}
            <button onClick={() => navigate(-1)}
              style={{ position:"absolute", top:"50%", left:12, transform:"translateY(-50%)",
                       background:"rgba(0,0,0,.45)", color:"#fff", border:"none",
                       borderRadius:"50%", width:36, height:36, cursor:"pointer",
                       fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                       transition:"background .2s" }}
              onMouseEnter={e=>e.target.style.background="rgba(0,0,0,.7)"}
              onMouseLeave={e=>e.target.style.background="rgba(0,0,0,.45)"}>
              ‹
            </button>
            <button onClick={() => navigate(1)}
              style={{ position:"absolute", top:"50%", right:12, transform:"translateY(-50%)",
                       background:"rgba(0,0,0,.45)", color:"#fff", border:"none",
                       borderRadius:"50%", width:36, height:36, cursor:"pointer",
                       fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                       transition:"background .2s" }}
              onMouseEnter={e=>e.target.style.background="rgba(0,0,0,.7)"}
              onMouseLeave={e=>e.target.style.background="rgba(0,0,0,.45)"}>
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
                        background: dark?"#13161f":"#f0ece3",
                        borderBottom:`1px solid ${dark?"#2a2d3a":"#e5ddd0"}` }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:"center", padding:"10px 0",
                                    fontSize:11, fontWeight:700,
                                    letterSpacing:"0.08em",
                                    color: d==="Sun" ? red : d==="Sat" ? acc : muted }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div key={animKey} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
                                      animation:"fadeIn .35s ease",
                                      padding:"4px 8px 12px" }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const cell     = { y, m, d };
              const isStart  = isSame(cell, rangeStart);
              const isEnd    = isSame(cell, effectiveEnd);
              const inR      = inRange(cell, rangeStart, effectiveEnd);
              const isHov    = rangeStart && !rangeEnd && d === hoverDay;
              const isTod    = isToday(d);
              const hKey     = holidayKey(d);
              const holiday  = US_HOLIDAYS[hKey];
              const isWeekend = (i % 7 === 0 || i % 7 === 6);

              let bg2 = "transparent";
              let fg2 = isWeekend ? (i%7===0 ? red : acc) : text;
              let br  = "8px";
              let fw  = "normal";

              if (isStart || isEnd) { bg2 = acc; fg2 = "#fff"; fw = "700"; }
              else if (inR)         { bg2 = rangeInColor; }
              else if (isHov)       { bg2 = hoverPreview; }

              return (
                <div key={d}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={() => setHD(d)}
                  onMouseLeave={() => setHD(null)}
                  style={{ position:"relative", textAlign:"center",
                           padding:"10px 4px", cursor:"pointer", borderRadius:br,
                           background:bg2, color:fg2, fontWeight:fw,
                           transition:"background .15s",
                           margin:"2px 1px" }}>
                  <span style={{ fontSize:"clamp(12px,2vw,15px)" }}>{d}</span>

                  {/* Today ring */}
                  {isTod && !isStart && !isEnd && (
                    <div style={{ position:"absolute", inset:"6px",
                                  border:`2px solid ${gold}`, borderRadius:6,
                                  pointerEvents:"none" }} />
                  )}

                  {/* Holiday dot */}
                  {holiday && (
                    <div
                      onMouseEnter={e => { e.stopPropagation(); setTT({ x:e.clientX, y:e.clientY, text:holiday }); }}
                      onMouseLeave={() => setTT(null)}
                      style={{ width:5, height:5, borderRadius:"50%",
                               background: isStart||isEnd ? "#fff" : red,
                               margin:"2px auto 0", cursor:"default" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Range label */}
          <div style={{ padding:"8px 16px 16px", textAlign:"center",
                        fontSize:13, color:muted, minHeight:36 }}>
            {rangeStart && !rangeEnd && (
              <span>📍 <b style={{color:acc}}>{MONTHS[rangeStart.m]} {rangeStart.d}</b> — click another day to set end</span>
            )}
            {rangeStart && rangeEnd && (() => {
              const [lo, hi] = toDate(rangeStart) <= toDate(rangeEnd)
                ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
              const days = Math.round((toDate(hi)-toDate(lo))/(864e5))+1;
              return (
                <span>✅ <b style={{color:acc}}>{MONTHS[lo.m]} {lo.d} – {MONTHS[hi.m]} {hi.d}</b>
                  &nbsp;({days} day{days!==1?"s":""})</span>
              );
            })()}
            {!rangeStart && <span>Click a date to start selecting a range</span>}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Notes input */}
          <div ref={noteRef} style={{ background:card, borderRadius:14,
                                      boxShadow: dark?"0 4px 20px #0006":"0 4px 20px #0001",
                                      padding:20 }}>
            <h2 style={{ margin:"0 0 12px", fontSize:15, fontWeight:700,
                         letterSpacing:"0.05em", color:acc }}>📝 Notes</h2>
            <textarea
              value={noteText}
              onChange={e => setNT(e.target.value)}
              placeholder={rangeStart
                ? `Add a note for ${MONTHS[m]} ${rangeStart.d}${rangeEnd ? " – "+rangeEnd.d : ""}…`
                : "Select a date range first…"}
              disabled={!rangeStart}
              rows={5}
              style={{ width:"100%", boxSizing:"border-box", resize:"vertical",
                       background: dark?"#13161f":"#faf8f4",
                       color:text, border:`1.5px solid ${dark?"#2a2d3a":"#e5ddd0"}`,
                       borderRadius:8, padding:"10px 12px", fontSize:14,
                       fontFamily:"inherit", outline:"none", transition:"border .2s",
                       opacity: rangeStart ? 1 : 0.5 }} />
            <button onClick={saveNote}
              disabled={!noteText.trim() || !rangeStart}
              style={{ marginTop:10, width:"100%", padding:"10px 0",
                       background: noteText.trim() && rangeStart ? acc : (dark?"#2a2d3a":"#e5ddd0"),
                       color: noteText.trim() && rangeStart ? "#fff" : muted,
                       border:"none", borderRadius:8, cursor: noteText.trim() && rangeStart ? "pointer":"not-allowed",
                       fontWeight:700, fontSize:14, letterSpacing:"0.04em", transition:"all .2s" }}>
              Save Note
            </button>
          </div>

          {/* Saved notes list */}
          {savedNotes.length > 0 && (
            <div style={{ background:card, borderRadius:14,
                          boxShadow: dark?"0 4px 20px #0006":"0 4px 20px #0001",
                          padding:20, maxHeight:360, overflowY:"auto" }}>
              <h2 style={{ margin:"0 0 12px", fontSize:15, fontWeight:700,
                           letterSpacing:"0.05em", color:acc }}>🗒 Saved Notes</h2>
              {savedNotes.map(n => (
                <div key={n.id} onClick={() => loadNote(n)}
                  style={{ background: dark?"#13161f":"#faf8f4",
                            borderRadius:8, padding:"10px 12px", marginBottom:10,
                            cursor:"pointer", border:`1px solid ${dark?"#2a2d3a":"#e5ddd0"}`,
                            transition:"border .2s", position:"relative" }}
                  onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${acc}`}
                  onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${dark?"#2a2d3a":"#e5ddd0"}`}>
                  <div style={{ fontSize:11, color:acc, fontWeight:700,
                                 marginBottom:4, letterSpacing:"0.05em" }}>{n.label}</div>
                  <div style={{ fontSize:13, color:text, lineHeight:1.5,
                                 wordBreak:"break-word",
                                 display:"-webkit-box", WebkitLineClamp:3,
                                 WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {n.text}
                  </div>
                  <button onClick={e => deleteNote(n.id, e)}
                    style={{ position:"absolute", top:8, right:8,
                             background:"none", border:"none", cursor:"pointer",
                             color:muted, fontSize:14, lineHeight:1,
                             padding:"2px 4px", borderRadius:4,
                             transition:"color .2s" }}
                    onMouseEnter={e=>e.target.style.color=red}
                    onMouseLeave={e=>e.target.style.color=muted}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ background:card, borderRadius:14,
                        boxShadow: dark?"0 4px 20px #0006":"0 4px 20px #0001",
                        padding:"14px 18px" }}>
            <h2 style={{ margin:"0 0 10px", fontSize:13, fontWeight:700,
                         letterSpacing:"0.05em", color:acc }}>Legend</h2>
            {[
              { color:acc,           label:"Selected range start/end" },
              { color:rangeInColor,  label:"In-range days" },
              { color:gold,          label:"Today" },
              { color:red,           label:"Holiday / Sunday" },
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center",
                                          gap:8, marginBottom:6 }}>
                <div style={{ width:14, height:14, borderRadius:4,
                               background:l.color, flexShrink:0,
                               border: l.color===gold ? `2px solid ${gold}` : "none" }} />
                <span style={{ fontSize:12, color:muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position:"fixed", top:tooltip.y-36, left:tooltip.x,
                      background:"#1a1a2e", color:"#fff", borderRadius:6,
                      padding:"5px 10px", fontSize:12, fontWeight:600,
                      pointerEvents:"none", zIndex:999,
                      boxShadow:"0 4px 12px #0006", transform:"translateX(-50%)" }}>
          🎉 {tooltip.text}
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideInL { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:none} }
        @keyframes slideInR { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:none} }
        @media(max-width:700px){
          .cal-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
