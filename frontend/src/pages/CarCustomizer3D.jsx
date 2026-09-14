import React, { useState, useEffect, useRef } from 'react';
import { carModel3DAPI, part3dModelsAPI } from '../services/api';
import { sampleCarModels, fallbackCarModel } from '../data/sampleCarModels';
import ThreeDCarViewer from '../components/ThreeDCarViewerPro';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  RotateCcw,
  ZoomIn,
  RefreshCw,
  Bookmark,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShoppingCart,
  Layers,
  Cpu,
  Car,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────── Styles ─────────────────────────── */
const S = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #F4F6F9, #FFFFFF)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    color: '#1E293B',
  },
  header: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    position: 'relative',
    zIndex: 10,
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: {
    background: '#FF6B00',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: 900,
  },
  navPill: {
    display: 'flex',
    alignItems: 'center',
    background: '#F1F5F9',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
  },
  headerCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  totalPrice: { fontSize: '18px', fontWeight: 800, color: '#FF6B00' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'transparent', border: 'none',
    color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#0F172A', color: '#FFF', border: 'none',
    padding: '8px 16px', borderRadius: '6px',
    fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  btnOrange: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#FF6B00', color: '#FFF', border: 'none',
    padding: '12px 20px', borderRadius: '8px',
    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
    width: '100%', marginTop: '16px',
  },
  btnOrangeOutline: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'transparent', color: '#FF6B00',
    border: '2px solid #FF6B00',
    padding: '10px 20px', borderRadius: '8px',
    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
    width: '100%', marginTop: '10px',
  },
  canvasContainer: { position: 'absolute', inset: 0, zIndex: 1, top: '70px' },
  ovalTrackContainer: {
    position: 'absolute', bottom: '10%', left: '50%',
    transform: 'translateX(-50%)',
    width: '80%', maxWidth: '1000px', height: '250px',
    zIndex: 0, pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute', top: '24px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: '16px',
    background: '#FFFFFF', padding: '8px 24px',
    borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10,
  },
  controlBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none',
    color: '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
  rightCard: {
    position: 'absolute', right: '32px', top: '120px',
    width: '360px', background: '#FFFFFF',
    borderRadius: '16px', padding: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    zIndex: 10, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto',
  },
  bottomNav: {
    position: 'absolute', bottom: '32px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', background: '#FFFFFF',
    padding: '6px', borderRadius: '40px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)', zIndex: 10,
  },
  navStep: (isActive) => ({
    padding: '8px 20px', borderRadius: '30px',
    background: isActive ? '#FF6B00' : 'transparent',
    color: isActive ? '#FFF' : '#64748B',
    fontWeight: 600, fontSize: '13px', border: 'none',
    cursor: 'pointer', transition: 'all 0.2s',
  }),
  colorSwatchContainer: {
    position: 'absolute', bottom: '100px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center',
    background: '#FFFFFF', padding: '12px 24px',
    borderRadius: '40px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 10, gap: '24px',
  },
  colorSwatch: (hex, isActive) => ({
    width: '32px', height: '32px', borderRadius: '50%',
    background: hex,
    border: isActive ? '3px solid #FF6B00' : '1px solid #E2E8F0',
    cursor: 'pointer', position: 'relative',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  }),
  optionCard: (isActive) => ({
    border: isActive ? '2px solid #FF6B00' : '1px solid #E2E8F0',
    borderRadius: '12px', padding: '14px',
    marginBottom: '10px', cursor: 'pointer',
    background: isActive ? '#FFF8F0' : '#FFFFFF',
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    transition: 'all 0.2s',
  }),
  partCard: (isActive, isLoading) => ({
    border: isActive ? '2px solid #FF6B00' : '1px solid #E2E8F0',
    borderRadius: '12px', padding: '14px',
    marginBottom: '10px', cursor: isLoading ? 'wait' : 'pointer',
    background: isActive ? '#FFF8F0' : '#FFFFFF',
    display: 'flex', alignItems: 'center', gap: '12px',
    transition: 'all 0.2s',
    opacity: isLoading ? 0.6 : 1,
  }),
  tag: (color = '#FF6B00', bg = '#FFF3E0') => ({
    fontSize: '10px', fontWeight: 700,
    color, background: bg,
    padding: '2px 8px', borderRadius: '4px',
    display: 'inline-block',
  }),
  badge: {
    fontSize: '10px', background: '#10B981', color: '#FFF',
    padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: '4px',
  },
  sectionLabel: {
    fontSize: '11px', fontWeight: 800,
    color: '#FF6B00', letterSpacing: '0.05em', marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '20px', fontWeight: 800,
    marginBottom: '8px', color: '#0F172A',
  },
  sectionDesc: {
    fontSize: '13px', color: '#64748B',
    marginBottom: '20px', lineHeight: 1.5,
  },
  divider: { height: '1px', background: '#F1F5F9', margin: '16px 0' },
  spinnerWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px 0', gap: '12px', color: '#94A3B8',
    fontSize: '13px', fontWeight: 600,
  },
  modifiedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'linear-gradient(135deg, #FF6B00, #FF8C38)',
    color: '#FFF', padding: '4px 12px', borderRadius: '20px',
    fontSize: '11px', fontWeight: 700, marginBottom: '12px',
  },
  formatCurrency: (amount) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount),
};

/* ─────────────────────────── Helpers ─────────────────────────── */
const OvalTrack = () => (
  <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <ellipse cx="500" cy="150" rx="450" ry="120" fill="none" stroke="#FF6B00" strokeWidth="2" strokeOpacity="0.2" />
    <ellipse cx="500" cy="150" rx="480" ry="140" fill="none" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="250" y1="150" x2="750" y2="150" stroke="#FF6B00" strokeWidth="4" strokeOpacity="0.1" strokeLinecap="round" />
  </svg>
);

const Spinner = ({ label = 'Loading...' }) => (
  <div style={S.spinnerWrap}>
    <Loader2 size={28} color="#FF6B00" style={{ animation: 'spin 1s linear infinite' }} />
    <span>{label}</span>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ─────────────────────────── Main Component ─────────────────────────── */
const STAGES = [
  { id: 1, label: 'Car Model', icon: Car },
  { id: 2, label: '3D Parts', icon: Layers },
  { id: 3, label: 'Appearance', icon: Cpu },
];

const CarCustomizer3D = () => {
  const navigate = useNavigate();
  const viewerRef = useRef();

  // ── Data
  const [baseModels, setBaseModels] = useState([]);
  const [part3dModels, setPart3dModels] = useState([]);

  // ── Selection state
  const [selectedBaseModel, setSelectedBaseModel] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);       // Part3dmodel object
  const [activeViewModel, setActiveViewModel] = useState(null); // CarModel3D shown in viewer
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');

  // ── UI state
  const [currentStage, setCurrentStage] = useState(1);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingModified, setLoadingModified] = useState(false);
  const [partError, setPartError] = useState(null);

  /* ── Boot: fetch base car models ── */
  useEffect(() => {
    fetchBaseModels();
  }, []);

  /* ── When base model changes reset part selection ── */
  useEffect(() => {
    if (selectedBaseModel) {
      setActiveViewModel(selectedBaseModel);
      setSelectedPart(null);
      setPartError(null);
      // Set default color from base model
      if (selectedBaseModel.default_colors && Object.keys(selectedBaseModel.default_colors).length > 0) {
        const firstName = Object.keys(selectedBaseModel.default_colors)[0];
        setSelectedColor(selectedBaseModel.default_colors[firstName]);
        setSelectedColorName(firstName);
      }
    }
  }, [selectedBaseModel]);

  /* ── Fetch 3D spare parts lazily when entering stage 2 ── */
  useEffect(() => {
    if (currentStage === 2 && part3dModels.length === 0) {
      fetchPart3dModels();
    }
  }, [currentStage]);

  const fetchBaseModels = async () => {
    try {
      setLoadingModels(true);
      try {
        const res = await carModel3DAPI.getAll();
        const models = res.data.results || res.data || [];
        if (models.length > 0) {
          setBaseModels(models);
          setSelectedBaseModel(models[0]);
          return;
        }
      } catch (err) {
        console.warn('Backend 3D cars API failed, falling back to sample data', err);
      }
      // Fallback to sample data
      const samples = sampleCarModels.length > 0 ? sampleCarModels : [fallbackCarModel];
      setBaseModels(samples);
      setSelectedBaseModel(samples[0]);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchPart3dModels = async () => {
    try {
      setLoadingParts(true);
      const res = await part3dModelsAPI.getAll();
      const parts = res.data.results || res.data || [];
      setPart3dModels(parts);
    } catch (err) {
      console.warn('Could not fetch 3D part models', err);
    } finally {
      setLoadingParts(false);
    }
  };

  /* ── When user clicks a 3D spare part ── */
  const handlePartSelect = async (part) => {
    if (!selectedBaseModel) return;

    setSelectedPart(part);
    setPartError(null);
    setLoadingModified(true);

    try {
      const res = await carModel3DAPI.getByIdWithPart(selectedBaseModel.id, part.id);
      const modifiedModel = res.data;
      setActiveViewModel(modifiedModel);
      // Merge colors: modified model may override defaults
      const colors = modifiedModel.default_colors || selectedBaseModel.default_colors || {};
      if (Object.keys(colors).length > 0) {
        const firstName = Object.keys(colors)[0];
        setSelectedColor(colors[firstName]);
        setSelectedColorName(firstName);
      }
      // Auto-advance to appearance stage
      setCurrentStage(3);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setPartError(`No 3D model found for "${part.name}" on this car. The base model will be shown.`);
        setActiveViewModel(selectedBaseModel);
      } else {
        setPartError('Failed to load modified model. Please try again.');
      }
    } finally {
      setLoadingModified(false);
    }
  };

  /* ── Remove applied part, revert to base model ── */
  const handleClearPart = () => {
    setSelectedPart(null);
    setPartError(null);
    setActiveViewModel(selectedBaseModel);
    if (selectedBaseModel?.default_colors) {
      const firstName = Object.keys(selectedBaseModel.default_colors)[0];
      setSelectedColor(selectedBaseModel.default_colors[firstName]);
      setSelectedColorName(firstName);
    }
  };

  /* ─────────── Stage content renderers ─────────── */
  const renderStage1 = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={S.sectionLabel}>STAGE 01</div>
        <div style={S.tag()}>{baseModels.length} Models</div>
      </div>
      <h2 style={S.sectionTitle}>Car Model</h2>
      <p style={S.sectionDesc}>Choose your base chassis. The 3D model shown in the viewer will update when you pick a car.</p>

      {loadingModels ? (
        <Spinner label="Fetching car models…" />
      ) : (
        baseModels.map(model => {
          const isActive = selectedBaseModel?.id === model.id;
          return (
            <div key={model.id} style={S.optionCard(isActive)} onClick={() => setSelectedBaseModel(model)}>
              <div style={{ marginTop: '2px' }}>
                {isActive ? <CheckCircle2 size={18} color="#FF6B00" /> : <Circle size={18} color="#CBD5E1" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                    {model.brand} {model.name}
                  </div>
                  {isActive && <div style={S.tag()}>SELECTED</div>}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                  {model.description?.substring(0, 55) || 'Base vehicle model'}…
                </div>
              </div>
            </div>
          );
        })
      )}

      <button style={S.btnOrange} onClick={() => setCurrentStage(2)}>
        Next: 3D Spare Parts <ArrowRight size={16} />
      </button>
    </>
  );

  const renderStage2 = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={S.sectionLabel}>STAGE 02</div>
        <div style={S.tag()}>{part3dModels.length} Parts</div>
      </div>
      <h2 style={S.sectionTitle}>3D Spare Parts</h2>
      <p style={S.sectionDesc}>
        Click a spare part to see how it looks on the <strong>{selectedBaseModel?.brand} {selectedBaseModel?.name}</strong>.
      </p>

      {selectedPart && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#16A34A" />
            <strong>{selectedPart.name}</strong> applied
          </div>
          <button onClick={handleClearPart} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>
            ✕ Clear
          </button>
        </div>
      )}

      {partError && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#9A3412' }}>
          ⚠ {partError}
        </div>
      )}

      {loadingParts ? (
        <Spinner label="Fetching 3D spare parts…" />
      ) : part3dModels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: '13px' }}>
          <Layers size={32} color="#CBD5E1" style={{ marginBottom: '8px' }} />
          <div>No 3D part models available yet.</div>
        </div>
      ) : (
        part3dModels.map(part => {
          const isActive = selectedPart?.id === part.id;
          const isThisLoading = loadingModified && isActive;
          return (
            <div
              key={part.id}
              style={S.partCard(isActive, loadingModified)}
              onClick={() => !loadingModified && handlePartSelect(part)}
            >
              {/* Icon */}
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isActive ? '#FFF3E0' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isActive ? '1px solid #FF6B00' : '1px solid #E2E8F0' }}>
                {isThisLoading
                  ? <Loader2 size={18} color="#FF6B00" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Cpu size={18} color={isActive ? '#FF6B00' : '#94A3B8'} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {part.name}
                  </div>
                  {isActive && !isThisLoading && <div style={S.tag()}>APPLIED</div>}
                </div>
                {part.description && (
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
                    {part.description.substring(0, 50)}…
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      <button style={S.btnOrange} onClick={() => setCurrentStage(3)} disabled={loadingModified}>
        Next: Appearance <ArrowRight size={16} />
      </button>
    </>
  );

  const renderStage3 = () => {
    const colors = activeViewModel?.default_colors || selectedBaseModel?.default_colors || {};
    const isModified = selectedPart !== null && activeViewModel?.parent != null;

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={S.sectionLabel}>STAGE 03</div>
          {isModified && (
            <div style={S.modifiedBadge}>
              <CheckCircle2 size={12} /> Modified
            </div>
          )}
        </div>
        <h2 style={S.sectionTitle}>Appearance</h2>

        {/* Applied part info */}
        {selectedPart && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>APPLIED PART</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{selectedPart.name}</div>
              <button onClick={() => { handleClearPart(); setCurrentStage(2); }} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                Change
              </button>
            </div>
            {isModified
              ? <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>✓ Modified 3D model loaded</div>
              : <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>⚠ No modified model — showing base</div>
            }
          </div>
        )}

        <div style={S.divider} />

        {/* Color picker */}
        {Object.keys(colors).length > 0 ? (
          <>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '10px' }}>PAINT COLOR</div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>SELECTED</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: selectedColor, border: '1px solid #CBD5E1' }} />
                {selectedColorName}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {Object.entries(colors).map(([name, hex]) => (
                <div
                  key={name}
                  title={name}
                  style={S.colorSwatch(hex, selectedColor === hex)}
                  onClick={() => { setSelectedColor(hex); setSelectedColorName(name); }}
                >
                  {selectedColor === hex && (
                    <CheckCircle2 size={16} color="#FFF" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={S.sectionDesc}>No color options available for this model.</p>
        )}

        <div style={S.divider} />

        <button style={S.btnOrange} onClick={() => alert('Proceeding to checkout!')}>
          Complete Build & Checkout <ShoppingCart size={16} />
        </button>
        <button style={S.btnOrangeOutline} onClick={() => setCurrentStage(2)}>
          <ArrowLeft size={14} /> Back to Parts
        </button>
      </>
    );
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 1: return renderStage1();
      case 2: return renderStage2();
      case 3: return renderStage3();
      default: return null;
    }
  };

  const activeColors = activeViewModel?.default_colors || selectedBaseModel?.default_colors || {};

  if (loadingModels) {
    return (
      <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner label="Loading 3D Configurator…" />
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.logoArea}>
          <div style={S.logoIcon}>DriveDrip</div>
          <div style={{ width: '1px', height: '24px', background: '#E2E8F0', margin: '0 8px' }} />
          <div style={S.navPill}><span style={{ color: '#FF6B00', marginRight: '6px' }}>●</span> 3D CONFIGURATOR</div>
        </div>

        {selectedBaseModel && (
          <div style={S.headerCenter}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
              <span style={{ color: '#10B981', marginRight: '6px' }}>●</span>
              {selectedBaseModel.brand} {selectedBaseModel.name}
              {selectedPart && <span style={{ color: '#FF6B00', marginLeft: '8px' }}>+ {selectedPart.name}</span>}
            </div>
          </div>
        )}

        <div style={S.headerRight}>
          <button style={S.btnSecondary}><Bookmark size={16} /> Save Spec</button>
          <button style={S.btnPrimary} onClick={() => navigate('/parts')}>
            <ArrowLeft size={16} /> Spare Parts
          </button>
        </div>
      </div>

      {/* ── TOP CONTROLS ── */}
      <div style={S.topControls}>
        <button style={S.controlBtn}><RotateCcw size={14} /> Rotate</button>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
        <button style={S.controlBtn}><ZoomIn size={14} /> Zoom</button>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
        <button style={S.controlBtn} onClick={() => viewerRef.current?.resetView()}><RefreshCw size={14} /> Reset View</button>
      </div>

      {/* ── BACKGROUND ── */}
      <div style={S.ovalTrackContainer}><OvalTrack /></div>

      {/* ── 3D CANVAS ── */}
      <div style={S.canvasContainer}>
        {activeViewModel && (
          <ErrorBoundary>
            <ThreeDCarViewer
              ref={viewerRef}
              modelUrl={activeViewModel.model_file_url || null}
              selectedColor={selectedColor}
              activeView="side"
            />
          </ErrorBoundary>
        )}
      </div>

      {/* ── COLOR SWATCH BAR (stage 3 only) ── */}
      {currentStage === 3 && Object.keys(activeColors).length > 0 && (
        <div style={S.colorSwatchContainer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '24px', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{selectedColorName}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.entries(activeColors).map(([name, hex]) => (
              <div
                key={name}
                style={S.colorSwatch(hex, selectedColor === hex)}
                onClick={() => { setSelectedColor(hex); setSelectedColorName(name); }}
                title={name}
              >
                {selectedColor === hex && (
                  <CheckCircle2 size={16} color="#FFF" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={S.bottomNav}>
        {STAGES.map(stage => (
          <button
            key={stage.id}
            style={S.navStep(currentStage === stage.id)}
            onClick={() => setCurrentStage(stage.id)}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={S.rightCard}>
        {renderStageContent()}
      </div>
    </div>
  );
};

export default CarCustomizer3D;
