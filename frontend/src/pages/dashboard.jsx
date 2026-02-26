import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, ArrowRight, Monitor, Smartphone, Zap,
  UploadCloud, Trash2, Loader2, RefreshCw, CheckCircle2,
  ThumbsUp, ThumbsDown, Edit3, Eye, ExternalLink,
  History, ChevronLeft, ChevronRight, FileText, Mic, BookOpen
} from 'lucide-react';

/* ─── Starfield helpers ─── */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

const STAR_COUNT = 80;

const StarField = () => {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      top: randomBetween(0, 100),
      left: randomBetween(0, 100),
      size: randomBetween(0.6, 2.4),
      duration: randomBetween(2.5, 7),
      delay: randomBetween(0, 6),
      opacity: randomBetween(0.4, 1),
    }));
  }, []);

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {stars.map((s) => (
        <span
          key={s.id}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            backgroundColor: '#fff',
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(255,255,255,0.3)`,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Dashboard Component ─── */
const StitchInterface = () => {
  const [device, setDevice] = useState('app');
  const [prompt, setPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [appState, setAppState] = useState('idle');
  const [feedback, setFeedback] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_CHARS = 1000;

  const handleSend = () => {
    if (!prompt.trim()) return;
    setAppState('generating');
    setFeedback(null);
    setTimeout(() => setAppState('success'), 2500);
  };

  const handleRefine = () => {
    setAppState('idle');
  };

  const handleReset = () => {
    setAppState('idle');
    setPrompt('');
    setFeedback(null);
  };

  const suggestions = [
    "Explain the key concepts from my Data Structures notes",
    "Create flashcards from my Organic Chemistry lecture",
    "Summarize Chapter 5 of my Machine Learning textbook",
    "Quiz me on the important topics from my Biology notes"
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#05050a',
      color: '#e2e8f0',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes twinkle { 0% { opacity: 0.15; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.3); } }
        @keyframes driftStar1 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(85vw, 40vh); opacity: 0; }
        }
        @keyframes driftStar2 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translate(-70vw, 55vh); opacity: 0; }
        }
        @keyframes driftStar3 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translate(60vw, -35vh); opacity: 0; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .drifting-star {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .card-glass:hover {
          border-color: rgba(124,58,237,0.35);
          box-shadow: 0 0 20px rgba(124,58,237,0.1);
        }
        .btn-purple {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
          transition: all 0.2s ease;
        }
        .btn-purple:hover {
          box-shadow: 0 6px 32px rgba(124,58,237,0.6);
          transform: translateY(-1px);
        }
        .sidebar-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px;
          transition: all 0.2s;
        }
        .sidebar-item:hover {
          border-color: rgba(124,58,237,0.3);
          background: rgba(124,58,237,0.06);
        }
        .suggestion-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px 18px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.25s;
          text-align: left;
          line-height: 1.5;
        }
        .suggestion-btn:hover {
          border-color: rgba(124,58,237,0.4);
          color: #e2e8f0;
          background: rgba(124,58,237,0.08);
          transform: translateY(-2px);
        }
        .input-glow {
          position: relative;
        }
        .input-glow::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2), rgba(56,189,248,0.15));
          z-index: -1;
          opacity: 0;
          transition: opacity 0.5s;
        }
        .input-glow:focus-within::before {
          opacity: 1;
        }
      `}</style>

      <StarField />

      {/* Drifting stars */}
      <div className="drifting-star" style={{
        top: '15%', left: '5%', width: 3, height: 3,
        background: '#fff', boxShadow: '0 0 6px 2px rgba(255,255,255,0.5)',
        animation: 'driftStar1 25s linear infinite',
      }} />
      <div className="drifting-star" style={{
        top: '60%', right: '8%', width: 2.5, height: 2.5,
        background: '#c4b5fd', boxShadow: '0 0 8px 3px rgba(196,181,253,0.4)',
        animation: 'driftStar2 32s 4s linear infinite',
      }} />
      <div className="drifting-star" style={{
        bottom: '20%', left: '40%', width: 2, height: 2,
        background: '#93c5fd', boxShadow: '0 0 6px 2px rgba(147,197,253,0.4)',
        animation: 'driftStar3 28s 8s linear infinite',
      }} />

      {/* Nebula glows */}
      <div style={{
        position: 'fixed', width: 500, height: 500, top: '-100px', left: '-100px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', width: 400, height: 400, bottom: '10%', right: '-80px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ─── SIDEBAR ─── */}
      <aside style={{
        position: 'relative',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,5,12,0.95)',
        backdropFilter: 'blur(16px)',
        transition: 'width 0.3s ease',
        width: isSidebarOpen ? 260 : 0,
        overflow: 'hidden',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ padding: 24, width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <History style={{ width: 18, height: 18, color: '#a78bfa' }} />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Recent Work</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appState === 'success' && (
              <div className="sidebar-item" style={{ animation: 'fadeInUp 0.3s ease' }}>
                <p style={{ fontSize: 12, color: '#fff', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prompt}</p>
                <p style={{ fontSize: 10, color: '#4b5563', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Just now</p>
              </div>
            )}
            <p style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '8px 0 4px 4px' }}>Older</p>
            <div style={{
              height: 70, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#334155',
            }}>History empty</div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            zIndex: 50, padding: 6, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
            color: '#94a3b8', cursor: 'pointer', display: 'flex', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          {isSidebarOpen ? <ChevronLeft style={{ width: 16, height: 16 }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
        </button>

        {/* Navigation */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 40px', maxWidth: '1280px', margin: '0 auto', width: '100%',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#7C3AED', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ color: '#fff', width: 22, height: 22 }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Smash AI</span>
            <span style={{
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              fontSize: 9, padding: '3px 8px', borderRadius: 999, color: '#a78bfa',
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>BETA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#ffffff'}
              onMouseOut={e => e.target.style.color = '#94a3b8'}
            >Home</Link>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #3b82f6, #10b981)',
              border: '2px solid rgba(255,255,255,0.15)',
            }} />
          </div>
        </nav>

        {/* Main Area */}
        <main style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 40px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ─── GENERATING STATE ─── */}
          {appState === 'generating' && (
            <div style={{ paddingTop: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, animation: 'fadeInUp 0.5s ease' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: -20,
                  background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                  borderRadius: '50%',
                }} />
                <Loader2 style={{ width: 48, height: 48, color: '#7C3AED', animation: 'spinSlow 1.5s linear infinite', position: 'relative', zIndex: 1 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>Analyzing your notes...</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Our AI is processing your {device === 'app' ? 'mobile' : 'web'} study session...</p>
              </div>
              <div style={{
                width: '100%', maxWidth: 400, height: 6,
                background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: '50%',
                  background: 'linear-gradient(90deg, #7C3AED, #3b82f6, #38bdf8)',
                  borderRadius: 99,
                  animation: 'progress 2s ease-in-out infinite',
                }} />
              </div>
            </div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {appState === 'success' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.5s ease' }}>
              {/* Success header */}
              <div className="card-glass" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', borderRadius: 20, flexWrap: 'wrap', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    padding: 8, borderRadius: 12,
                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                  }}>
                    <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: '#f1f5f9', margin: 0, fontSize: 15 }}>Study session ready</h3>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>Your notes have been processed</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleRefine} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <Edit3 style={{ width: 13, height: 13 }} /> Refine
                  </button>
                  <button onClick={handleReset} className="btn-purple" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                    color: '#fff', border: 'none', cursor: 'pointer',
                  }}>
                    <RefreshCw style={{ width: 13, height: 13 }} /> New Session
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Preview card */}
                <div className="card-glass" style={{
                  borderRadius: 24, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 280 }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)',
                    }} />
                    <Monitor style={{ width: 48, height: 48, color: '#1e293b' }} />
                  </div>
                  {/* Bottom bar */}
                  <div style={{
                    padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', letterSpacing: '1px' }}>SESSION_ID: SM-{Math.floor(Math.random() * 9000 + 1000)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase' }}>Helpful?</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setFeedback('up')} style={{
                          padding: 5, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: feedback === 'up' ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: feedback === 'up' ? '#10b981' : '#4b5563',
                        }}>
                          <ThumbsUp style={{ width: 15, height: 15 }} />
                        </button>
                        <button onClick={() => setFeedback('down')} style={{
                          padding: 5, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: feedback === 'down' ? 'rgba(239,68,68,0.15)' : 'transparent',
                          color: feedback === 'down' ? '#ef4444' : '#4b5563',
                        }}>
                          <ThumbsDown style={{ width: 15, height: 15 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card-glass" style={{ borderRadius: 22, padding: '24px 20px' }}>
                    <h4 style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px' }}>Session Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        ['Type', device === 'app' ? 'Mobile App' : 'Web App'],
                        ['Notes Parsed', '12 pages'],
                        ['Flashcards', '24 generated'],
                      ].map(([label, val], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#4b5563' }}>{label}</span>
                          <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn-purple" style={{
                    width: '100%', padding: '14px 0', borderRadius: 16,
                    fontWeight: 700, fontSize: 14, color: '#fff', border: 'none',
                    cursor: 'pointer',
                  }}>
                    Export Study Guide
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── IDLE STATE ─── */}
          {appState === 'idle' && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Start a new</h2>
                <div style={{
                  display: 'flex', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 4,
                }}>
                  {[
                    { key: 'app', icon: <Smartphone style={{ width: 15, height: 15 }} />, label: 'App' },
                    { key: 'web', icon: <Monitor style={{ width: 15, height: 15 }} />, label: 'Web' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setDevice(opt.key)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 10, border: 'none',
                      background: device === opt.key ? 'rgba(124,58,237,0.2)' : 'transparent',
                      color: device === opt.key ? '#e2e8f0' : '#4b5563',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>session</h2>
              </div>

              {/* File drop area */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); }}
                style={{
                  width: '100%', marginBottom: 16,
                  border: `2px dashed ${isDragging ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '32px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: isDragging ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{
                  padding: 10, borderRadius: '50%', marginBottom: 10,
                  background: isDragging ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                  transition: 'all 0.3s',
                }}>
                  <UploadCloud style={{ width: 26, height: 26, color: isDragging ? '#a78bfa' : '#4b5563' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                  Drop files here or <span style={{ color: '#a78bfa', fontWeight: 700 }}>browse</span>
                </p>
                <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>PDF, PNG, JPG or Figma links</p>
              </div>

              {/* Main input area */}
              <div className="input-glow" style={{ width: '100%' }}>
                <div style={{
                  background: 'rgba(8,8,15,0.9)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 22, padding: 24, minHeight: 220,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                }}>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    maxLength={MAX_CHARS}
                    placeholder="Ask anything about your notes..."
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 18, color: '#f1f5f9', resize: 'none', width: '100%', height: 120,
                      fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 10, fontFamily: 'monospace',
                          color: prompt.length > MAX_CHARS * 0.9 ? '#ef4444' : '#334155',
                        }}>{prompt.length} / {MAX_CHARS}</span>
                        {prompt.length > 0 && (
                          <button onClick={() => setPrompt('')} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 10, color: '#4b5563', background: 'none', border: 'none',
                            cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase',
                            transition: 'color 0.2s',
                          }}
                            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={e => e.currentTarget.style.color = '#4b5563'}
                          >
                            <Trash2 style={{ width: 11, height: 11 }} /> Clear
                          </button>
                        )}
                      </div>
                      <button style={{
                        padding: 8, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: '#4b5563', cursor: 'pointer',
                        display: 'flex', transition: 'all 0.2s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <Plus style={{ width: 18, height: 18 }} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7C3AED, #10b981)',
                        }} />
                        <span style={{ color: '#94a3b8' }}>3.0 Flash</span>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!prompt.trim()}
                        style={{
                          padding: 12, borderRadius: '50%', border: 'none', cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                          background: prompt.trim() ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                          color: prompt.trim() ? '#fff' : '#334155',
                          transition: 'all 0.3s', display: 'flex',
                          boxShadow: prompt.trim() ? '0 4px 20px rgba(124,58,237,0.5)' : 'none',
                        }}
                      >
                        <ArrowRight style={{ width: 20, height: 20 }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div style={{ width: '100%', marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {suggestions.map((text, i) => (
                  <button key={i} onClick={() => setPrompt(text)} className="suggestion-btn">
                    {text}
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StitchInterface;