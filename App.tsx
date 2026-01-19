import React, { useState, useRef, useEffect } from 'react';
import CalligraphyCanvas, { CalligraphyCanvasHandle } from './components/CalligraphyCanvas';
import ControlPanel from './components/ControlPanel';
import UserGuide from './components/UserGuide';
import { BrushSettings, AppMode, ViewState, Preset } from './types';
import { Settings2, Undo2, Trash2, Dices, RotateCcw, BookOpen } from 'lucide-react';
import { generateCreativeSettings } from './services/geminiService';

const generateRandomSettings = (current: BrushSettings): BrushSettings => {
  return {
    ...current,
    size: Math.floor(Math.random() * 50) + 10,
    roughness: Math.random() * 0.8,
    taper: Math.random() * 0.9 + 0.1,
    roundness: Math.random() * 0.9 + 0.1,
    angle: Math.floor(Math.random() * 180),
    hardness: Math.random() * 0.9 + 0.1,
    spacing: Math.random() * 0.2,
  };
};

// Define Factory Defaults based on user request
const FACTORY_DEFAULTS: BrushSettings = {
  size: 10,
  roughness: 0.45,
  taper: 0.7,
  color: '#1a1a1a',
  roundness: 0.22,
  angle: 85,
  hardness: 0.8,
  spacing: 0,
  
  // Text Defaults
  letterSpacing: 0, 
  lineHeight: 1.2,
  slant: 0,         
  fontSize: 150,    
  fontStyle: 'PEN',
  weightOption: 'NORMAL'
};

const App: React.FC = () => {
  // --- State Management ---
  // Single Source of Truth for Brush Settings
  // Initialized with a deep copy of factory defaults
  const [settings, setSettings] = useState<BrushSettings>({ ...FACTORY_DEFAULTS });
  
  // Keeps track of settings when switching between modes (Draw <-> Generate)
  const lastDrawSettings = useRef<BrushSettings>({ ...FACTORY_DEFAULTS });

  const [mode, setMode] = useState<AppMode>(AppMode.DRAW);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offset: { x: 0, y: 0 }
  });
  
  const [textToRender, setTextToRender] = useState<string>('');
  const [triggerClear, setTriggerClear] = useState(false);
  
  const [showGuides, setShowGuides] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [presets, setPresets] = useState<Preset[]>([]);

  const canvasRef = useRef<CalligraphyCanvasHandle>(null);

  // --- Persistence Effects ---
  
  // 1. Load Presets and Last State from LocalStorage on Mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('seoye_presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }

    const savedCurrent = localStorage.getItem('seoye_current_settings');
    if (savedCurrent) {
        try {
            const parsed = JSON.parse(savedCurrent);
            // Replace current state with loaded state
            setSettings(parsed);
            lastDrawSettings.current = parsed;
        } catch(e) {}
    }
  }, []);

  // 2. Sync Current Settings to LocalStorage & Ref
  useEffect(() => {
    try {
        localStorage.setItem('seoye_current_settings', JSON.stringify(settings));
    } catch (e) {
        console.warn("Failed to save settings to localStorage", e);
    }
    
    // If in DRAW mode, update the ref so we can restore it later if we switch modes
    if (mode === AppMode.DRAW) {
        lastDrawSettings.current = settings;
    }
  }, [settings, mode]);

  // --- Core Actions ---

  // LOAD: Replaces current state with the Preset's state
  const handleLoadPreset = (preset: Preset) => {
    // Create a copy of the preset settings to avoid reference coupling
    const loadedSettings = { ...preset.settings };
    setSettings(loadedSettings);
    
    // Update the ref immediately to ensure persistence
    if (mode === AppMode.DRAW) {
        lastDrawSettings.current = loadedSettings;
    }
  };

  const handleDeletePreset = (id: string) => {
    // Removed window.confirm to rely on UI-based confirmation in ControlPanel
    setPresets(prev => {
      const updatedPresets = prev.filter(p => p.id !== id);
      try {
          localStorage.setItem('seoye_presets', JSON.stringify(updatedPresets));
      } catch(e) {
          console.warn("Failed to update presets in localStorage", e);
      }
      return updatedPresets;
    });
  };

  const handleSavePreset = (name: string) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      settings: { ...settings }
    };
    
    setPresets(prev => {
      const updated = [newPreset, ...prev];
      try {
          localStorage.setItem('seoye_presets', JSON.stringify(updated));
      } catch(e) {
          console.warn("Failed to save presets", e);
      }
      return updated;
    });
  };

  const handleRandomize = () => {
    const newSettings = generateRandomSettings(settings);
    setSettings(newSettings);
  };

  const handleReset = () => {
    setSettings({ ...FACTORY_DEFAULTS });
  };
  
  const handleManualText = (text: string) => {
    if (!text && text !== '') return; 
    setTextToRender(text);
  };
  
  const handleMagicSettings = () => {
      if (mode !== AppMode.GENERATE) return;
      const newParams = generateCreativeSettings(settings.fontStyle);
      setSettings(prev => ({
          ...prev,
          ...newParams
      }));
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === AppMode.GENERATE) {
         setTriggerClear(true);
         setTextToRender(''); 
         
         // In Generate mode, we use specific defaults for text rendering
         setSettings(prev => ({
           ...prev,
           fontSize: 150,
           fontStyle: 'PEN',
           weightOption: 'NORMAL',
           letterSpacing: 0,
           lineHeight: 1.2,
           slant: 0,
           color: '#1a1a1a'
         }));
    } else if (newMode === AppMode.DRAW) {
         // Restore the user's last drawing settings
         setSettings({ ...lastDrawSettings.current });
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-stone-50">
      
      {/* Mobile Header & Floating Controls */}
      <div className="fixed top-0 left-0 w-full p-6 z-50 pointer-events-none md:hidden flex justify-between items-start">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tighter">
            서예 <span className="text-red-700 text-lg font-serif align-top opacity-80">Seoye</span>
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-medium tracking-wide">
            생성형 한글 서예
          </p>
        </div>

        {/* Floating Action Buttons */}
        <div className="pointer-events-auto flex gap-3">
           {/* Mobile Only: Guide Button */}
           <button 
             onClick={() => setIsGuideOpen(true)}
             className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full flex items-center justify-center shadow-lg text-stone-700 active:scale-95 transition-transform"
             aria-label="User Guide"
           >
             <BookOpen className="w-5 h-5" />
           </button>

           {/* Mobile Only: Random Button */}
           <button 
             onClick={handleRandomize}
             className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
             aria-label="Randomize Brush"
           >
             <Dices className="w-5 h-5" />
           </button>

           {/* Mobile Only: Reset Button */}
           <button 
             onClick={handleReset}
             className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full flex items-center justify-center shadow-lg text-stone-700 active:scale-95 transition-transform"
             aria-label="Reset Brush"
           >
             <RotateCcw className="w-5 h-5" />
           </button>
           
           <button 
             onClick={() => setTriggerClear(true)}
             className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full flex items-center justify-center shadow-lg text-red-600 active:scale-95 transition-transform"
             aria-label="Clear Canvas"
           >
             <Trash2 className="w-5 h-5" />
           </button>
           <button 
             onClick={() => canvasRef.current?.undo()}
             className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full flex items-center justify-center shadow-lg text-stone-700 active:scale-95 transition-transform"
             aria-label="Undo"
           >
             <Undo2 className="w-5 h-5" />
           </button>
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
             aria-label="Open Settings"
           >
             <Settings2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      {/* Reduced left margin from 80 (320px) to 72 (288px) to give more width to canvas on PC */}
      <main className="absolute inset-0 z-0 md:left-72">
        <CalligraphyCanvas
          ref={canvasRef}
          settings={settings}
          mode={mode}
          viewState={viewState}
          onViewStateChange={setViewState}
          textToRender={textToRender}
          triggerClear={triggerClear}
          onClearComplete={() => setTriggerClear(false)}
          showGuides={showGuides}
        />
      </main>

      {/* User Guide Modal */}
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Controls */}
      <ControlPanel
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        viewState={viewState}
        onViewStateChange={setViewState}
        onClear={() => setTriggerClear(true)}
        onDownloadPng={() => canvasRef.current?.downloadPng()}
        onDownloadSvg={() => canvasRef.current?.downloadSvg()}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        mode={mode}
        onModeChange={handleModeChange}
        onManualTextSubmit={handleManualText}
        
        presets={presets}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
        onReset={handleReset}
        
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(!showGuides)}
        onOpenGuide={() => setIsGuideOpen(true)}
        
        onMagic={handleMagicSettings}
      />
    </div>
  );
};

export default App;