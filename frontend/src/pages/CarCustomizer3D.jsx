import React, { useState, useEffect, useRef } from 'react';
import { carModel3DAPI } from '../services/api';
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
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
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
  headerCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#FF6B00',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: 'none',
    color: '#475569',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0F172A',
    color: '#FFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnOrange: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#FF6B00',
    color: '#FFF',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px',
  },
  canvasContainer: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    top: '70px', // below header
  },
  ovalTrackContainer: {
    position: 'absolute',
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    maxWidth: '1000px',
    height: '250px',
    zIndex: 0,
    pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px',
    background: '#FFFFFF',
    padding: '8px 24px',
    borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  controlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rightCard: {
    position: 'absolute',
    right: '32px',
    top: '120px',
    width: '360px',
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    zIndex: 10,
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
  },
  bottomNav: {
    position: 'absolute',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    background: '#FFFFFF',
    padding: '6px',
    borderRadius: '40px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    zIndex: 10,
  },
  navStep: (isActive) => ({
    padding: '8px 20px',
    borderRadius: '30px',
    background: isActive ? '#FF6B00' : 'transparent',
    color: isActive ? '#FFF' : '#64748B',
    fontWeight: 600,
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  colorSwatchContainer: {
    position: 'absolute',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    background: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: '40px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 10,
    gap: '24px',
  },
  colorSwatch: (hex, isActive) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: hex,
    border: isActive ? '3px solid #FF6B00' : '1px solid #E2E8F0',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  }),
  optionCard: (isActive) => ({
    border: isActive ? '2px solid #FF6B00' : '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    transition: 'all 0.2s',
  }),
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount);
  }
};

const OvalTrack = () => (
  <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <ellipse cx="500" cy="150" rx="450" ry="120" fill="none" stroke="#FF6B00" strokeWidth="2" strokeOpacity="0.2" />
    <ellipse cx="500" cy="150" rx="480" ry="140" fill="none" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="250" y1="150" x2="750" y2="150" stroke="#FF6B00" strokeWidth="4" strokeOpacity="0.1" strokeLinecap="round" />
  </svg>
);

const CarCustomizer3D = () => {
  const navigate = useNavigate();
  const viewerRef = useRef();

  const [carModels, setCarModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  const [currentStage, setCurrentStage] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [selectedSpoiler, setSelectedSpoiler] = useState(null);

  const [loading, setLoading] = useState(true);

  const STAGES = [
    { id: 1, label: 'Car Model' },
    { id: 2, label: 'Paint Color' },
    { id: 3, label: 'Alloy Wheels' },
    { id: 4, label: 'Spoilers' }
  ];

  useEffect(() => {
    fetchCarModels();
  }, []);

  const fetchCarModels = async () => {
    try {
      setLoading(true);
      try {
        const response = await carModel3DAPI.getAll();
        const models = response.data.results || response.data || [];
        if (models.length > 0) {
          initializeData(models);
          return;
        }
      } catch (err) {
        console.warn('Backend 3D cars API failed, falling back to sample data', err);
      }
      initializeData(sampleCarModels);
    } catch (err) {
      initializeData([fallbackCarModel]);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = (models) => {
    setCarModels(models);
    if (models.length > 0) {
      handleModelSelect(models[0]);
    }
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);

    // Set default color
    if (model.default_colors && Object.keys(model.default_colors).length > 0) {
      const firstColorName = Object.keys(model.default_colors)[0];
      setSelectedColor(model.default_colors[firstColorName]);
      setSelectedColorName(firstColorName);
    }

    // Set default wheel
    if (model.alloy_wheels && model.alloy_wheels.length > 0) {
      setSelectedWheel(model.alloy_wheels[0]);
    } else {
      setSelectedWheel(null);
    }

    // Set default spoiler
    if (model.spoilers && model.spoilers.length > 0) {
      setSelectedSpoiler(model.spoilers[0]);
    } else {
      setSelectedSpoiler(null);
    }
  };

  const calculateTotal = () => {
    if (!selectedModel) return 0;
    let total = parseFloat(selectedModel.base_price || 0);
    if (selectedWheel) total += parseFloat(selectedWheel.price || 0);
    if (selectedSpoiler) total += parseFloat(selectedSpoiler.price || 0);
    return total;
  };

  const renderStageContent = () => {
    if (!selectedModel) return null;

    switch (currentStage) {
      case 1:
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF6B00', letterSpacing: '0.05em' }}>STAGE 01</div>
              <div style={{ fontSize: '11px', color: '#FF6B00', background: '#FFF3E0', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>{carModels.length} Architectures</div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Car Model Selection</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.5 }}>
              Choose your core chassis base before configuring custom styling, finish and aero parts.
            </p>

            {carModels.map(model => {
              const isActive = selectedModel.id === model.id;
              return (
                <div key={model.id} style={S.optionCard(isActive)} onClick={() => handleModelSelect(model)}>
                  <div style={{ marginTop: '2px' }}>
                    {isActive ? <CheckCircle2 size={18} color="#FF6B00" /> : <Circle size={18} color="#CBD5E1" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{model.brand} {model.name}</div>
                      {isActive && <div style={{ fontSize: '10px', background: '#FF6B00', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>SELECTED</div>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{model.description?.substring(0, 40)}...</div>
                  </div>
                </div>
              )
            })}

            <button style={S.btnOrange} onClick={() => setCurrentStage(2)}>
              Next: Color Customization <ArrowRight size={16} />
            </button>
          </>
        );

      case 2:
        return (
          <>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF6B00', letterSpacing: '0.05em', marginBottom: '16px' }}>STAGE 02</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Paint Color</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.5 }}>
              Select a premium finish for your exterior.
            </p>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>SELECTED COLOR</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: selectedColor, border: '1px solid #CBD5E1' }} />
                {selectedColorName}
              </div>
            </div>
            <button style={{ ...S.btnOrange, marginTop: '24px' }} onClick={() => setCurrentStage(3)}>
              Next: Alloy Wheels <ArrowRight size={16} />
            </button>
          </>
        );

      case 3:
        return (
          <>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF6B00', letterSpacing: '0.05em', marginBottom: '16px' }}>STAGE 03</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Alloy Wheel Selection</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.5 }}>
              Select forged or lightweight performance wheels with calibrated offset and brake clearance.
            </p>

            {(selectedModel.alloy_wheels || []).map(wheel => {
              const isActive = selectedWheel?.id === wheel.id;
              return (
                <div key={wheel.id} style={S.optionCard(isActive)} onClick={() => setSelectedWheel(wheel)}>
                  <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Circle size={20} color="#64748B" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{wheel.name}</div>
                      {isActive && <div style={{ fontSize: '10px', background: '#FF6B00', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>SELECTED</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{wheel.description}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                      {wheel.price > 0 ? `+${S.formatCurrency(wheel.price)}` : 'Included'}
                    </div>
                  </div>
                </div>
              )
            })}

            <button style={S.btnOrange} onClick={() => setCurrentStage(4)}>
              Next: Aero Spoiler Option <ArrowRight size={16} />
            </button>
          </>
        );

      case 4:
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF6B00', letterSpacing: '0.05em' }}>STAGE 04</div>
              <div style={{ fontSize: '11px', color: '#FF6B00', background: '#FFF3E0', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>Dry Carbon</div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Aero Spoiler Option</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.5 }}>
              Select motorsport aerodynamic appendages tuned for track downforce and high-speed drag balance.
            </p>

            {(selectedModel.spoilers || []).map(spoiler => {
              const isActive = selectedSpoiler?.id === spoiler.id;
              return (
                <div key={spoiler.id} style={S.optionCard(isActive)} onClick={() => setSelectedSpoiler(spoiler)}>
                  <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '20px', height: '4px', background: '#64748B', borderRadius: '2px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{spoiler.name}</div>
                      {isActive && <div style={{ fontSize: '10px', background: '#FF6B00', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>SELECTED</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{spoiler.description}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                      {spoiler.price > 0 ? `+${S.formatCurrency(spoiler.price)}` : 'Included'}
                    </div>
                  </div>
                </div>
              )
            })}

            <button style={S.btnOrange} onClick={() => alert('Proceed to checkout with total: ' + S.formatCurrency(calculateTotal()))}>
              Complete Build & Checkout <ShoppingCart size={16} />
            </button>
          </>
        );

      default: return null;
    }
  };

  if (loading) return <div style={S.root}><div style={{ padding: '40px', textAlign: 'center' }}>Loading Configurator...</div></div>;

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.logoArea}>
          <div style={S.logoIcon}>DriveDrip</div>
          <div style={{ width: '1px', height: '24px', background: '#E2E8F0', margin: '0 8px' }} />
          <div style={S.navPill}><span style={{ color: '#FF6B00', marginRight: '6px' }}>●</span> 3D CONFIGURATOR</div>
        </div>

        {selectedModel && (
          <div style={S.headerCenter}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
              <span style={{ color: '#10B981', marginRight: '6px' }}>●</span>
              {selectedModel.brand} {selectedModel.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>TOTAL CALCULATED</span>
              <span style={S.totalPrice}>{S.formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        )}

        <div style={S.headerRight}>
          <button style={S.btnSecondary}>
            <Bookmark size={16} /> Save Spec
          </button>
          <button style={S.btnPrimary} onClick={() => navigate('/parts')}>
            <ArrowLeft size={16} /> Spare Parts Catalog
          </button>
        </div>
      </div>

      {/* TOP CONTROLS */}
      <div style={S.topControls}>
        <button style={S.controlBtn}><RotateCcw size={14} /> Rotate</button>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
        <button style={S.controlBtn}><ZoomIn size={14} /> Zoom</button>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
        <button style={S.controlBtn} onClick={() => viewerRef.current?.resetView()}><RefreshCw size={14} /> Reset View</button>
      </div>

      {/* BACKGROUND GRAPHICS */}
      <div style={S.ovalTrackContainer}>
        <OvalTrack />
      </div>

      {/* 3D CANVAS */}
      <div style={S.canvasContainer}>
        {selectedModel && (
          <ErrorBoundary>
            <ThreeDCarViewer
              ref={viewerRef}
              modelUrl={selectedModel.model_file_url || null}
              selectedColor={selectedColor}
              activeView="side"
            />
          </ErrorBoundary>
        )}
      </div>

      {/* STAGE 2: COLOR SWATCH BAR (Shown only on stage 2) */}
      {currentStage === 2 && selectedModel && selectedModel.default_colors && (
        <div style={S.colorSwatchContainer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '24px', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{selectedColorName}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.entries(selectedModel.default_colors).map(([name, hex]) => (
              <div
                key={name}
                style={S.colorSwatch(hex, selectedColor === hex)}
                onClick={() => {
                  setSelectedColor(hex);
                  setSelectedColorName(name);
                }}
                title={name}
              >
                {selectedColor === hex && (
                  <CheckCircle2 size={16} color="#FFF" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', dropShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
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

      {/* RIGHT PANEL */}
      <div style={S.rightCard}>
        {renderStageContent()}
      </div>

    </div>
  );
};

export default CarCustomizer3D;
