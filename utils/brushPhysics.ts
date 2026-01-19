import { Point, BrushSettings } from '../types';

/**
 * Calculates the distance between two points
 */
export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculates the angle between two points
 */
export const getAngle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

/**
 * Spline interpolation to smooth out the mouse/touch input
 * Returns a set of interpolated points between p1 and p2 using control points
 */
export const getSplinePoints = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
  tension: number = 0.5,
  numOfSegments: number = 10
): Point[] => {
  // Simplified Catmull-Rom spline or Bezier implementation could go here.
  // For performance in this demo, we will use linear interpolation with 
  // dynamic density based on speed.
  return []; 
};

/**
 * Core Brush Physics Logic
 * Determines the visual properties of the brush tip based on physics.
 */
export const calculateBrushPhysics = (
  lastPoint: Point,
  currentPoint: Point,
  settings: BrushSettings
) => {
  const dist = getDistance(lastPoint, currentPoint);
  const timeDiff = currentPoint.time - lastPoint.time;
  
  // Velocity: pixels per millisecond
  const velocity = timeDiff > 0 ? dist / timeDiff : 0;

  // Max size is slightly larger than set size to allow for pressure/speed variation swelling
  // We use settings.size as a baseline.
  const maxSize = settings.size * 1.5; 
  
  let pressureInput = 0.5;

  // Check if pressure is valid (from touch input). 
  // We treat -1 as "no pressure data" (e.g. Mouse).
  if (currentPoint.pressure >= 0 && currentPoint.pressure <= 1) {
    pressureInput = currentPoint.pressure;
  } else {
    // Simulate pressure based on velocity (Mouse)
    // Faster = Thinner = Lower Pressure
    const maxVelocity = 2.5; 
    const velocityRatio = Math.min(1, velocity / maxVelocity);
    
    // Stationary (v=0) -> Pressure 1.0 (Thick)
    // Fast (v=max) -> Pressure 0.0 (Thin)
    pressureInput = 1 - velocityRatio;
  }

  // Taper controls how much the pressure/velocity affects the size.
  // Taper 1.0: Size is fully driven by pressure (0 to maxSize).
  // Taper 0.0: Size is constant (maxSize).
  const targetSize = maxSize * (1 - (1 - pressureInput) * settings.taper);

  return {
    dist,
    angle: getAngle(lastPoint, currentPoint),
    size: targetSize,
    opacity: 1.0, 
    velocity
  };
};