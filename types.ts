
export interface Point {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export type FontStyle = 'HAND' | 'PEN' | 'BRUSH';
export type WeightOption = 'THIN' | 'NORMAL' | 'BOLD';

export interface BrushSettings {
  size: number; // Particle radius for brush / Stroke width
  roughness: number; // Simulates 'Bi-baek' (dry brush)
  taper: number;     // Controls sharpness of stroke ends (0 = Blunt, 1 = Sharp)
  color: string;
  roundness: number; // 0.1 to 1.0 (Flat to Round)
  angle: number;     // 0 to 180 degrees
  hardness: number;  // 0.1 (Soft) to 1.0 (Hard)
  spacing: number;   // 0.0 (Continuous) to 1.0 (Dotted)
  
  // Text Specific Settings
  letterSpacing: number; // Spacing between letters for generated text
  lineHeight: number;    // Vertical spacing multiplier (e.g., 1.0, 1.5)
  slant: number;     // Text slant/italic (-0.5 to 0.5 usually)
  fontSize: number;  // Font size for generated text
  fontStyle: FontStyle;
  weightOption: WeightOption;
  
  // Tools
  isEraser: boolean;
}

export interface GeneratedPhrase {
  korean: string;
  meaning: string;
}

export interface ViewState {
  scale: number;
  offset: { x: number; y: number };
}

export enum AppMode {
  DRAW = 'DRAW',
  GENERATE = 'GENERATE'
}

export interface Preset {
  id: string;
  name: string;
  settings: BrushSettings;
}