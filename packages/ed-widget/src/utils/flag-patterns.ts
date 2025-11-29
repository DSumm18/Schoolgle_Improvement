/**
 * Flag Pattern Generators
 * Creates recognizable flag shapes with proper patterns (not just stripes)
 */

export interface FlagPattern {
  type: 'horizontal' | 'vertical' | 'diagonal' | 'cross' | 'union-jack' | 'circle' | 'triangle';
  colors: string[];
  proportions?: number[]; // For stripes, the proportion of each color
}

/**
 * Generate flag pattern data for each country
 */
export const FLAG_PATTERNS: Record<string, FlagPattern> = {
  'en-GB': {
    type: 'union-jack',
    colors: ['#012169', '#FFFFFF', '#C8102E'], // Blue, white, red
  },
  'pl': {
    type: 'horizontal',
    colors: ['#FFFFFF', '#DC143C'], // White, red (top to bottom)
    proportions: [0.5, 0.5],
  },
  'ro': {
    type: 'vertical',
    colors: ['#002B7F', '#FCD116', '#CE1126'], // Blue, yellow, red (left to right)
    proportions: [0.33, 0.34, 0.33],
  },
  'ur': {
    type: 'vertical',
    colors: ['#01411C', '#FFFFFF'], // Green, white (left to right)
    proportions: [0.75, 0.25], // Green is wider
  },
  'bn': {
    type: 'horizontal',
    colors: ['#006A4E', '#F42A41'], // Green, red (top to bottom)
    proportions: [0.75, 0.25], // Green is larger
  },
  'so': {
    type: 'horizontal',
    colors: ['#4189DD', '#FFFFFF'], // Blue, white (top to bottom)
    proportions: [0.5, 0.5],
  },
  'es': {
    type: 'horizontal',
    colors: ['#AA151B', '#F1BF00', '#AA151B'], // Red, yellow, red (top to bottom)
    proportions: [0.25, 0.5, 0.25], // Yellow band is wider
  },
  'pt': {
    type: 'vertical',
    colors: ['#006600', '#FF0000'], // Green, red (left to right)
    proportions: [0.4, 0.6], // Red is wider
  },
  'fr': {
    type: 'vertical',
    colors: ['#002395', '#FFFFFF', '#ED2939'], // Blue, white, red (left to right)
    proportions: [0.33, 0.34, 0.33],
  },
  'zh': {
    type: 'horizontal',
    colors: ['#DE2910', '#FFDE00'], // Red, yellow (top to bottom)
    proportions: [0.75, 0.25], // Red is larger
  },
  'ar': {
    type: 'horizontal',
    colors: ['#006C35', '#FFFFFF'], // Green, white (top to bottom)
    proportions: [0.5, 0.5],
  },
  'pa': {
    type: 'horizontal',
    colors: ['#FF9933', '#FFFFFF', '#138808'], // Saffron, white, green (top to bottom)
    proportions: [0.33, 0.34, 0.33],
  },
};

/**
 * Generate flag points based on pattern type
 */
export function generateFlagPatternPoints(
  count: number,
  pattern: FlagPattern,
  width: number = 1.6,
  height: number = 1.0
): Float32Array {
  const positions = new Float32Array(count * 3);
  const depth = 0.1;
  
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    
    switch (pattern.type) {
      case 'horizontal':
        // Horizontal stripes - ensure clear stripe boundaries
        x = (Math.random() - 0.5) * width;
        y = (Math.random() - 0.5) * height;
        // Add slight wave for flag movement effect
        x += Math.sin(y * 4) * 0.02;
        break;
        
      case 'vertical':
        // Vertical stripes - ensure clear stripe boundaries
        x = (Math.random() - 0.5) * width;
        y = (Math.random() - 0.5) * height;
        // Add slight wave for flag movement effect
        y += Math.sin(x * 4) * 0.02;
        break;
        
      case 'union-jack':
        // Union Jack - create highly recognizable pattern with clear structure
        // Pattern: Blue background with red St. George's cross (vertical + horizontal) and white St. Andrew's cross (diagonal)
        const t = i / count;
        const crossWidth = 0.15; // Width of cross bands (15% of flag)
        
        // Create Union Jack pattern with better particle distribution
        if (t < 0.3) {
          // Blue background - fill most of the flag
          x = (Math.random() - 0.5) * width;
          y = (Math.random() - 0.5) * height;
          // Exclude center cross areas
          if (Math.abs(x) < width * crossWidth || Math.abs(y) < height * crossWidth) {
            // Shift to edge if in cross area
            x = x < 0 ? -width * 0.4 : width * 0.4;
            y = y < 0 ? -height * 0.4 : height * 0.4;
          }
        } else if (t < 0.45) {
          // Vertical red cross (St. George's) - center vertical band
          x = (Math.random() - 0.5) * width * crossWidth;
          y = (Math.random() - 0.5) * height;
        } else if (t < 0.5) {
          // Horizontal red cross (St. George's) - center horizontal band
          x = (Math.random() - 0.5) * width;
          y = (Math.random() - 0.5) * height * crossWidth;
        } else if (t < 0.65) {
          // Diagonal white cross 1 (St. Andrew's) - top-left to bottom-right
          const diagPos = (Math.random() - 0.5) * width * 1.2;
          const diagWidth = crossWidth * 0.8;
          x = diagPos;
          y = diagPos * (height / width);
          // Add some width to the diagonal
          const perpOffset = (Math.random() - 0.5) * diagWidth;
          x += perpOffset * (height / width);
          y -= perpOffset;
        } else if (t < 0.8) {
          // Diagonal white cross 2 (St. Andrew's) - top-right to bottom-left
          const diagPos = (Math.random() - 0.5) * width * 1.2;
          const diagWidth = crossWidth * 0.8;
          x = diagPos;
          y = -diagPos * (height / width);
          // Add some width to the diagonal
          const perpOffset = (Math.random() - 0.5) * diagWidth;
          x -= perpOffset * (height / width);
          y -= perpOffset;
        } else {
          // Additional blue background particles for density
          x = (Math.random() - 0.5) * width;
          y = (Math.random() - 0.5) * height;
          // Avoid cross areas
          if (Math.abs(x) < width * crossWidth * 1.5 || Math.abs(y) < height * crossWidth * 1.5) {
            const angle = Math.random() * Math.PI * 2;
            const dist = width * 0.35;
            x = Math.cos(angle) * dist;
            y = Math.sin(angle) * dist;
          }
        }
        break;
        
      default:
        x = (Math.random() - 0.5) * width;
        y = (Math.random() - 0.5) * height;
    }
    
    // Add wave effect for flag movement
    const waveX = Math.sin(y * 3) * 0.05;
    const z = (Math.random() - 0.5) * depth;
    
    positions[i * 3] = x + waveX;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
}

/**
 * Generate flag colors based on pattern
 */
export function generateFlagPatternColors(
  count: number,
  pattern: FlagPattern
): Float32Array {
  const colors = new Float32Array(count * 3);
  const parsedColors = pattern.colors.map(c => parseColor(c));
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    let colorIndex = 0;
    
    switch (pattern.type) {
      case 'horizontal':
        // Distribute by Y position (top to bottom)
        const normalizedY = (t * 2 - 1) * -1; // Flip Y (top is positive)
        let accumulated = 0;
        for (let j = 0; j < pattern.proportions!.length; j++) {
          accumulated += pattern.proportions![j];
          if (normalizedY <= accumulated) {
            colorIndex = j;
            break;
          }
        }
        break;
        
      case 'vertical':
        // Distribute by X position (left to right)
        const normalizedX = t * 2 - 1; // -1 to 1
        let accX = -1;
        for (let j = 0; j < pattern.proportions!.length; j++) {
          accX += pattern.proportions![j] * 2;
          if (normalizedX <= accX) {
            colorIndex = j;
            break;
          }
        }
        break;
        
      case 'union-jack':
        // Union Jack - match color to point distribution
        // Colors: [0] = Blue, [1] = White, [2] = Red
        const tUnion = i / count;
        
        if (tUnion < 0.3) {
          // Blue background
          colorIndex = 0;
        } else if (tUnion < 0.45) {
          // Vertical red cross (St. George's)
          colorIndex = 2;
        } else if (tUnion < 0.5) {
          // Horizontal red cross (St. George's)
          colorIndex = 2;
        } else if (tUnion < 0.8) {
          // Diagonal white crosses (St. Andrew's)
          colorIndex = 1;
        } else {
          // Additional blue background
          colorIndex = 0;
        }
        break;
        
      default:
        colorIndex = Math.floor(t * pattern.colors.length);
    }
    
    colorIndex = Math.min(colorIndex, parsedColors.length - 1);
    const color = parsedColors[colorIndex];
    
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }
  
  return colors;
}

/**
 * Parse hex color to RGB
 */
function parseColor(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }
  return [0, 0, 0];
}

