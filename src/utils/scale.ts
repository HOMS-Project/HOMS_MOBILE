/**
 * Responsive scaling utility for HOMS Mobile
 *
 * Base design width: 390px (iPhone 14 / Pixel 7 reference)
 * Scales proportionally on smaller/larger screens.
 *
 * Usage:
 *   import { rs, rf, rp } from '../utils/scale';
 *
 *   width: rs(200)   // responsive size (layout dimensions)
 *   fontSize: rf(16) // responsive font  (typography)
 *   padding: rp(16)  // responsive padding (spacing)
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BASE_WIDTH  = 390; // iPhone 14 / Pixel 7
const BASE_HEIGHT = 844;

/** Scale factor clamped to [0.75, 1.15] to avoid extreme distortion */
const wScale = Math.min(1.15, Math.max(0.75, SCREEN_W / BASE_WIDTH));
const hScale = Math.min(1.15, Math.max(0.75, SCREEN_H / BASE_HEIGHT));

/**
 * rs — Responsive Size (use for widths, heights, icon sizes)
 * Scales linearly with screen width.
 */
export const rs = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(size * wScale));

/**
 * rf — Responsive Font
 * Slightly softer scale so text doesn't shrink too aggressively on small screens.
 */
export const rf = (size: number): number => {
  const scale = 0.5 + wScale * 0.5; // gentler: [0.875, 1.075]
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

/**
 * rp — Responsive Padding / Margin
 * Same as rs but named separately for clarity.
 */
export const rp = (size: number): number => rs(size);

/** Raw screen dimensions for conditional layout */
export const SCREEN = { width: SCREEN_W, height: SCREEN_H };

/** True when device screen is shorter (< 700dp) — e.g. iPhone SE */
export const isSmallScreen = SCREEN_H < 700;
