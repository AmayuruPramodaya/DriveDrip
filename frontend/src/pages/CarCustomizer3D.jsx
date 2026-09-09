import React, { useState, useEffect } from 'react';
import { carModel3DAPI } from '../services/api';
import { sampleCarModels, fallbackCarModel } from '../data/sampleCarModels';
import ThreeDCarViewer from '../components/ThreeDCarViewerPro';
import {
  Car,
  Palette,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Share,
  AlertTriangle,
  Loader,
  Gauge,
  Sparkles,
  Flame,
  Settings2,
  Cog,
  Lightbulb,
  FlipHorizontal,
  Wind,
  Radio,
  Crown,
  Play,
  Save,
  Target,
  SlidersHorizontal,
  ChevronRight,
  Crosshair,
  Zap,
  Shield,
  Unlock,
  PackageOpen,
  ArrowUpToLine,
} from 'lucide-react';

/* â”€â”€â”€ inline styles â”€â”€â”€ */
const S = {
  root: {
    minHeight: '100vh',
    background: '#060810',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  scanGrid: {
    pointerEvents: 'none',
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(0,210,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.022) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    zIndex: 0,
  },
  glow1: {
    pointerEvents: 'none',
    position: 'fixed',
    top: '-20vh',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60vw',
    height: '40vh',
    background: 'radial-gradient(ellipse, rgba(0,210,255,0.12) 0%, transparent 70%)',
    zIndex: 0,
  },
  glow2: {
    pointerEvents: 'none',
    position: 'fixed',
    bottom: '-15vh',
    right: '-10vw',
    width: '50vw',
    height: '50vh',
    background: 'radial-gradient(ellipse, rgba(168,85,247,0.09) 0%, transparent 70%)',
    zIndex: 0,
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '16px 20px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
};

/* â”€â”€â”€ Corner-tick panel (Gran Turismo / NFS garage HUD style) â”€â”€â”€ */
const Panel = ({ children, style, accent = 'cyan' }) => {
  const map = {
    cyan:   'rgba(0,210,255,0.7)',
    purple: 'rgba(168,85,247,0.7)',
    amber:  'rgba(251,191,36,0.7)',
    green:  'rgba(16,185,129,0.7)',
    red:    'rgba(239,68,68,0.7)',
  };
  const bg = {
    cyan:   'rgba(0,210,255,0.10)',
    purple: 'rgba(168,85,247,0.10)',
    amber:  'rgba(251,191,36,0.10)',
    green:  'rgba(16,185,129,0.10)',
    red:    'rgba(239,68,68,0.10)',
  };
  const c = map[accent] ?? map.cyan;
  const tick = { position: 'absolute', width: 9, height: 9, borderColor: c };
  return (
    <div style={{
      background: 'rgba(6,8,16,0.84)',
      border: `1px solid ${bg[accent] ?? bg.cyan}`,
      backdropFilter: 'blur(20px)',
      position: 'relative',
      ...style,
    }}>
      <span style={{ ...tick, top: 0, left: 0, borderStyle: 'solid', borderWidth: '2px 0 0 2px' }} />
      <span style={{ ...tick, top: 0, right: 0, borderStyle: 'solid', borderWidth: '2px 2px 0 0' }} />
      <span style={{ ...tick, bottom: 0, left: 0, borderStyle: 'solid', borderWidth: '0 0 2px 2px' }} />
      <span style={{ ...tick, bottom: 0, right: 0, borderStyle: 'solid', borderWidth: '0 2px 2px 0' }} />
      {children}
    </div>
  );
};

/* â”€â”€â”€ HUD micro-label â”€â”€â”€ */
const HudLabel = ({ children, color = 'rgba(0,210,255,0.65)' }) => (
  <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color, fontWeight: 700 }}>
    {children}
  </span>
);

/* â”€â”€â”€ Neon toggle pill â”€â”€â”€ */
const NeonPill = ({ children, active, color = '#00d2ff', onClick }) => (
  <button onClick={onClick} style={{
    background: active ? `${color}20` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? color + '80' : 'rgba(255,255,255,0.08)'}`,
    color: active ? color : '#475569',
    padding: '4px 12px', fontSize: 10, letterSpacing: '0.25em',
    textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer',
    boxShadow: active ? `0 0 12px ${color}50` : 'none',
    transition: 'all 0.2s',
  }}>
    {children}
  </button>
);

/* â”€â”€â”€ Telemetry bar â”€â”€â”€ */
const StatBar = ({ label, value, color = '#00d2ff' }) => (
  <div style={{ marginBottom: 9 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <HudLabel color={color + 'aa'}>{label}</HudLabel>
      <span style={{ fontSize: 10, color, fontWeight: 800 }}>{value}</span>
    </div>
    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, value)}%`,
        background: `linear-gradient(90deg, ${color}60, ${color})`,
        boxShadow: `0 0 6px ${color}`,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  </div>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const CarCustomizer3D = () => {
  const [carModels, setCarModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#FF2200');
  const [availableColors, setAvailableColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('paint');
  const [engineState, setEngineState] = useState('idle');
  const [activeView, setActiveView] = useState('front');

  // Animation states for configurator interactions
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [trunkOpen, setTrunkOpen] = useState(false);

  const defaultColors = {
    'Inferno Red':   '#FF2200',
    'Ice Blue':      '#00CFFF',
    'Phantom Black': '#111111',
    'Arctic White':  '#F0F4FF',
    'Gunmetal':      '#4A5568',
    'Neon Green':    '#00FF88',
    'Solar Gold':    '#FFD700',
    'Venom Purple':  '#9F00FF',
    'Toxic Orange':  '#FF6600',
    'Carbon':        '#2D3748',
  };

  useEffect(() => { fetchCarModels(); }, []);

  const fetchCarModels = async () => {
    try {
      setLoading(true);
      try {
        const response = await carModel3DAPI.getAll();
        const models = response.data.results || response.data || [];
        if (models.length > 0) {
          setCarModels(models);
          const first = models[0];
          setSelectedModel(first);
          const colors = first.default_colors || defaultColors;
          setAvailableColors(colors);
          setSelectedColor(Object.values(colors)[0]);
          return;
        }
      } catch { /* fallthrough to sample data */ }
      setCarModels(sampleCarModels);
      if (sampleCarModels.length > 0) {
        const first = sampleCarModels[0];
        setSelectedModel(first);
        const colors = first.default_colors || defaultColors;
        setAvailableColors(colors);
        setSelectedColor(Object.values(colors)[0]);
      }
    } catch {
      setCarModels([fallbackCarModel]);
      setSelectedModel(fallbackCarModel);
      const colors = fallbackCarModel.default_colors;
      setAvailableColors(colors);
      setSelectedColor(Object.values(colors)[0]);
      setError('Using demo data. Backend offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId) => {
    const model = carModels.find(m => m.id === parseInt(modelId));
    if (model) {
      setSelectedModel(model);
      const colors = model.default_colors || defaultColors;
      setAvailableColors(colors);
      setSelectedColor(Object.values(colors)[0]);
    }
  };

  const garageModes = [
    { id: 'paint',  label: 'Paint',  icon: Palette,  color: '#00d2ff' },
    { id: 'wheels', label: 'Wheels', icon: Cog,       color: '#a855f7' },
    { id: 'lights', label: 'Lights', icon: Lightbulb, color: '#fbbf24' },
    { id: 'aero',   label: 'Aero',   icon: Wind,      color: '#10b981' },
    { id: 'audio',  label: 'Audio',  icon: Radio,     color: '#f472b6' },
  ];

  /* â”€â”€ LOADING â”€â”€ */
  if (loading) return (
    <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={S.scanGrid} />
      <div style={S.glow1} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 68, height: 68, border: '2px solid rgba(0,210,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', animation: 'spin 1.1s linear infinite',
          boxShadow: '0 0 28px rgba(0,210,255,0.15)',
        }}>
          <Loader size={28} color="#00d2ff" />
        </div>
        <HudLabel>Initialising simulation bay</HudLabel>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '10px 0 0', letterSpacing: '-0.02em' }}>
          LOADING GARAGE
        </h2>
      </div>
    </div>
  );

  /* â”€â”€ ERROR â”€â”€ */
  if (error && carModels.length === 0) return (
    <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={S.scanGrid} />
      <Panel accent="red" style={{ padding: 36, maxWidth: 400, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: 14 }} />
        <HudLabel color="#ef4444aa">System fault</HudLabel>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '10px 0' }}>GARAGE OFFLINE</h2>
        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 18 }}>{error}</p>
        <button onClick={fetchCarModels} style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
          color: '#fca5a5', padding: '9px 22px', cursor: 'pointer',
          fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          Reconnect
        </button>
      </Panel>
    </div>
  );

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     MAIN HUD
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;background:#06080f}
        ::-webkit-scrollbar-thumb{background:rgba(0,210,255,0.25)}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 6px rgba(16,185,129,0.6)}50%{box-shadow:0 0 18px rgba(16,185,129,1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .hbtn:hover{opacity:0.82;transform:translateY(-1px)}
        .swatch:hover{transform:scale(1.07)}
        .mpill:hover{opacity:0.85}
        .vbtn:hover{color:#00d2ff!important;border-top-color:#00d2ff!important}
      `}</style>

      <div style={S.scanGrid} />
      <div style={S.glow1} />
      <div style={S.glow2} />

      <div style={S.wrap}>

        {/* â”€â”€ TOP BAR â”€â”€ */}
        <Panel accent="cyan" style={{ padding: '10px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,210,255,0.2)',
              }}>
                <Car size={18} color="#00d2ff" />
              </div>
              <div>
                <HudLabel>DriveDrip // Garage v2.4</HudLabel>
                <h1 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '2px 0 0', letterSpacing: '0.05em' }}>
                  3D CAR CUSTOMIZER
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <HudLabel color="rgba(16,185,129,0.8)">SIM ACTIVE</HudLabel>
              <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 4px' }}>|</span>
              <HudLabel>{selectedModel ? `${selectedModel.brand} ${selectedModel.name}` : 'No model'}</HudLabel>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="hbtn" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
                color: '#64748b', padding: '6px 14px', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <Share size={12} /> Share
              </button>
              <button className="hbtn" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,#00d2ff,#0055ff)',
                border: 'none', color: '#000',
                padding: '6px 16px', fontSize: 10, fontWeight: 900,
                letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0,210,255,0.35)', transition: 'all 0.2s',
              }}>
                <Download size={12} /> Export
              </button>
            </div>
          </div>
        </Panel>

        {/* â”€â”€ 3-COLUMN GRID â”€â”€ */}
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 230px', gap: 12, alignItems: 'start' }}>

          {/* â•â•â• LEFT â•â•â• */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Panel accent="cyan" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <HudLabel>Vehicle selection</HudLabel>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 3, letterSpacing: '0.08em' }}>GARAGE BAY</div>
                </div>
                <Gauge size={16} color="rgba(0,210,255,0.5)" />
              </div>
              <HudLabel>Car model</HudLabel>
              <div style={{ position: 'relative', marginTop: 5 }}>
                <select
                  value={selectedModel?.id || ''}
                  onChange={(e) => handleModelChange(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.55)',
                    border: '1px solid rgba(0,210,255,0.18)', color: '#e2e8f0',
                    padding: '8px 30px 8px 10px', fontSize: 12, fontWeight: 600,
                    outline: 'none', appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {carModels.map(m => (
                    <option key={m.id} value={m.id} style={{ background: '#080c1a' }}>
                      {m.brand} {m.name}
                    </option>
                  ))}
                </select>
                <ChevronRight size={12} color="rgba(0,210,255,0.5)" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
              </div>
              {selectedModel && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 11, color: '#64748b', lineHeight: 1.6,
                }}>
                  {selectedModel.description || 'High-performance simulation model.'}
                </div>
              )}
            </Panel>

            <Panel accent="purple" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 12 }}>
                <HudLabel color="rgba(168,85,247,0.7)">Tune category</HudLabel>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 3, letterSpacing: '0.08em' }}>BUILD MODES</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {garageModes.map(({ id, label, icon: Icon, color }) => {
                  const on = activeMode === id;
                  return (
                    <button key={id} className="mpill" onClick={() => setActiveMode(id)} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 12px',
                      background: on ? `${color}14` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${on ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                      color: on ? color : '#475569',
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      boxShadow: on ? `0 0 10px ${color}20` : 'none',
                      transition: 'all 0.18s', textAlign: 'left',
                    }}>
                      <Icon size={13} />
                      {label}
                      {on && <ChevronRight size={11} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{
                marginTop: 10, padding: '8px 10px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Flame size={13} color={engineState === 'boost' ? '#f97316' : '#334155'} />
                  <HudLabel>Engine</HudLabel>
                </div>
                <NeonPill active={engineState === 'boost'} color="#f97316"
                  onClick={() => setEngineState(s => s === 'boost' ? 'idle' : 'boost')}>
                  {engineState}
                </NeonPill>
              </div>
            </Panel>

            <Panel accent="green" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 12 }}>
                <HudLabel color="rgba(16,185,129,0.7)">Live telemetry</HudLabel>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 3, letterSpacing: '0.08em' }}>PERFORMANCE</div>
              </div>
              <StatBar label="Horsepower"  value={87} color="#00d2ff" />
              <StatBar label="Torque"      value={72} color="#a855f7" />
              <StatBar label="Aero drag"   value={55} color="#10b981" />
              <StatBar label="Weight dist" value={63} color="#fbbf24" />
            </Panel>
          </div>

          {/* â•â•â• CENTER â€” 3D VIEWER â•â•â• */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Panel accent="cyan" style={{ padding: 0, overflow: 'hidden' }}>
              {/* toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px', borderBottom: '1px solid rgba(0,210,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    padding: '3px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
                    textTransform: 'uppercase', background: 'rgba(0,210,255,0.1)',
                    border: '1px solid rgba(0,210,255,0.25)', color: '#00d2ff',
                  }}>
                    {activeMode}
                  </div>
                  <HudLabel>interactive garage scene</HudLabel>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[
                    { icon: RotateCcw, tip: 'Reset',    act: () => setEngineState('idle')       },
                    { icon: Zap,       tip: 'Boost',    act: () => setEngineState('boost')      },
                    { icon: Crown,     tip: 'Showcase', act: () => setActiveMode('showcase')    },
                    { icon: Save,      tip: 'Save',     act: () => {}                           },
                  ].map(({ icon: Icon, tip, act }) => (
                    <button key={tip} className="hbtn" onClick={act} title={tip} style={{
                      width: 30, height: 30, background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#334155', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    }}>
                      <Icon size={12} />
                    </button>
                  ))}
                </div>
              </div>

              {/* canvas */}
              <div style={{
                position: 'relative', height: 500,
                background: 'radial-gradient(ellipse at 50% 35%, rgba(0,210,255,0.06) 0%, rgba(6,8,16,0.98) 68%)',
              }}>
                <div style={{
                  position: 'absolute', bottom: 58, left: '8%', right: '8%', height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(0,210,255,0.18), transparent)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, insetInline: 0, height: 70,
                  background: 'linear-gradient(to top, rgba(0,210,255,0.04), transparent)',
                  pointerEvents: 'none',
                }} />

                {selectedModel ? (
                  <ThreeDCarViewer
                    modelUrl={selectedModel.model_file_url || null}
                    selectedColor={selectedColor}
                    openDoors={doorsOpen}
                    openHood={hoodOpen}
                    openTrunk={trunkOpen}
                    activeView={activeView}
                  />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                    <Car size={48} color="rgba(255,255,255,0.07)" />
                    <HudLabel>Select a vehicle to load</HudLabel>
                  </div>
                )}

                {/* HUD overlays */}
                <div style={{
                  position: 'absolute', top: 10, left: 12,
                  background: 'rgba(6,8,16,0.72)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,210,255,0.15)', padding: '7px 11px',
                }}>
                  <HudLabel>Current Build</HudLabel>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                    {selectedModel?.brand} {selectedModel?.name}
                  </div>
                </div>

                <div style={{
                  position: 'absolute', top: 10, right: 12,
                  background: 'rgba(6,8,16,0.72)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)', padding: '7px 11px',
                }}>
                  <HudLabel>Finish</HudLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                    <div style={{
                      width: 14, height: 14, background: selectedColor,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: `0 0 8px ${selectedColor}`,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                      {selectedColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(6,8,16,0.65)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.06)', padding: '6px 10px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}>
                  {[
                    { icon: RotateCcw,     label: 'Drag Â· Rotate'  },
                    { icon: ZoomIn,        label: 'Scroll Â· Zoom'  },
                    { icon: FlipHorizontal, label: 'R-Drag Â· Pan'  },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={9} color="#334155" />
                      <HudLabel>{label}</HudLabel>
                    </div>
                  ))}
                </div>

                <Crosshair size={16} color="rgba(0,210,255,0.12)" style={{ position: 'absolute', bottom: 12, left: 12 }} />
              </div>

              {/* view angle tabs */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(0,210,255,0.08)' }}>
                {['Front', 'Side', 'Rear', 'Top'].map(v => {
                  const on = activeView === v.toLowerCase();
                  return (
                    <button key={v} className="vbtn" onClick={() => setActiveView(v.toLowerCase())} style={{
                      flex: 1, padding: '9px 0',
                      background: on ? 'rgba(0,210,255,0.07)' : 'transparent',
                      border: 'none',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      borderTop: `2px solid ${on ? '#00d2ff' : 'transparent'}`,
                      color: on ? '#00d2ff' : '#334155',
                      fontSize: 9, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.25em', textTransform: 'uppercase', transition: 'all 0.2s',
                    }}>
                      {v}
                    </button>
                  );
                })}
              </div>
            </Panel>

            {/* status row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: Target,   label: 'Controls', color: '#00d2ff', accent: 'cyan',   text: 'Drag â€¢ Zoom â€¢ Pan'                                          },
                { icon: Sparkles, label: 'Mode',     color: '#a855f7', accent: 'purple', text: `Active: ${activeMode}`                                      },
                { icon: Shield,   label: 'System',   color: '#10b981', accent: 'green',  text: engineState === 'boost' ? 'âš¡ BOOST ACTIVE' : 'Garage ready' },
              ].map(({ icon: Icon, label, color, accent, text }) => (
                <Panel key={label} accent={accent} style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Icon size={12} color={color} />
                    <HudLabel color={color + 'aa'}>{label}</HudLabel>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>{text}</div>
                </Panel>
              ))}
            </div>
          </div>

          {/* â•â•â• RIGHT â•â•â• */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Panel accent="purple" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 12 }}>
                <HudLabel color="rgba(168,85,247,0.7)">Neon paint lab</HudLabel>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 3, letterSpacing: '0.08em' }}>COLOR GRID</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {Object.entries(availableColors).map(([name, hex]) => {
                  const on = selectedColor === hex;
                  return (
                    <button key={name} className="swatch" onClick={() => setSelectedColor(hex)} style={{
                      padding: '6px 5px',
                      background: on ? `${hex}18` : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${on ? hex + '70' : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer', transition: 'all 0.17s',
                      boxShadow: on ? `0 0 12px ${hex}45` : 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <div style={{
                        width: '100%', height: 18, background: hex,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: on ? `0 0 8px ${hex}` : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                      }} />
                      <span style={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
                        color: on ? '#fff' : '#334155', textTransform: 'uppercase',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                      }}>
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 10 }}>
                <HudLabel>Custom RGB</HudLabel>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{
                    marginTop: 5, width: '100%', height: 34, cursor: 'pointer',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)', padding: 2,
                  }}
                />
              </div>
            </Panel>

            <Panel accent="amber" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Crown size={14} color="#fbbf24" />
                <div>
                  <HudLabel color="rgba(251,191,36,0.7)">Featured build</HudLabel>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 3, letterSpacing: '0.08em' }}>GARAGE NOTES</div>
                </div>
              </div>
              {[
                { t: 'Paint shop',      d: 'Neon swatches + custom RGB.' },
                { t: 'Simulation view', d: 'Game-like showcase stage.'   },
                { t: 'Export ready',    d: 'Save & share from HUD.'      },
              ].map(({ t, d }) => (
                <div key={t} style={{
                  marginBottom: 6, padding: '8px 10px',
                  background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{t}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{d}</div>
                </div>
              ))}
            </Panel>

            <Panel accent="green" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 10 }}>
                <HudLabel color="rgba(16,185,129,0.7)">Quick actions</HudLabel>
              </div>
              {[
                { label: 'Toggle Doors',  icon: Unlock,        color: '#00d2ff', act: () => setDoorsOpen(prev => !prev) },
                { label: 'Toggle Hood',   icon: ArrowUpToLine, color: '#f97316', act: () => setHoodOpen(prev => !prev)  },
                { label: 'Toggle Trunk',  icon: PackageOpen,   color: '#fbbf24', act: () => setTrunkOpen(prev => !prev) },
                { label: 'Save Build',    icon: Save,          color: '#10b981', act: () => {}                        },
              ].map(({ label, icon: Icon, color, act }) => (
                <button key={label} className="hbtn" onClick={act} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', marginBottom: 5, width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: '#475569', cursor: 'pointer',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                  transition: 'all 0.18s', textAlign: 'left',
                }}>
                  <Icon size={12} color={color} />
                  {label}
                </button>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCustomizer3D;
