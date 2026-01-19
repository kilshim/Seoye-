import React, { useState } from 'react';
import { BrushSettings, AppMode, ViewState, FontStyle, WeightOption, Preset } from '../types';
import { Sliders, RefreshCw, Trash2, Image, FileCode, Brush, Type, Send, RotateCw, Circle, Droplets, MoreHorizontal, Triangle, AlignCenterHorizontal, Italic, Type as TypeIcon, AlignVerticalJustifyCenter, Undo2, Redo2, Dices, Save, X, Ruler, RotateCcw, Bookmark, Check, Bold, Sparkles, BookOpen, Eraser } from 'lucide-react';

interface ControlPanelProps {
  settings: BrushSettings;
  onSettingsChange: (newSettings: BrushSettings) => void;
  viewState: ViewState;
  onViewStateChange: (newView: ViewState) => void;
  onClear: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onUndo: () => void;
  onRedo: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onManualTextSubmit: (text: string) => void;
  
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onSavePreset: (name: string) => void;
  onRandomize: () => void;
  onReset: () => void;
  
  showGuides: boolean;
  onToggleGuides: () => void;
  onOpenGuide: () => void;
  
  onMagic?: () => void;
  
  isOpen?: boolean;
  onClose?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  viewState,
  onViewStateChange,
  onClear,
  onDownloadPng,
  onDownloadSvg,
  onUndo,
  onRedo,
  mode,
  onModeChange,
  onManualTextSubmit,
  presets,
  onLoadPreset,
  onDeletePreset,
  onSavePreset,
  onRandomize,
  onReset,
  showGuides,
  onToggleGuides,
  onOpenGuide,
  onMagic,
  isOpen = true,
  onClose
}) => {
  const [manualInput, setManualInput] = useState('');
  // State for inline save UI
  const [isSaving, setIsSaving] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleChange = (key: keyof BrushSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  const handleStyleChange = (style: FontStyle) => {
    onSettingsChange({ ...settings, fontStyle: style });
  };

  const handleWeightChange = (weight: WeightOption) => {
    onSettingsChange({ ...settings, weightOption: weight });
  };
  
  const handleEraserToggle = () => {
    onSettingsChange({ ...settings, isEraser: !settings.isEraser });
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (manualInput.trim()) {
      onManualTextSubmit(manualInput);
    }
  };

  const handleSaveSubmit = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName('');
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop - Closes panel when clicked */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`
          fixed z-50 transition-transform duration-300 ease-in-out
          bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto md:overflow-hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}
          md:translate-y-0 md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-72 md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-r md:shadow-xl md:flex md:flex-col
        `}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Handle */}
        <div className="md:hidden flex flex-col items-center justify-center -mt-2 mb-4 cursor-pointer" onClick={onClose}>
             <div className="w-10 h-1 bg-stone-300 rounded-full mb-1"></div>
        </div>

        {/* Desktop Header (Hidden on Mobile) */}
        <div className="hidden md:flex items-start justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tighter">
              서예 <span className="text-red-700 text-xl font-serif align-top opacity-80">Seoye</span>
            </h1>
            <p className="text-stone-500 text-xs mt-2 font-medium tracking-wide">
              생성형 한글 서예
            </p>
          </div>
          <button 
             onClick={onOpenGuide}
             className="p-2 rounded-full bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
             title="사용 가이드"
          >
             <BookOpen className="w-5 h-5" />
          </button>
        </div>

        {/* Main Mode & Undo/Redo Controls */}
        <div className="flex gap-2 mb-4 shrink-0">
           <button onClick={onUndo} className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 text-stone-700" title="실행 취소">
             <Undo2 className="w-4 h-4" />
           </button>
           <button onClick={onRedo} className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 text-stone-700" title="다시 실행">
             <Redo2 className="w-4 h-4" />
           </button>
           <div className="flex-1 flex bg-stone-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => onModeChange(AppMode.DRAW)}
              className={`flex-1 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                mode === AppMode.DRAW ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Brush className="w-4 h-4" />
            </button>
            <button
              onClick={() => onModeChange(AppMode.GENERATE)}
              className={`flex-1 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                mode === AppMode.GENERATE ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Type className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="md:flex-1 md:overflow-y-auto md:min-h-0 md:pr-1 space-y-6">
          
          {/* Presets & Random (Draw Mode Only) */}
          {mode === AppMode.DRAW && (
            <div className="space-y-4 pb-2 border-b border-stone-100">
               {/* Utility Buttons Row */}
               <div className="flex items-center justify-end gap-1">
                  <button 
                    onClick={handleEraserToggle} 
                    className={`text-[10px] flex items-center px-2 py-1 rounded-md transition-colors border ${
                      settings.isEraser
                        ? 'bg-stone-800 text-white border-stone-800' 
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                     <Eraser className="w-3 h-3 mr-1" /> 지우개
                  </button>
                  <button onClick={onRandomize} className="text-[10px] flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors">
                     <Dices className="w-3 h-3 mr-1" /> 랜덤
                  </button>
                  <button onClick={onReset} className="text-[10px] flex items-center px-2 py-1 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200 transition-colors">
                     <RotateCcw className="w-3 h-3 mr-1" /> 초기화
                  </button>
                  <button 
                     onClick={onToggleGuides} 
                     className={`text-[10px] flex items-center px-2 py-1 rounded-md transition-colors ${
                       showGuides 
                         ? 'bg-blue-50 text-blue-600' 
                         : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                     }`}
                   >
                      <Ruler className="w-3 h-3 mr-1" /> 가이드
                   </button>
               </div>

               {/* Presets Section - Moved Below */}
               <div className="bg-stone-50/50 rounded-lg p-3 border border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center">
                        <Bookmark className="w-3 h-3 mr-1" /> 나의 브러시
                     </label>
                     {!isSaving && (
                      <button 
                          onClick={() => {
                            setIsSaving(true);
                            setPresetName('');
                          }} 
                          className="text-[10px] flex items-center px-3 py-1.5 bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors shadow-sm"
                      >
                          <Save className="w-3 h-3 mr-1" /> 저장
                      </button>
                     )}
                  </div>

                  {/* Inline Save Input */}
                  {isSaving && (
                    <div className="mb-3 p-2 bg-white rounded border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                        <input 
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="브러시 이름 입력"
                            className="w-full text-xs p-1.5 mb-2 border-b border-stone-200 focus:border-stone-800 outline-none rounded-none bg-transparent text-stone-900"
                            autoFocus
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSaveSubmit();
                                if(e.key === 'Escape') setIsSaving(false);
                            }}
                        />
                        <div className="flex justify-end gap-1">
                            <button 
                                onClick={() => setIsSaving(false)}
                                className="px-2 py-1 text-[10px] bg-stone-100 text-stone-600 rounded hover:bg-stone-200"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleSaveSubmit}
                                disabled={!presetName.trim()}
                                className="px-2 py-1 text-[10px] flex items-center bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50"
                            >
                                <Check className="w-3 h-3 mr-1" /> 확인
                            </button>
                        </div>
                    </div>
                  )}
                  
                  {presets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {presets.map(p => (
                        <div 
                           key={p.id} 
                           onClick={() => onLoadPreset(p)}
                           className="group relative flex items-center justify-between bg-white border border-stone-200 rounded-md px-3 py-2 cursor-pointer hover:border-stone-800 hover:shadow-md transition-all active:scale-[0.98]"
                           title="클릭하여 불러오기"
                        >
                          <div className="flex flex-col overflow-hidden mr-2">
                             <span className="text-xs font-bold text-stone-700 truncate">{p.name}</span>
                             <span className="text-[9px] text-stone-400">
                                사이즈: {p.settings.size}px / 갈필: {(p.settings.roughness * 100).toFixed(0)}%
                             </span>
                          </div>
                          <button 
                             onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id); }} 
                             className="flex-shrink-0 p-1.5 rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"
                             title="삭제"
                          >
                             <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                     <div className="text-center py-6 bg-white rounded-lg border border-dashed border-stone-200">
                        <p className="text-[10px] text-stone-400 mb-1">저장된 브러시 설정이 없습니다.</p>
                        <p className="text-[9px] text-stone-300">원하는 설정 후 [저장] 버튼을 누르세요.</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* Generate Mode Controls */}
          {mode === AppMode.GENERATE && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Manual Input Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
                  직접 입력
                </label>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleManualSubmit();
                      }
                    }}
                    placeholder="글자를 입력하세요..."
                    className="flex-1 bg-transparent border-b border-stone-300 focus:border-stone-800 outline-none px-2 py-1 font-serif text-stone-800 placeholder-stone-400 transition-colors resize-none h-8 focus:h-20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="h-8 w-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md transition-colors disabled:opacity-50 self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Removed AI Generator Section and Divider */}

              {/* New Typography Settings */}
              <div className="space-y-4">
                 {/* Style Selector */}
                 <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700">서체 스타일</label>
                        {onMagic && (
                          <button 
                            onClick={onMagic}
                            className="text-[10px] flex items-center px-2 py-1 bg-gradient-to-r from-stone-600 to-stone-800 text-white rounded-md shadow-sm hover:opacity-90 transition-opacity active:scale-95"
                          >
                            <Dices className="w-3 h-3 mr-1" />
                            랜덤 스타일
                          </button>
                        )}
                    </div>
                    <div className="flex bg-stone-100 rounded-lg p-1">
                      {(['HAND', 'PEN', 'BRUSH'] as FontStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => handleStyleChange(style)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                            settings.fontStyle === style ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          {style === 'HAND' ? '손글씨' : style === 'PEN' ? '펜글씨' : '붓글씨'}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Weight Selector */}
                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">글자 굵기</label>
                    <div className="flex bg-stone-100 rounded-lg p-1">
                      {(['THIN', 'NORMAL', 'BOLD'] as WeightOption[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => handleWeightChange(w)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                            settings.weightOption === w ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          {w === 'THIN' ? '얇게' : w === 'NORMAL' ? '보통' : '굵게'}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* ... (Existing Typography sliders) ... */}
                 <div className="flex items-center justify-between text-stone-700">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <TypeIcon className="w-3 h-3 mr-1" /> 크기
                  </span>
                  <span className="text-xs font-mono">{settings.fontSize}</span>
                </div>
                <input type="range" min="30" max="300" step="5" value={settings.fontSize} onChange={(e) => handleChange('fontSize', Number(e.target.value))} className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800" />
                
                {/* Line Height */}
                <div className="flex items-center justify-between text-stone-700 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <AlignVerticalJustifyCenter className="w-3 h-3 mr-1" /> 행간
                  </span>
                  <span className="text-xs font-mono">{settings.lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0.8" max="2.5" step="0.1" value={settings.lineHeight}
                  onChange={(e) => handleChange('lineHeight', Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                />

                {/* Spacing */}
                 <div className="flex items-center justify-between text-stone-700 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <AlignCenterHorizontal className="w-3 h-3 mr-1" /> 자간
                  </span>
                  <span className="text-xs font-mono">{settings.letterSpacing}px</span>
                </div>
                <input
                  type="range" min="-10" max="50" step="1" value={settings.letterSpacing}
                  onChange={(e) => handleChange('letterSpacing', Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                />

                {/* Slant */}
                <div className="flex items-center justify-between text-stone-700 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <Italic className="w-3 h-3 mr-1" /> 기울기
                  </span>
                  <span className="text-xs font-mono">{(settings.slant || 0).toFixed(2)}</span>
                </div>
                <input
                  type="range" min="-0.5" max="0.5" step="0.05" value={settings.slant || 0}
                  onChange={(e) => handleChange('slant', Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                />
              </div>
            </div>
          )}

          {/* Full Brush Settings */}
          {mode === AppMode.DRAW && (
          <div className="space-y-4 mb-6 animate-in fade-in">
            <div className="flex items-center justify-between text-stone-700">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                <Sliders className="w-3 h-3 mr-1" /> 크기
              </span>
              <span className="text-xs font-mono">{settings.size}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={settings.size}
              onChange={(e) => handleChange('size', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            {/* Taper Setting */}
            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                <Triangle className="w-3 h-3 mr-1 rotate-180" /> 붓끝 모양
              </span>
              <span className="text-xs font-mono">{(settings.taper * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.taper}
              onChange={(e) => handleChange('taper', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider">갈필 (거칠기)</span>
              <span className="text-xs font-mono">{(settings.roughness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.roughness}
              onChange={(e) => handleChange('roughness', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                 <Circle className="w-3 h-3 mr-1" /> 붓 모양 (원형)
              </span>
              <span className="text-xs font-mono">{(settings.roundness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.roundness}
              onChange={(e) => handleChange('roundness', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                <RotateCw className="w-3 h-3 mr-1" /> 붓 각도
              </span>
              <span className="text-xs font-mono">{settings.angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={settings.angle}
              onChange={(e) => handleChange('angle', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            {/* Hardness & Spacing */}
            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                 <Droplets className="w-3 h-3 mr-1" /> 선명도
              </span>
              <span className="text-xs font-mono">{(settings.hardness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.hardness}
              onChange={(e) => handleChange('hardness', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />

            <div className="flex items-center justify-between text-stone-700 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center">
                <MoreHorizontal className="w-3 h-3 mr-1" /> 점 간격
              </span>
              <span className="text-xs font-mono">{(settings.spacing * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.spacing}
              onChange={(e) => handleChange('spacing', Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />
          </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-stone-200 shrink-0">
          <div className="flex gap-2 mb-4">
            <button
              onClick={onClear}
              className="flex-none w-[20%] flex items-center justify-center py-2 border border-stone-200 hover:bg-red-50 text-stone-600 hover:text-red-600 rounded-lg transition-colors text-sm"
              title="캔버스 지우기"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDownloadPng}
              className="flex-1 flex items-center justify-center py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors text-sm font-medium"
            >
              <Image className="w-4 h-4 mr-2" />
              PNG
            </button>
             <button
              onClick={onDownloadSvg}
              className="flex-1 flex items-center justify-center py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors text-sm font-medium"
            >
              <FileCode className="w-4 h-4 mr-2" />
              SVG
            </button>
          </div>

          {/* Credit Link */}
          <div className="text-center">
            <a 
              href="https://xn--design-hl6wo12cquiba7767a.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-stone-400 hover:text-stone-800 transition-colors font-sans hover:underline"
            >
              떨림과울림Design.com
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;