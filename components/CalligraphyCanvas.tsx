import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { BrushSettings, Point, AppMode, ViewState } from '../types';
import { calculateBrushPhysics } from '../utils/brushPhysics';

export interface CalligraphyCanvasHandle {
  downloadPng: () => void;
  downloadSvg: () => void;
  undo: () => void;
  redo: () => void;
}

interface CalligraphyCanvasProps {
  settings: BrushSettings;
  mode: AppMode;
  viewState: ViewState;
  onViewStateChange: (newState: ViewState) => void;
  textToRender: string;
  triggerClear: boolean;
  onClearComplete: () => void;
  showGuides: boolean;
}

const CANVAS_SCALE = 1;
const MAX_HISTORY = 20;

// Helper to get distance between two points (used for gesture simulation)
const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Helper to get center point
const getCenter = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

const CalligraphyCanvas = forwardRef<CalligraphyCanvasHandle, CalligraphyCanvasProps>(({
  settings,
  mode,
  viewState,
  onViewStateChange,
  textToRender,
  triggerClear,
  onClearComplete,
  showGuides
}, ref) => {
  // Layer 0: Guides (Bottom)
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  // Layer 1: Text Generation Layer
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  // Layer 2: Hand Drawing Layer (Top)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Track active pointers for multi-touch gestures using PointerEvents
  const activePointers = useRef<Map<number, PointerEvent>>(new Map());
  
  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Gesture State Refs
  const lastDistRef = useRef<number>(0);
  const lastCenterRef = useRef<{x: number, y: number} | null>(null);
  const isGesturingRef = useRef<boolean>(false);
  
  // Recorders for SVG paths
  const textSvgRef = useRef<string[]>([]);
  const drawingSvgRef = useRef<string[]>([]);

  // --- History State for Undo/Redo ---
  type HistoryStep = {
    imageData: ImageData;
    svgPaths: string[];
  };
  const historyRef = useRef<HistoryStep[]>([]);
  const historyStepIndexRef = useRef<number>(-1);

  const saveHistory = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (historyStepIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepIndexRef.current + 1);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const svgPaths = [...drawingSvgRef.current]; 

    historyRef.current.push({ imageData, svgPaths });
    
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyStepIndexRef.current++;
    }
  }, []);

  const performUndo = useCallback(() => {
    if (historyStepIndexRef.current > 0) {
      historyStepIndexRef.current--;
      const step = historyRef.current[historyStepIndexRef.current];
      
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before restore to handle transparency
        ctx.putImageData(step.imageData, 0, 0);
        drawingSvgRef.current = [...step.svgPaths];
      }
    }
  }, []);

  const performRedo = useCallback(() => {
    if (historyStepIndexRef.current < historyRef.current.length - 1) {
      historyStepIndexRef.current++;
      const step = historyRef.current[historyStepIndexRef.current];
      
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(step.imageData, 0, 0);
        drawingSvgRef.current = [...step.svgPaths];
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    downloadPng: () => {
      const dCanvas = drawingCanvasRef.current;
      const tCanvas = textCanvasRef.current;
      if (!dCanvas || !tCanvas) return;

      try {
        const timestamp = Date.now();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dCanvas.width;
        tempCanvas.height = dCanvas.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        
        // Fill background first to ensure opacity works
        ctx.fillStyle = '#fdfbf7'; 
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.drawImage(tCanvas, 0, 0);
        ctx.drawImage(dCanvas, 0, 0);
        
        const pngUrl = tempCanvas.toDataURL('image/png');
        
        const pngLink = document.createElement('a');
        pngLink.download = `seoye-art-${timestamp}.png`;
        pngLink.href = pngUrl;
        document.body.appendChild(pngLink);
        pngLink.click();
        document.body.removeChild(pngLink);
      } catch (error) {
        console.error("PNG Download failed:", error);
        alert("이미지 저장 중 오류가 발생했습니다.");
      }
    },
    downloadSvg: () => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      try {
        const timestamp = Date.now();
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        
        const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px">`;
        const svgFooter = `</svg>`;
        const svgContent = [...textSvgRef.current, ...drawingSvgRef.current].join('\n');
        
        const blob = new Blob([svgHeader, svgContent, svgFooter], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const svgLink = document.createElement('a');
        svgLink.download = `seoye-art-${timestamp}.svg`;
        svgLink.href = url;
        document.body.appendChild(svgLink);
        svgLink.click();
        document.body.removeChild(svgLink);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error("SVG Download failed:", error);
        alert("SVG 저장 중 오류가 발생했습니다.");
      }
    },
    undo: performUndo,
    redo: performRedo
  }));

  // Helper: Get coordinate in Canvas space
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = drawingCanvasRef.current; 
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    
    // Account for CSS scaling vs Internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  }, []);

  const drawAndRecordEllipse = useCallback((
    ctx: CanvasRenderingContext2D, 
    svgRef: React.MutableRefObject<string[]>,
    x: number, 
    y: number, 
    rx: number, 
    ry: number, 
    rotation: number, 
    color: string, 
    opacity: number,
    isEraser: boolean = false
  ) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rx) || !Number.isFinite(ry)) return;

    ctx.beginPath();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    ctx.fill();

    // Eraser drawing shouldn't add to SVG paths usually, or should add mask. 
    // For simplicity, we skip adding eraser paths to SVG to avoid white blobs on transparent SVG export
    if (!isEraser) {
        const cx = x.toFixed(1);
        const cy = y.toFixed(1);
        const rX = rx.toFixed(1);
        const rY = ry.toFixed(1);
        const rotDeg = ((rotation * 180) / Math.PI).toFixed(1);
        const op = opacity.toFixed(2);
        
        const svgEl = `<ellipse cx="${cx}" cy="${cy}" rx="${rX}" ry="${rY}" transform="rotate(${rotDeg} ${cx} ${cy})" fill="${color}" fill-opacity="${op}" />`;
        svgRef.current.push(svgEl);
    }
  }, []);
  
  // Initialize Canvases
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    if (!container) return;
    
    // Create buffer canvas if it doesn't exist
    if (!bufferCanvasRef.current) {
        bufferCanvasRef.current = document.createElement('canvas');
    }

    // Helper to resize canvas
    const resizeLayer = (ref: React.RefObject<HTMLCanvasElement | null>, saveContent: boolean = false) => {
        const canvas = ref.current;
        if (!canvas) return;

        const rect = container.getBoundingClientRect();
        const w = rect.width * CANVAS_SCALE;
        const h = rect.height * CANVAS_SCALE;

        // If dimensions haven't changed, skip
        if (canvas.width === w * dpr && canvas.height === h * dpr) return;

        let savedData: ImageData | null = null;
        if (saveContent) {
            const ctx = canvas.getContext('2d');
            try {
                // Save existing content before resize
                savedData = ctx?.getImageData(0, 0, canvas.width, canvas.height) || null;
            } catch(e) {}
        }

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
             ctx.scale(dpr, dpr);
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';

             if (savedData) {
                 ctx.putImageData(savedData, 0, 0);
             }
        }
    };

    const handleResize = () => {
        resizeLayer(guideCanvasRef);
        resizeLayer(textCanvasRef);
        resizeLayer(drawingCanvasRef, true);
        
        // Resize buffer as well
        if (bufferCanvasRef.current) {
            const rect = container.getBoundingClientRect();
            bufferCanvasRef.current.width = rect.width * CANVAS_SCALE * dpr;
            bufferCanvasRef.current.height = rect.height * CANVAS_SCALE * dpr;
        }
    };
    
    // Initial Setup
    handleResize();

    // Initial History Setup
    const dCanvas = drawingCanvasRef.current;
    if (dCanvas) {
         const ctx = dCanvas.getContext('2d');
         if (ctx && historyRef.current.length === 0) {
             // Save initial blank state only if history is empty
             const initialImageData = ctx.getImageData(0, 0, dCanvas.width, dCanvas.height);
             historyRef.current = [{ imageData: initialImageData, svgPaths: [] }];
             historyStepIndexRef.current = 0;
         }
    }

    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });
    
    resizeObserver.observe(container);

    return () => {
        resizeObserver.disconnect();
    };
  }, []);

  // --- Render Guides ---
  useEffect(() => {
    const canvas = guideCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Using unscaled width/height for clear because context is scaled
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    if (!showGuides) return;
    
    // Guide metrics
    // We use settings.fontSize as the base 'em' height unit
    const fontSize = (settings.fontSize || 100); 
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    // Draw guides
    const gap = fontSize * 1.8; // Vertical gap between lines of text
    const startY = (height % gap) / 2; // Center vertically somewhat
    
    ctx.lineWidth = 1;

    for (let y = startY; y < height; y += gap) {
      // Baseline (Red, Solid)
      const baselineY = y + fontSize;
      if (baselineY > height) break;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)'; 
      ctx.setLineDash([]);
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();
      
      // Ascender Line (Top of em box)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.setLineDash([5, 5]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Mean Line (x-height, approx middle)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.setLineDash([2, 4]);
      const meanY = y + fontSize * 0.45;
      ctx.moveTo(0, meanY);
      ctx.lineTo(width, meanY);
      ctx.stroke();
      
      // Descender Line (Below baseline)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.setLineDash([5, 5]);
      const descY = baselineY + fontSize * 0.25;
      ctx.moveTo(0, descY);
      ctx.lineTo(width, descY);
      ctx.stroke();
    }
  }, [showGuides, settings.fontSize]);


  // Drawing Stroke Logic
  const drawStroke = useCallback((currentPoint: Point) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;

    const lastPoint = lastPointRef.current;
    
    let targetSize = settings.size;
    let velocity = 0;
    let dist = 0;
    
    if (settings.size > 1) {
        const physics = calculateBrushPhysics(lastPoint, currentPoint, settings);
        targetSize = physics.size;
        velocity = physics.velocity;
        dist = physics.dist;
    } else {
        dist = Math.sqrt(Math.pow(currentPoint.x - lastPoint.x, 2) + Math.pow(currentPoint.y - lastPoint.y, 2));
        targetSize = settings.size === 0 ? 0.5 : settings.size;
    }

    const angle = Math.atan2(currentPoint.y - lastPoint.y, currentPoint.x - lastPoint.x);
    const baseStep = Math.max(0.5, targetSize * 0.05); 
    const spacingFactor = settings.spacing * targetSize * 1.5;
    const stepSize = baseStep + spacingFactor;
    
    const steps = Math.ceil(dist / stepSize);
    const brushAngleRad = settings.angle * (Math.PI / 180);
    const blurAmount = (settings.hardness >= 0.95 || settings.size <= 1) ? 0 : targetSize * (1 - settings.hardness);

    // ERASER LOGIC: Use destination-out composite op
    ctx.globalCompositeOperation = settings.isEraser ? 'destination-out' : 'source-over';

    if (!settings.isEraser) {
        ctx.shadowBlur = blurAmount;
        ctx.shadowColor = settings.color;
    } else {
        ctx.shadowBlur = 0;
    }

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = lastPoint.x + (currentPoint.x - lastPoint.x) * t;
      const y = lastPoint.y + (currentPoint.y - lastPoint.y) * t;

      const roughnessThreshold = Math.random();
      const dryBrushFactor = (velocity * settings.roughness) / 5; 

      if (settings.size > 1 && roughnessThreshold < dryBrushFactor && !settings.isEraser) continue;

      const radiusX = targetSize / 2;
      const radiusY = (targetSize / 2) * settings.roundness;
      const opacity = settings.size <= 1 ? 1.0 : 1.0;
      
      drawAndRecordEllipse(ctx, drawingSvgRef, x, y, radiusX, radiusY, brushAngleRad, settings.color, opacity, settings.isEraser);

      if (settings.size > 1 && (opacity < 0.9 || settings.roughness > 0.2) && !settings.isEraser) {
        for (let j = 0; j < 3; j++) {
           const angleOffset = (Math.random() - 0.5) * Math.PI;
           const distOffset = (Math.random() * targetSize) / 2;
           const bx = x + Math.cos(brushAngleRad + angleOffset) * distOffset;
           const by = y + Math.sin(brushAngleRad + angleOffset) * distOffset;
           
           drawAndRecordEllipse(ctx, drawingSvgRef, bx, by, radiusX * 0.3, radiusY * 0.3, brushAngleRad, settings.color, opacity * 0.4 * Math.random(), false);
        }
      }
    }
    
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over'; // Reset

  }, [settings, drawAndRecordEllipse]);

  const getCursorClass = () => settings.isEraser ? 'cursor-cell' : 'cursor-crosshair';

  // --- Unified Pointer Events for Mouse, Touch, and Pen ---
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent default browser behavior (e.g. scroll, text selection)
    // Important for drawing apps on mobile
    if (e.target instanceof Element) {
      e.target.setPointerCapture(e.pointerId);
    }
    
    activePointers.current.set(e.pointerId, e.nativeEvent as PointerEvent);

    // 1. Gesture Start (Two fingers)
    if (activePointers.current.size === 2) {
       isDrawingRef.current = false;
       lastPointRef.current = null;
       isGesturingRef.current = true;
       
       const pointers = Array.from(activePointers.current.values()) as PointerEvent[];
       lastDistRef.current = getDistance(
           {x: pointers[0].clientX, y: pointers[0].clientY}, 
           {x: pointers[1].clientX, y: pointers[1].clientY}
       );
       lastCenterRef.current = getCenter(
           {x: pointers[0].clientX, y: pointers[0].clientY}, 
           {x: pointers[1].clientX, y: pointers[1].clientY}
       );
       return;
    }

    // 2. Drawing Start (One pointer)
    if (mode === AppMode.DRAW && activePointers.current.size === 1) {
      const pos = getCanvasPos(e.clientX, e.clientY);
      
      isDrawingRef.current = true;
      
      // Use PointerEvent pressure if available, otherwise default
      // 0.5 is a safe default for mouse if e.pressure is 0.5 (often default for mouse clicks in some browsers)
      // or 0 (some mouses).
      let pressure = e.pressure;
      if (e.pointerType === 'mouse' && pressure === 0) pressure = 0.5;
      if (e.pointerType === 'touch' && pressure === 0) pressure = 0.5; // Some touch screens don't report pressure
      
      lastPointRef.current = { ...pos, pressure, time: Date.now() };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, e.nativeEvent as PointerEvent);

    // 1. Gesture Move
    if (isGesturingRef.current && activePointers.current.size === 2) {
        const pointers = Array.from(activePointers.current.values()) as PointerEvent[];
        const newDist = getDistance(
            {x: pointers[0].clientX, y: pointers[0].clientY}, 
            {x: pointers[1].clientX, y: pointers[1].clientY}
        );
        const newCenter = getCenter(
            {x: pointers[0].clientX, y: pointers[0].clientY}, 
            {x: pointers[1].clientX, y: pointers[1].clientY}
        );
        
        if (lastDistRef.current > 0 && lastCenterRef.current) {
            const scaleFactor = newDist / lastDistRef.current;
            const newScale = Math.min(Math.max(0.5, viewState.scale * scaleFactor), 5.0);
            
            const dx = newCenter.x - lastCenterRef.current.x;
            const dy = newCenter.y - lastCenterRef.current.y;
            
            onViewStateChange({
                scale: newScale,
                offset: {
                    x: viewState.offset.x + dx,
                    y: viewState.offset.y + dy
                }
            });
        }
        
        lastDistRef.current = newDist;
        lastCenterRef.current = newCenter;
        return;
    }

    // 2. Drawing Move
    if (mode === AppMode.DRAW && isDrawingRef.current && activePointers.current.size === 1) {
        // High-frequency event handling (Coalesced Events)
        // Crucial for smooth lines on iPad Pro (120Hz) and other high-rate digitizers
        const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        
        for (const ev of events) {
            const pos = getCanvasPos(ev.clientX, ev.clientY);
            let pressure = ev.pressure;
            
            if (ev.pointerType === 'mouse' && pressure === 0) pressure = 0.5;
            // Force minimal pressure on touch if reported as 0 but valid move
            if (ev.pointerType === 'touch' && pressure === 0) pressure = 0.5; 

            const currentPoint = { ...pos, pressure, time: Date.now() };
            
            // Only draw if we have a last point
            if (lastPointRef.current) {
               drawStroke(currentPoint);
            }
            lastPointRef.current = currentPoint;
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.target instanceof Element) {
        e.target.releasePointerCapture(e.pointerId);
    }
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
        isGesturingRef.current = false;
    }
    
    if (activePointers.current.size === 0 && isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPointRef.current = null;
        saveHistory();
    }
  };

  // Text Rendering
  const renderGenerativeText = useCallback((text: string) => {
    const canvas = textCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    textSvgRef.current = [];

    const buffer = bufferCanvasRef.current;
    const bCtx = buffer?.getContext('2d');
    if (!buffer || !bCtx) return;
    if (buffer.width === 0 || buffer.height === 0) return;

    bCtx.clearRect(0, 0, buffer.width, buffer.height);
    bCtx.fillStyle = 'black';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    
    let fontName = 'Nanum Pen Script';
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

    if (settings.fontStyle === 'HAND') {
        fontName = hasKorean ? 'Hi Melody' : 'Dancing Script';
    } else if (settings.fontStyle === 'PEN') {
        fontName = 'Nanum Pen Script'; 
    } else if (settings.fontStyle === 'BRUSH') {
        fontName = 'Noto Serif KR';
    }

    const isCursive = fontName === 'Dancing Script' || fontName === 'Sacramento';

    try {
        const spacingToUse = isCursive ? 0 : settings.letterSpacing;
        // @ts-ignore
        bCtx.letterSpacing = `${spacingToUse}px`;
    } catch (e) {}

    bCtx.setTransform(1, 0, settings.slant || 0, 1, 0, 0);
    
    let fontWeight = 'normal'; 
    if (settings.fontStyle === 'BRUSH') {
        fontWeight = '900'; 
    }
    const fontSize = (settings.fontSize || 100) * dpr;
    bCtx.font = `${fontWeight} ${fontSize}px '${fontName}'`;

    if (settings.weightOption === 'BOLD') {
       // Reduced stroke width for BOLD to prevent clumping
       bCtx.lineWidth = fontSize * 0.035; 
       bCtx.strokeStyle = 'black';
       bCtx.lineJoin = 'round';
    }

    const lines = text.split('\n');
    const lineHeightPx = fontSize * (settings.lineHeight || 1.2);
    const totalHeight = lines.length * lineHeightPx;
    const startY = (buffer.height - totalHeight) / 2 + (lineHeightPx / 2);

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeightPx);
      bCtx.fillText(line, buffer.width / 2, y);
      if (settings.weightOption === 'BOLD') {
        bCtx.strokeText(line, buffer.width / 2, y);
      }
    });
    
    bCtx.setTransform(1, 0, 0, 1, 0, 0);

    const imageData = bCtx.getImageData(0, 0, buffer.width, buffer.height);
    const data = imageData.data;
    const particles: {x: number, y: number}[] = [];

    // Redefined particle sizes based on user feedback
    let particleSize = 3;
    let scanStep = 2;

    if (settings.weightOption === 'THIN') {
        // True "Pen" thickness
        particleSize = 1.6; // Increased from 0.8
        scanStep = 1; 
    } else if (settings.weightOption === 'NORMAL') {
        // Standard Brush thickness
        particleSize = 3.5; // Increased from 2.5
        scanStep = 2;     
    } else if (settings.weightOption === 'BOLD') {
        // Impactful but readable (non-clumping)
        particleSize = 6.0; // Increased from 5.0
        scanStep = 2;     
    }
    
    const effectiveStep = Math.max(1, Math.floor(scanStep * dpr));

    for (let y = 0; y < buffer.height; y += effectiveStep) {
      for (let x = 0; x < buffer.width; x += effectiveStep) {
        const alpha = data[(y * buffer.width + x) * 4 + 3];
        if (alpha > 50) { 
          particles.push({ x: x / dpr, y: y / dpr });
        }
      }
    }

    let particleIndex = 0;
    const batchSize = 1000; 
    particles.sort(() => Math.random() - 0.5);
    
    const brushAngleRad = 45 * (Math.PI / 180);
    let roughness = 0;
    let roundness = 1.0;
    
    if (mode === AppMode.GENERATE) {
        if (settings.fontStyle === 'BRUSH') {
            roughness = 0.4;
            roundness = 0.6;
        } else if (settings.fontStyle === 'PEN') {
            roughness = 0.05; 
            roundness = 0.95;
        } else {
            roughness = 0.02; 
            roundness = 1.0;
        }
    }

    const animateText = () => {
      if (particleIndex >= particles.length) return;
      const shouldBlur = settings.weightOption !== 'THIN';
      ctx.shadowBlur = shouldBlur ? 1 : 0;
      ctx.shadowColor = settings.color;

      for (let i = 0; i < batchSize; i++) {
        if (particleIndex >= particles.length) break;
        const p = particles[particleIndex];
        
        if (mode === AppMode.GENERATE && settings.fontStyle === 'BRUSH' && Math.random() < 0.1) {
            particleIndex++;
            continue;
        }
        
        const jiggle = settings.weightOption === 'THIN' ? 0.1 : (roughness * 1.5);
        const jx = p.x + (Math.random() - 0.5) * jiggle;
        const jy = p.y + (Math.random() - 0.5) * jiggle;
        const currentParticleSize = particleSize * (0.85 + Math.random() * 0.3); 
        const radiusX = currentParticleSize / 2;
        const radiusY = (currentParticleSize / 2) * roundness;
        const opacity = 0.95 + Math.random() * 0.05;

        drawAndRecordEllipse(ctx, textSvgRef, jx, jy, radiusX, radiusY, brushAngleRad, settings.color, opacity);
        particleIndex++;
      }
      ctx.shadowBlur = 0;
      animationFrameIdRef.current = requestAnimationFrame(animateText);
    };
    animationFrameIdRef.current = requestAnimationFrame(animateText);
  }, [settings, drawAndRecordEllipse, mode]);


  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // Handle Clear
  useEffect(() => {
    if (triggerClear) {
      const dpr = window.devicePixelRatio || 1;
      
      if (textCanvasRef.current) {
         const ctx = textCanvasRef.current.getContext('2d');
         ctx?.clearRect(0, 0, textCanvasRef.current.width / dpr, textCanvasRef.current.height / dpr);
         textSvgRef.current = [];
      }
      
      if (drawingCanvasRef.current) {
         const ctx = drawingCanvasRef.current.getContext('2d');
         ctx?.clearRect(0, 0, drawingCanvasRef.current.width / dpr, drawingCanvasRef.current.height / dpr);
         drawingSvgRef.current = [];
         
         // Fix: Save blank state to history to enable Undo for Clear action
         saveHistory();
      }

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      onClearComplete();
    }
  }, [triggerClear, onClearComplete, saveHistory]);

  // Handle Text Update
  useEffect(() => {
    if (mode === AppMode.GENERATE && textToRender) {
      renderGenerativeText(textToRender);
    } else if (!textToRender) {
       if (textCanvasRef.current) {
          const dpr = window.devicePixelRatio || 1;
          const ctx = textCanvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, textCanvasRef.current.width / dpr, textCanvasRef.current.height / dpr);
          textSvgRef.current = [];
       }
       if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    }
  }, [mode, textToRender, settings, renderGenerativeText]); 

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative overflow-hidden ${getCursorClass()}`}
      // Use Pointer Events for unified Mouse, Touch, and Stylus handling
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }} // Critical for preventing scroll on mobile
    >
      <canvas
        ref={guideCanvasRef}
        className="absolute inset-0 touch-none origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <canvas
        ref={textCanvasRef}
        className="absolute inset-0 touch-none origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 touch-none origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`,
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
    </div>
  );
});

export default CalligraphyCanvas;