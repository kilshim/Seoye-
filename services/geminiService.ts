import { GeneratedPhrase, BrushSettings, FontStyle } from '../types';

export const generateInspiration = async (): Promise<GeneratedPhrase> => {
  // Static list of phrases since API is removed
  const phrases = [
    { korean: "일체유심조", meaning: "Everything depends on the mind." },
    { korean: "화양연화", meaning: "The most beautiful moment in life." },
    { korean: "무위자연", meaning: "Nature doing nothing yet leaving nothing undone." },
    { korean: "온고지신", meaning: "Reviewing the old to understand the new." },
    { korean: "진인사대천명", meaning: "Do your best and wait for heaven's will." },
    { korean: "유비무환", meaning: "Preparation prevents layout." },
    { korean: "대기만성", meaning: "Great talents mature late." }
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

export const generateCreativeSettings = (style: FontStyle): Partial<BrushSettings> => {
      // Generate random values
      const base: Partial<BrushSettings> = {
          roughness: Math.random() * 0.5,
          taper: 0.1 + Math.random() * 0.9,
          roundness: 0.1 + Math.random() * 0.9,
          angle: Math.floor(Math.random() * 180),
          hardness: 0.2 + Math.random() * 0.8,
          spacing: Math.random() * 0.15,
          letterSpacing: Math.floor((Math.random() - 0.2) * 15),
          lineHeight: 1.0 + Math.random() * 0.8,
          slant: (Math.random() - 0.5) * 0.4,
          size: 40 + Math.random() * 60
      };

      if (style === 'BRUSH') {
          base.roughness = 0.3 + Math.random() * 0.6;
          base.size = 80 + Math.random() * 70;
          base.taper = 0.5 + Math.random() * 0.5;
          base.hardness = 0.1 + Math.random() * 0.6;
      } else if (style === 'PEN') {
          base.roughness = Math.random() * 0.2;
          base.size = 30 + Math.random() * 40;
          base.roundness = 0.8 + Math.random() * 0.2;
      } else { // HAND
          base.slant = (Math.random() - 0.5) * 0.6;
          base.size = 50 + Math.random() * 50;
      }
      return base;
};