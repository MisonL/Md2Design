import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useTranslation } from '../i18n';
import type { CardStyle } from '../store';
import { Palette, Type, Layout, Monitor, ChevronRight, ChevronLeft, Smartphone, Monitor as MonitorIcon, Plus, Image as ImageIcon, RotateCcw, Stamp, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';

const SliderControl = ({ label, value, min, max, step = 1, onChange }: { label: string, value: number, min: number, max: number, step?: number, onChange: (val: number) => void }) => {
  const cleanLabel = label.replace(/\s*\(px\)/i, '').replace(/\s*\(°\)/i, '');
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium opacity-70 block">{cleanLabel}</label>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold opacity-90 min-w-[2ch] text-right font-mono">{value}</span>
          {label.includes('(px)') && <span className="text-[10px] opacity-40 font-mono">px</span>}
          {label.includes('(°)') && <span className="text-[10px] opacity-40 font-mono">°</span>}
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-black/80 dark:accent-white/80 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

const ColorPicker = ({ color, onChange, label }: { color: string, onChange: (color: string) => void, label?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 240; // Approx width of our popover
      const popoverHeight = 240; // Approx height
      
      let top = rect.bottom + 8;
      let left = rect.right - popoverWidth;

      // Check if it goes off screen bottom
      if (top + popoverHeight > window.innerHeight) {
        top = rect.top - popoverHeight - 8;
      }

      // Check if it goes off screen left
      if (left < 10) {
        left = 10;
      }

      setCoords({ top, left });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        // If the scroll happened in a parent of the button, update position
        updatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        {label && <span className="text-xs opacity-70">{label}</span>}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={color.toUpperCase()} 
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-black/30 dark:focus:border-white/30 text-center"
            />
          </div>
          <button 
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="w-7 h-7 rounded-full border border-black/20 dark:border-white/20 shadow-sm relative overflow-hidden transition-transform active:scale-95 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={popoverRef} 
          className="fixed z-[9999] p-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-black/10 dark:border-white/10"
          style={{ 
            top: coords.top, 
            left: coords.left,
            width: 'fit-content'
          }}
        >
          <HexColorPicker color={color} onChange={onChange} />
        </div>,
        document.body
      )}
    </div>
  );
};

const RatioIcon = ({ ratio, orientation }: { ratio: string, orientation: 'portrait' | 'landscape' }) => {
  if (ratio === 'custom') return <Layout size={14} className="opacity-70" />;
  let [w, h] = ratio.split(':').map(Number);
  
  // Swap if portrait to match visual expectation
  if (orientation === 'portrait') {
    [w, h] = [h, w];
  }

  // Fit within 14x14 box
  const maxDim = 14;
  let width, height;
  
  if (w >= h) {
      width = maxDim;
      height = width * (h / w);
  } else {
      height = maxDim;
      width = height * (w / h);
  }

  // Force visual difference for 4:3 vs 3:2 in portrait if they are too similar
  return (
    <div 
      className="border border-current opacity-70 mb-1"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

const ColorSectionWrapper = ({ children, label }: { children: React.ReactNode, label?: string }) => (
  <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 space-y-3">
     {label && <label className="text-xs font-medium opacity-70 block mb-2">{label}</label>}
     {children}
  </div>
);

export const Sidebar = () => {
  const { cardStyle, updateCardStyle, addCustomFont, resetCardStyle, undoReset, setIsResetting } = useStore();
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [showResetToast, setShowResetToast] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(10);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleReset = () => {
    setIsResetting(true);
    resetCardStyle();
    setShowResetToast(true);
    setResetCountdown(10);
    
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    
    countdownTimer.current = setInterval(() => {
      setResetCountdown(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownTimer.current!);
          setShowResetToast(false);
          setIsResetting(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  };

  const handleUndo = () => {
    undoReset();
    setShowResetToast(false);
    setIsResetting(false);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  };

  const closeToast = () => {
    setShowResetToast(false);
    setIsResetting(false);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  };

  // Get color based on countdown
  const getCountdownColor = () => {
    if (resetCountdown > 5) return '#22c55e'; // Green
    if (resetCountdown > 2) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const handleColorChange = (key: keyof CardStyle, value: string) => {
    updateCardStyle({ [key]: value });
  };

  const ASPECT_RATIOS = [
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '3:2', value: '3:2' },
    { label: '16:9', value: '16:9' },
    { label: 'Custom', value: 'custom' },
  ] as const;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'background' | 'cardBackground') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          if (target === 'background') {
            updateCardStyle({ backgroundImage: url });
          } else {
            updateCardStyle({ cardBackgroundImage: url });
          }
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-6 top-20 bottom-6 w-[350px] glass-panel rounded-2xl flex flex-col z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
               <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
                <Palette size={16} />
                <span>{t.styleSettings}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg hover:opacity-90"
                  title={t.resetStyle}
                >
                  <span className="text-xs font-bold tracking-wider">{t.resetStyle}</span>
                  <RotateCcw size={12} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* Layout */}
              <div className="mb-8 space-y-4">
                <h2 className="text-sm font-semibold mb-4 opacity-80 flex items-center gap-2">
                   <Layout size={16} /> {t.layout}
                </h2>
                
                {/* Orientation */}
                <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 mb-4">
                  {(['portrait', 'landscape'] as const).map((o) => (
                    <button
                      key={o}
                      onClick={() => updateCardStyle({ orientation: o })}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                        cardStyle.orientation === o
                          ? 'bg-white text-black shadow-sm'
                          : 'text-inherit hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {o === 'portrait' ? <Smartphone size={14} /> : <MonitorIcon size={14} />}
                      <span className="capitalize">{t[o]}</span>
                    </button>
                  ))}
                </div>

                {/* Aspect Ratio */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {ASPECT_RATIOS.map((ratio) => {
                     const isPortrait = cardStyle.orientation === 'portrait';
                     const displayLabel = isPortrait && ratio.value !== 'custom'
                        ? ratio.value.split(':').reverse().join(':')
                        : ratio.label;

                     return (
                     <button
                       key={ratio.value}
                       onClick={() => updateCardStyle({ aspectRatio: ratio.value })}
                       className={`p-2 rounded-lg border text-xs flex flex-col items-center justify-center gap-1 transition-all h-14 ${
                         cardStyle.aspectRatio === ratio.value
                           ? 'bg-black/10 dark:bg-white/20 border-black/20 dark:border-white/40 shadow-sm text-slate-900 dark:text-white' 
                           : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/60'
                       }`}
                     >
                       <RatioIcon ratio={ratio.value} orientation={cardStyle.orientation} />
                       {displayLabel}
                     </button>
                  )})}
                </div>

                {/* Custom Dimensions */}
                {cardStyle.aspectRatio === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider opacity-60 mb-1 block">{t.width}</label>
                      <input 
                        type="number" 
                        value={cardStyle.width}
                        onChange={(e) => updateCardStyle({ width: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 text-xs focus:border-black/30 dark:focus:border-white/30 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider opacity-60 mb-1 block">{t.height}</label>
                      <input 
                        type="number" 
                        value={cardStyle.height}
                        onChange={(e) => updateCardStyle({ height: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 text-xs focus:border-black/30 dark:focus:border-white/30 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Border Radius */}
                <SliderControl 
                  label={`${t.cornerRadius} (px)`} 
                  value={cardStyle.borderRadius} 
                  min={0} max={48} 
                  onChange={(val) => updateCardStyle({ borderRadius: val })} 
                />
                
                {/* Border */}
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker 
                    label={t.border}
                    color={cardStyle.borderColor} 
                    onChange={(val) => updateCardStyle({ borderColor: val })} 
                  />
                  <SliderControl 
                    label="Width (px)"
                    value={cardStyle.borderWidth} 
                    min={0} max={20} 
                    onChange={(val) => updateCardStyle({ borderWidth: val })} 
                  />
                </div>

                {/* Shadow */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium opacity-70">{t.shadow}</label>
                    <button 
                      onClick={() => updateCardStyle({ shadowEnabled: !cardStyle.shadowEnabled })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${cardStyle.shadowEnabled ? 'bg-slate-900 dark:bg-white/90' : 'bg-black/10 dark:bg-white/10'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white dark:bg-black/80 absolute top-1 transition-all ${cardStyle.shadowEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {cardStyle.shadowEnabled && (
                    <div className="space-y-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                      <div className="grid grid-cols-2 gap-3">
                        <SliderControl label={t.xOffset} value={cardStyle.shadowConfig?.x ?? 0} min={-50} max={50} onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, x: val } })} />
                        <SliderControl label={t.yOffset} value={cardStyle.shadowConfig?.y ?? 0} min={-50} max={50} onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, y: val } })} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <SliderControl label={t.blur} value={cardStyle.shadowConfig?.blur ?? 0} min={0} max={100} onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, blur: val } })} />
                         <SliderControl label={t.spread} value={cardStyle.shadowConfig?.spread ?? 0} min={-50} max={50} onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, spread: val } })} />
                      </div>

                      <ColorPicker 
                        label={t.colors}
                        color={cardStyle.shadowConfig?.color || '#000000'}
                        onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, color: val } })}
                      />
                      
                      <SliderControl label={t.opacity} value={cardStyle.shadowConfig?.opacity ?? 0} min={0} max={1} step={0.01} onChange={(val) => updateCardStyle({ shadowConfig: { ...cardStyle.shadowConfig, opacity: val } })} />
                    </div>
                  )}
                </div>
              </div>

              {/* Background Fill */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold opacity-80 flex items-center gap-2">
                     <ImageIcon size={16} /> {t.backgroundFill}
                  </h2>
                  <button 
                    onClick={() => updateCardStyle({ enableBackground: !cardStyle.enableBackground })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${cardStyle.enableBackground ? 'bg-slate-900 dark:bg-white/90' : 'bg-black/10 dark:bg-white/10'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white dark:bg-black/80 absolute top-1 transition-all ${cardStyle.enableBackground ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {cardStyle.enableBackground && (
                  <div className="space-y-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                    <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded mb-2">
                      {['solid', 'gradient', 'image'].map((type) => (
                        <button 
                          key={type}
                          onClick={() => updateCardStyle({ backgroundType: type as any })}
                          className={`flex-1 py-1 text-[10px] rounded transition-all capitalize ${cardStyle.backgroundType === type ? 'bg-black/10 dark:bg-white/20 text-slate-900 dark:text-white' : 'text-black/50 dark:text-white/50'}`}
                        >
                          {t[type as keyof typeof t]}
                        </button>
                      ))}
                    </div>

                    {cardStyle.backgroundType === 'solid' && (
                      <ColorPicker 
                        label={t.background}
                        color={cardStyle.backgroundValue.startsWith('#') ? cardStyle.backgroundValue : '#ffffff'}
                        onChange={(val) => updateCardStyle({ backgroundValue: val })}
                      />
                    )}

                    {cardStyle.backgroundType === 'gradient' && (
                      <div className="space-y-3">
                        <ColorPicker 
                          label={t.startColor}
                          color={cardStyle.gradientStart || '#667eea'}
                          onChange={(val) => {
                            const start = val;
                            const end = cardStyle.gradientEnd || '#764ba2';
                            const angle = cardStyle.gradientAngle || 135;
                            updateCardStyle({ 
                              gradientStart: start,
                              backgroundValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                            });
                          }}
                        />

                        <ColorPicker 
                          label={t.endColor}
                          color={cardStyle.gradientEnd || '#764ba2'}
                          onChange={(val) => {
                            const start = cardStyle.gradientStart || '#667eea';
                            const end = val;
                            const angle = cardStyle.gradientAngle || 135;
                            updateCardStyle({ 
                              gradientEnd: end,
                              backgroundValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                            });
                          }}
                        />

                        <SliderControl label={`${t.angle} (°)`} value={cardStyle.gradientAngle || 135} min={0} max={360} onChange={(val) => {
                           const angle = val;
                           const start = cardStyle.gradientStart || '#667eea';
                           const end = cardStyle.gradientEnd || '#764ba2';
                           updateCardStyle({ 
                             gradientAngle: angle,
                             backgroundValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                           });
                         }} />
                      </div>
                    )}

                    {cardStyle.backgroundType === 'image' && (
                       <div className="space-y-3">
                         <div className="relative">
                           <input 
                             type="file" 
                             accept="image/*"
                             onChange={(e) => handleImageUpload(e, 'background')}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                           />
                           <button className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
                             <Upload size={14} /> {t.uploadImage}
                           </button>
                         </div>
                         
                         {cardStyle.backgroundImage && (
                           <div className="space-y-3 pt-2">
                             <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 relative">
                               <img src={cardStyle.backgroundImage} className="w-full h-full object-cover" />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                               <SliderControl label="X Offset" value={cardStyle.backgroundConfig?.x || 0} min={-100} max={100} onChange={(val) => updateCardStyle({ backgroundConfig: { ...cardStyle.backgroundConfig, x: val } })} />
                               <SliderControl label="Y Offset" value={cardStyle.backgroundConfig?.y || 0} min={-100} max={100} onChange={(val) => updateCardStyle({ backgroundConfig: { ...cardStyle.backgroundConfig, y: val } })} />
                             </div>
                             <SliderControl label={t.scale} value={cardStyle.backgroundConfig?.scale || 1} min={0.1} max={3} step={0.1} onChange={(val) => updateCardStyle({ backgroundConfig: { ...cardStyle.backgroundConfig, scale: val } })} />
                             <SliderControl label={t.blur} value={cardStyle.backgroundConfig?.blur || 0} min={0} max={20} onChange={(val) => updateCardStyle({ backgroundConfig: { ...cardStyle.backgroundConfig, blur: val } })} />
                           </div>
                         )}
                       </div>
                    )}

                    <SliderControl label={t.padding} value={cardStyle.padding} min={0} max={100} onChange={(val) => updateCardStyle({ padding: val })} />
                  </div>
                )}
              </div>

              {/* Card Colors */}
              <div className="mb-8 space-y-4">
                <h2 className="text-sm font-semibold mb-4 opacity-80 flex items-center gap-2">
                   <Palette size={16} /> {t.cardBackground}
                </h2>
                
                {/* Card Background (Enhanced) */}
                <ColorSectionWrapper label={t.cardBackground}>
                   <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded mb-2">
                      {['solid', 'gradient', 'image'].map((type) => (
                        <button 
                          key={type}
                          onClick={() => updateCardStyle({ cardBackgroundType: type as any })}
                          className={`flex-1 py-1 text-[10px] rounded transition-all capitalize ${cardStyle.cardBackgroundType === type ? 'bg-black/10 dark:bg-white/20 text-slate-900 dark:text-white' : 'text-black/50 dark:text-white/50'}`}
                        >
                          {t[type as keyof typeof t]}
                        </button>
                      ))}
                    </div>

                    {cardStyle.cardBackgroundType === 'solid' && (
                       <ColorPicker 
                         label={t.solid}
                         color={cardStyle.backgroundColor}
                         onChange={(val) => updateCardStyle({ backgroundColor: val })}
                       />
                    )}

                    {cardStyle.cardBackgroundType === 'gradient' && (
                      <div className="space-y-3">
                        <ColorPicker 
                          label={t.startColor}
                          color={cardStyle.cardGradientStart || '#ffffff'}
                          onChange={(val) => {
                            const start = val;
                            const end = cardStyle.cardGradientEnd || '#f0f0f0';
                            const angle = cardStyle.cardGradientAngle || 135;
                            updateCardStyle({ 
                              cardGradientStart: start,
                              cardGradientValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                            });
                          }}
                        />
                        <ColorPicker 
                          label={t.endColor}
                          color={cardStyle.cardGradientEnd || '#f0f0f0'}
                          onChange={(val) => {
                            const start = cardStyle.cardGradientStart || '#ffffff';
                            const end = val;
                            const angle = cardStyle.cardGradientAngle || 135;
                            updateCardStyle({ 
                              cardGradientEnd: end,
                              cardGradientValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                            });
                          }}
                        />
                        <SliderControl label={`${t.angle} (°)`} value={cardStyle.cardGradientAngle || 135} min={0} max={360} onChange={(val) => {
                           const angle = val;
                           const start = cardStyle.cardGradientStart || '#ffffff';
                           const end = cardStyle.cardGradientEnd || '#f0f0f0';
                           updateCardStyle({ 
                             cardGradientAngle: angle,
                             cardGradientValue: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)` 
                           });
                         }} />
                      </div>
                    )}

                    {cardStyle.cardBackgroundType === 'image' && (
                       <div className="space-y-3">
                         <div className="relative">
                           <input 
                             type="file" 
                             accept="image/*"
                             onChange={(e) => handleImageUpload(e, 'cardBackground')}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                           />
                           <button className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
                             <Upload size={14} /> {t.uploadImage}
                           </button>
                         </div>
                         
                         {cardStyle.cardBackgroundImage && (
                           <div className="space-y-3 pt-2">
                             <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 relative">
                               <img src={cardStyle.cardBackgroundImage} className="w-full h-full object-cover" />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                               <SliderControl label="X Offset" value={cardStyle.cardBackgroundConfig?.x || 0} min={-100} max={100} step={0.1} onChange={(val) => updateCardStyle({ cardBackgroundConfig: { ...cardStyle.cardBackgroundConfig, x: val } })} />
                               <SliderControl label="Y Offset" value={cardStyle.cardBackgroundConfig?.y || 0} min={-100} max={100} step={0.1} onChange={(val) => updateCardStyle({ cardBackgroundConfig: { ...cardStyle.cardBackgroundConfig, y: val } })} />
                             </div>
                             <SliderControl label={t.scale} value={cardStyle.cardBackgroundConfig?.scale || 1} min={0.1} max={3} step={0.01} onChange={(val) => updateCardStyle({ cardBackgroundConfig: { ...cardStyle.cardBackgroundConfig, scale: val } })} />
                             <SliderControl label={t.blur} value={cardStyle.cardBackgroundConfig?.blur || 0} min={0} max={20} step={0.1} onChange={(val) => updateCardStyle({ cardBackgroundConfig: { ...cardStyle.cardBackgroundConfig, blur: val } })} />
                           </div>
                         )}
                       </div>
                    )}
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <ColorPicker 
                    label={t.text}
                    color={cardStyle.textColor}
                    onChange={(val) => handleColorChange('textColor', val)}
                  />
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <ColorPicker 
                    label={t.blockquoteBackground}
                    color={cardStyle.blockquoteBackgroundColor.substring(0, 7)}
                    onChange={(val) => handleColorChange('blockquoteBackgroundColor', val + '20')}
                  />
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <ColorPicker 
                    label={t.blockquoteBorder}
                    color={cardStyle.blockquoteBorderColor}
                    onChange={(val) => handleColorChange('blockquoteBorderColor', val)}
                  />
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <ColorPicker 
                    label={t.codeBackground}
                    color={cardStyle.codeBackgroundColor.substring(0, 7)}
                    onChange={(val) => handleColorChange('codeBackgroundColor', val + '20')}
                  />
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorPicker 
                      label={t.h1Color}
                      color={cardStyle.h1Color || '#000000'}
                      onChange={(val) => handleColorChange('h1Color', val)}
                    />
                    <ColorPicker 
                      label={t.h1LineColor}
                      color={cardStyle.h1LineColor || '#3b82f6'}
                      onChange={(val) => handleColorChange('h1LineColor', val)}
                    />
                  </div>
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorPicker 
                      label={t.h2Color}
                      color={cardStyle.h2Color || '#ffffff'}
                      onChange={(val) => handleColorChange('h2Color', val)}
                    />
                    <ColorPicker 
                      label={t.h2BgColor}
                      color={cardStyle.h2BackgroundColor || '#3b82f6'}
                      onChange={(val) => handleColorChange('h2BackgroundColor', val)}
                    />
                  </div>
                </ColorSectionWrapper>

                <ColorSectionWrapper>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorPicker 
                      label={t.h3Color}
                      color={cardStyle.h3Color || '#000000'}
                      onChange={(val) => handleColorChange('h3Color', val)}
                    />
                    <ColorPicker 
                      label={t.h3LineColor}
                      color={cardStyle.h3LineColor || '#3b82f6'}
                      onChange={(val) => handleColorChange('h3LineColor', val)}
                    />
                  </div>
                </ColorSectionWrapper>
              </div>

              {/* Typography */}
              <div className="mb-8 space-y-4">
                <h2 className="text-sm font-semibold mb-4 opacity-80 flex items-center gap-2">
                   <Type size={16} /> {t.typography}
                </h2>
                
                {/* Current Font Display */}
                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg border border-black/10 dark:border-white/10 mb-4 text-center">
                  <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">{t.currentFont}</div>
                  <div className="text-xl font-bold truncate" style={{ fontFamily: cardStyle.fontFamily }}>
                    {cardStyle.fontFamily}
                  </div>
                </div>

                {/* Preset Fonts */}
                <div className="mb-4">
                  <label className="text-xs font-medium mb-2 block opacity-70">{t.presetFonts}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Inter', 'serif', 'monospace', 'Arial'].map((font) => (
                      <button
                        key={font}
                        onClick={() => updateCardStyle({ fontFamily: font })}
                        className={`p-2 rounded text-xs border transition-all ${
                          cardStyle.fontFamily === font 
                            ? 'bg-black/10 dark:bg-white/20 border-black/20 dark:border-white/40 shadow-sm' 
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Fonts Selection */}
                {cardStyle.customFonts.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-medium mb-2 block opacity-70">{t.customFonts}</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {cardStyle.customFonts.map(font => (
                        <button
                          key={font.name}
                          onClick={() => updateCardStyle({ fontFamily: font.name })}
                          className={`p-2 rounded text-xs border transition-all truncate ${
                            cardStyle.fontFamily === font.name 
                              ? 'bg-black/10 dark:bg-white/20 border-black/20 dark:border-white/40 shadow-sm' 
                              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                          style={{ fontFamily: font.name }}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Font */}
                <div className="mb-4">
                   <div className="relative">
                     <input 
                       type="file" 
                       accept=".ttf,.otf,.woff,.woff2"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const name = file.name.replace(/\.[^/.]+$/, "");
                           const reader = new FileReader();
                           reader.onload = (event) => {
                             if (event.target?.result) {
                               const url = event.target.result as string;
                               
                               const exists = cardStyle.customFonts.some(f => f.name === name);
                               
                               const isVariable = name.toLowerCase().includes('variable') || 
                                                  name.toLowerCase().includes('var') ||
                                                  name.toLowerCase().includes('vf');
                               
                               if (!exists) {
                                 addCustomFont({ 
                                   name, 
                                   url, 
                                   weight: isVariable ? 'variable' : 'normal' 
                                 });
                               }
                               
                               setTimeout(() => {
                                 updateCardStyle({ fontFamily: name });
                               }, 100);
                             }
                           };
                           reader.readAsDataURL(file);
                         }
                         e.target.value = '';
                       }}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     />
                     <button className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
                       <Plus size={14} /> {t.uploadFont}
                     </button>
                   </div>
                   
                   {cardStyle.customFonts.find(f => f.name === cardStyle.fontFamily) && (
                     <div className="mt-2 flex items-center justify-between px-1">
                       <label className="text-[10px] opacity-60 cursor-pointer flex items-center gap-2">
                         <input 
                           type="checkbox"
                           checked={cardStyle.customFonts.find(f => f.name === cardStyle.fontFamily)?.weight === 'variable'}
                           onChange={(e) => {
                             const font = cardStyle.customFonts.find(f => f.name === cardStyle.fontFamily);
                             if (font) {
                               const newFonts = cardStyle.customFonts.map(f => 
                                 f.name === font.name ? { ...f, weight: e.target.checked ? 'variable' : 'normal' } : f
                               );
                               updateCardStyle({ customFonts: newFonts as any });
                             }
                           }}
                           className="rounded border-black/20 dark:border-white/20 bg-black/10 dark:bg-white/10"
                         />
                         <span>Variable Font (Enable All Weights)</span>
                       </label>
                     </div>
                   )}
                </div>

                <SliderControl label={t.fontSize} value={cardStyle.fontSize} min={12} max={64} onChange={(val) => updateCardStyle({ fontSize: val })} />
              </div>

              {/* Watermark & Page Number */}
              <div className="mb-8 space-y-4">
                 <h2 className="text-sm font-semibold mb-4 opacity-80 flex items-center gap-2">
                   <Stamp size={16} /> {t.watermark} / {t.pageNumber}
                 </h2>

                 {/* Watermark */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium opacity-70">{t.watermark}</label>
                      <button 
                        onClick={() => updateCardStyle({ watermark: { ...cardStyle.watermark, enabled: !cardStyle.watermark.enabled } })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${cardStyle.watermark.enabled ? 'bg-slate-900 dark:bg-white/90' : 'bg-black/10 dark:bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white dark:bg-black/80 absolute top-1 transition-all ${cardStyle.watermark.enabled ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    {cardStyle.watermark.enabled && (
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 space-y-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider opacity-60 mb-1 block">{t.content}</label>
                          <input 
                            type="text" 
                            value={cardStyle.watermark.content}
                            onChange={(e) => updateCardStyle({ watermark: { ...cardStyle.watermark, content: e.target.value } })}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded p-2 text-xs focus:border-black/30 dark:focus:border-white/30 focus:outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                           <label className="text-[10px] uppercase tracking-wider opacity-60 mb-1 block">{t.position}</label>
                           <div className="flex bg-black/5 dark:bg-white/5 rounded p-1">
                             {['left', 'center', 'right'].map((pos) => (
                               <button
                                 key={pos}
                                 onClick={() => updateCardStyle({ watermark: { ...cardStyle.watermark, position: pos as any } })}
                                 className={`flex-1 py-1 text-[10px] rounded transition-all capitalize ${cardStyle.watermark.position === pos ? 'bg-black/10 dark:bg-white/20 text-slate-900 dark:text-white' : 'text-black/50 dark:text-white/50'}`}
                               >
                                 {t[pos as keyof typeof t]}
                               </button>
                             ))}
                           </div>
                        </div>

                        <SliderControl label={t.opacity} value={cardStyle.watermark.opacity} min={0} max={1} step={0.05} onChange={(val) => updateCardStyle({ watermark: { ...cardStyle.watermark, opacity: val } })} />
                      </div>
                    )}
                 </div>

                 {/* Page Number */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium opacity-70">{t.pageNumber}</label>
                      <button 
                        onClick={() => updateCardStyle({ pageNumber: { ...cardStyle.pageNumber, enabled: !cardStyle.pageNumber.enabled } })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${cardStyle.pageNumber.enabled ? 'bg-slate-900 dark:bg-white/90' : 'bg-black/10 dark:bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white dark:bg-black/80 absolute top-1 transition-all ${cardStyle.pageNumber.enabled ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    {cardStyle.pageNumber.enabled && (
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 space-y-3">
                        <div>
                           <label className="text-[10px] uppercase tracking-wider opacity-60 mb-1 block">{t.position}</label>
                           <div className="flex bg-black/5 dark:bg-white/5 rounded p-1">
                             {['left', 'center', 'right'].map((pos) => (
                               <button
                                 key={pos}
                                 onClick={() => updateCardStyle({ pageNumber: { ...cardStyle.pageNumber, position: pos as any } })}
                                 className={`flex-1 py-1 text-[10px] rounded transition-all capitalize ${cardStyle.pageNumber.position === pos ? 'bg-black/10 dark:bg-white/20 text-slate-900 dark:text-white' : 'text-black/50 dark:text-white/50'}`}
                               >
                                 {t[pos as keyof typeof t]}
                               </button>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

               {/* Custom CSS */}
               <div className="mb-8">
                <h2 className="text-sm font-semibold mb-4 opacity-80 flex items-center gap-2">
                   <Monitor size={16} /> {t.customCSS}
                </h2>
                <textarea
                  value={cardStyle.customCSS}
                  onChange={(e) => updateCardStyle({ customCSS: e.target.value })}
                  placeholder=".card { ... }"
                  className="w-full h-32 bg-black/5 dark:bg-white/5 p-3 rounded text-xs font-mono resize-none focus:outline-none focus:ring-1 ring-black/20 dark:ring-white/20 border border-black/10 dark:border-white/10 placeholder-black/30 dark:placeholder-white/20"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 glass-panel rounded-full z-40 text-inherit shadow-xl"
          >
            <ChevronLeft size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
          >
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-full px-6 py-4 flex items-center gap-6 min-w-[320px]">
              {/* Countdown Circle */}
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-black/5 dark:text-white/5"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={getCountdownColor()}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray="125.6"
                    animate={{ strokeDashoffset: 125.6 * (1 - resetCountdown / 10) }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold font-mono text-black dark:text-white leading-none">
                    {Math.ceil(resetCountdown)}s
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-black dark:text-white mb-0.5 whitespace-nowrap">{t.styleResetToast}</h3>
                <p className="text-[10px] opacity-60 text-black dark:text-white whitespace-nowrap">{t.settingsRestoredToast}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUndo}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold hover:opacity-90 transition-opacity active:scale-95 whitespace-nowrap"
                >
                  {t.undo}
                </button>
                <button
                  onClick={closeToast}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white opacity-40 hover:opacity-100 flex-shrink-0"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};