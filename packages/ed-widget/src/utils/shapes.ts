/**
 * Shape Generators for Particle System
 * Each function returns Float32Array of x,y,z positions
 */

import type { PathData, EmojiReference } from './emoji-references';
import { getEmojiReference } from './emoji-references';

/**
 * Generate evenly distributed points on a sphere
 */
export function generateSpherePoints(count: number, radius = 1): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere distribution for even spacing
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}

/**
 * Generate points forming a pencil shape
 */
export function generatePencilPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const bodyHeight = 1.2;
  const tipHeight = 0.4;
  const radius = 0.3;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random();

    if (t < 0.75) {
      // Pencil body (cylinder)
      const y = (t / 0.75) * bodyHeight - bodyHeight / 2;
      const bodyRadius = radius * Math.sqrt(r);
      positions[i * 3] = bodyRadius * Math.cos(angle);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = bodyRadius * Math.sin(angle);
    } else {
      // Pencil tip (cone)
      const tipT = (t - 0.75) / 0.25;
      const y = bodyHeight / 2 + tipT * tipHeight;
      const coneRadius = radius * (1 - tipT) * Math.sqrt(r);
      positions[i * 3] = coneRadius * Math.cos(angle);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = coneRadius * Math.sin(angle);
    }
  }

  return positions;
}

/**
 * Generate points forming a lightbulb shape
 */
export function generateLightbulbPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random();

    if (t < 0.6) {
      // Bulb part (sphere)
      const phi = Math.acos(1 - 2 * (t / 0.6));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const bulbRadius = 0.7;

      positions[i * 3] = bulbRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = bulbRadius * Math.cos(phi) + 0.3;
      positions[i * 3 + 2] = bulbRadius * Math.sin(phi) * Math.sin(theta);
    } else {
      // Base/screw part (cylinder)
      const baseT = (t - 0.6) / 0.4;
      const baseRadius = 0.25 * Math.sqrt(r);
      const y = -0.4 - baseT * 0.5;

      positions[i * 3] = baseRadius * Math.cos(angle);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = baseRadius * Math.sin(angle);
    }
  }

  return positions;
}

/**
 * Generate points forming a flag shape (rectangle)
 */
export function generateFlagPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const width = 1.6;
  const height = 1.0;
  const depth = 0.1;

  for (let i = 0; i < count; i++) {
    // Random point in a box
    const x = (Math.random() - 0.5) * width;
    const y = (Math.random() - 0.5) * height;
    const z = (Math.random() - 0.5) * depth;

    // Add wave effect
    const waveX = Math.sin(y * 3) * 0.1;

    positions[i * 3] = x + waveX;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}

/**
 * Generate points forming a heart shape
 */
export function generateHeartPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Parametric heart equation
    const t = (i / count) * Math.PI * 2;
    const r = Math.random() * 0.3;
    const depthRandom = (Math.random() - 0.5) * 0.3;

    // Heart curve
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    // Scale and add randomness
    const scale = 0.05;
    positions[i * 3] = x * scale + (Math.random() - 0.5) * r;
    positions[i * 3 + 1] = y * scale + (Math.random() - 0.5) * r;
    positions[i * 3 + 2] = depthRandom;
  }

  return positions;
}

/**
 * Generate points forming a star shape
 */
export function generateStarPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const points = 5;
  const outerRadius = 1;
  const innerRadius = 0.4;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * 3; // Multiple rotations
    const t = i / count;
    const isOuter = Math.floor(t * points * 2) % 2 === 0;
    const radius = isOuter ? outerRadius : innerRadius;
    const r = Math.random() * 0.2;
    const depth = (Math.random() - 0.5) * 0.2;

    positions[i * 3] = Math.cos(angle) * (radius + r);
    positions[i * 3 + 1] = Math.sin(angle) * (radius + r);
    positions[i * 3 + 2] = depth;
  }

  return positions;
}

/**
 * Generate points forming a thumbs up shape
 */
export function generateThumbsUpPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.3) {
      // Thumb (vertical)
      const thumbT = t / 0.3;
      const x = -0.3 + Math.random() * 0.3;
      const y = 0.2 + thumbT * 0.8;
      const z = (Math.random() - 0.5) * 0.2;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    } else {
      // Fist (rounded rectangle)
      const fistT = (t - 0.3) / 0.7;
      const angle = fistT * Math.PI * 2;
      const radius = 0.4 + Math.random() * 0.1;
      
      positions[i * 3] = Math.cos(angle) * radius + 0.2;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.6 - 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
  }
  
  return positions;
}

/**
 * Generate points forming a checkmark shape
 */
export function generateCheckmarkPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    let x, y;
    if (t < 0.4) {
      // Short stroke
      const strokeT = t / 0.4;
      x = -0.5 + strokeT * 0.6;
      y = -0.2 - strokeT * 0.5;
    } else {
      // Long stroke
      const strokeT = (t - 0.4) / 0.6;
      x = 0.1 + strokeT * 0.8;
      y = -0.7 + strokeT * 1.3;
    }
    
    // Add thickness
    const offset = (Math.random() - 0.5) * 0.1;
    positions[i * 3] = x + offset;
    positions[i * 3 + 1] = y + offset;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  
  return positions;
}

/**
 * Generate points forming a smiley face
 */
export function generateSmileyPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.6) {
      // Circle outline
      const angle = (t / 0.6) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.1;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    } else if (t < 0.75) {
      // Left eye
      const eyeT = (t - 0.6) / 0.15;
      const angle = eyeT * Math.PI * 2;
      
      positions[i * 3] = -0.3 + Math.cos(angle) * 0.1;
      positions[i * 3 + 1] = 0.2 + Math.sin(angle) * 0.15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    } else if (t < 0.9) {
      // Right eye
      const eyeT = (t - 0.75) / 0.15;
      const angle = eyeT * Math.PI * 2;
      
      positions[i * 3] = 0.3 + Math.cos(angle) * 0.1;
      positions[i * 3 + 1] = 0.2 + Math.sin(angle) * 0.15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    } else {
      // Smile
      const smileT = (t - 0.9) / 0.1;
      const angle = Math.PI + smileT * Math.PI;
      
      positions[i * 3] = Math.cos(angle) * 0.4;
      positions[i * 3 + 1] = Math.sin(angle) * 0.4 - 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }
  
  return positions;
}

/**
 * Generate points from a custom image/logo (future feature)
 */
export function generateLogoPoints(
  _count: number,
  _imageData?: ImageData
): Float32Array {
  // Placeholder - would analyze image and create points
  return generateSpherePoints(_count);
}

// Essential new shapes - Improved procedural generators for better recognition
export function generateBookPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.7) {
      // Book cover (rectangular with rounded spine)
      const coverT = t / 0.7;
      const angle = coverT * Math.PI * 2;
      const isSpine = Math.abs(coverT - 0.5) < 0.1;
      
      if (isSpine) {
        // Spine area - vertical curve
        const spineY = (Math.random() - 0.5) * 1.2;
        const spineX = -0.4 + (Math.random() - 0.5) * 0.15;
        positions[i * 3] = spineX;
        positions[i * 3 + 1] = spineY;
      } else {
        // Cover pages - flat rectangles
        const x = (coverT < 0.5 ? -0.6 : 0.6) + (Math.random() - 0.5) * 0.2;
        const y = (Math.random() - 0.5) * 1.0;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      }
    } else {
      // Pages (center area)
      const pageT = (t - 0.7) / 0.3;
      const x = (Math.random() - 0.5) * 0.3;
      const y = (Math.random() - 0.5) * 1.0;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
  }
  
  return positions;
}

export function generateClockPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.7) {
      // Clock face (circle)
      const angle = (t / 0.7) * Math.PI * 2;
      const radius = 0.75 + Math.random() * 0.1;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
    } else if (t < 0.85) {
      // Hour hand (pointing to 12)
      const handT = (t - 0.7) / 0.15;
      positions[i * 3] = (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 1] = 0.1 + handT * 0.4;
    } else {
      // Minute hand (pointing to 3)
      const handT = (t - 0.85) / 0.15;
      positions[i * 3] = 0.1 + handT * 0.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

export function generateWarningPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.7) {
      // Triangle outline
      const triT = t / 0.7;
      let x: number, y: number;
      
      if (triT < 0.33) {
        // Top to right
        const segT = triT / 0.33;
        x = segT * 0.7;
        y = -0.9 + segT * 1.1;
      } else if (triT < 0.67) {
        // Right to left
        const segT = (triT - 0.33) / 0.34;
        x = 0.7 - segT * 1.4;
        y = 0.2 + segT * 0.6;
      } else {
        // Left to top
        const segT = (triT - 0.67) / 0.33;
        x = -0.7 + segT * 0.7;
        y = 0.8 - segT * 1.7;
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
    } else if (t < 0.9) {
      // Exclamation mark - vertical line
      const exT = (t - 0.7) / 0.2;
      positions[i * 3] = (Math.random() - 0.5) * 0.08;
      positions[i * 3 + 1] = -0.3 + exT * 0.4;
    } else {
      // Exclamation dot
      const angle = (t - 0.9) / 0.1 * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * 0.1;
      positions[i * 3 + 1] = 0.3 + Math.sin(angle) * 0.1;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  
  return positions;
}

export function generateQuestionPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.5) {
      // Question mark curve (top loop)
      const curveT = t / 0.5;
      const angle = curveT * Math.PI * 1.5;
      const radius = 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.3 + Math.sin(angle) * radius;
    } else if (t < 0.8) {
      // Vertical line
      const lineT = (t - 0.5) / 0.3;
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = 0.1 + lineT * 0.5;
    } else {
      // Dot at bottom
      const angle = (t - 0.8) / 0.2 * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * 0.08;
      positions[i * 3 + 1] = 0.7 + Math.sin(angle) * 0.08;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

export function generateLoadingPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.5) {
      // Top half (hourglass)
      const topT = t / 0.5;
      const angle = topT * Math.PI * 2;
      const radius = 0.3 - topT * 0.2; // Tapering
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.3 - topT * 0.6;
    } else {
      // Bottom half (hourglass)
      const botT = (t - 0.5) / 0.5;
      const angle = botT * Math.PI * 2;
      const radius = 0.1 + botT * 0.2; // Expanding
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.3 + botT * 0.6;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

export function generateCalendarPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.3) {
      // Top binding (spiral)
      const bindT = t / 0.3;
      const angle = bindT * Math.PI * 4;
      positions[i * 3] = Math.cos(angle) * 0.15;
      positions[i * 3 + 1] = 0.7 + Math.sin(angle) * 0.1;
    } else if (t < 0.7) {
      // Calendar page (rectangle with grid)
      const pageT = (t - 0.3) / 0.4;
      const x = (Math.random() - 0.5) * 0.8;
      const y = 0.3 - pageT * 0.6;
      
      // Add grid lines
      if (Math.abs(x) < 0.05 || Math.abs(y + 0.3) < 0.05) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      } else {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      }
    } else {
      // Bottom edge
      const edgeT = (t - 0.7) / 0.3;
      positions[i * 3] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = -0.3 - edgeT * 0.1;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  
  return positions;
}

export function generateSearchPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.6) {
      // Magnifying glass circle
      const angle = (t / 0.6) * Math.PI * 2;
      const radius = 0.6 + Math.random() * 0.1;
      positions[i * 3] = -0.2 + Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.2 + Math.sin(angle) * radius;
    } else {
      // Handle
      const handleT = (t - 0.6) / 0.4;
      const angle = Math.PI / 4 + handleT * 0.3;
      const length = 0.3 + handleT * 0.4;
      positions[i * 3] = 0.4 + Math.cos(angle) * length;
      positions[i * 3 + 1] = 0.4 + Math.sin(angle) * length;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

export function generatePhonePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.7) {
      // Phone body (rounded rectangle)
      const bodyT = t / 0.7;
      const angle = bodyT * Math.PI * 2;
      const isCorner = Math.abs(Math.cos(angle)) > 0.7 || Math.abs(Math.sin(angle)) > 0.7;
      
      if (isCorner) {
        // Rounded corners
        const cornerAngle = Math.floor(bodyT * 4) * Math.PI / 2;
        positions[i * 3] = Math.cos(cornerAngle) * 0.4;
        positions[i * 3 + 1] = Math.sin(cornerAngle) * 0.7;
      } else {
        // Straight edges
        const x = Math.abs(Math.cos(angle)) > 0.5 ? Math.sign(Math.cos(angle)) * 0.4 : (Math.random() - 0.5) * 0.8;
        const y = Math.abs(Math.sin(angle)) > 0.5 ? Math.sign(Math.sin(angle)) * 0.7 : (Math.random() - 0.5) * 1.4;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      }
    } else {
      // Handset curve
      const handsetT = (t - 0.7) / 0.3;
      const angle = Math.PI + handsetT * Math.PI;
      positions[i * 3] = Math.cos(angle) * 0.3;
      positions[i * 3 + 1] = 0.8 + Math.sin(angle) * 0.2;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

export function generateLocationPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    if (t < 0.4) {
      // Pin head (circle)
      const angle = (t / 0.4) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.1;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.5 + Math.sin(angle) * radius;
    } else if (t < 0.7) {
      // Pin body (triangle/drop shape)
      const bodyT = (t - 0.4) / 0.3;
      const angle = bodyT * Math.PI * 2;
      const radius = 0.3 - bodyT * 0.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.2 + bodyT * 0.7;
    } else {
      // Pin point
      const pointT = (t - 0.7) / 0.3;
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = 0.5 + pointT * 0.3;
    }
    
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  return positions;
}

// Celebration shapes
export function generateFireworksPoints(count: number): Float32Array {
  return generateFromSVGPath('fireworks', count, 0.3);
}

export function generatePartyPoints(count: number): Float32Array {
  return generateFromSVGPath('party', count, 0.25);
}

export function generateConfettiPoints(count: number): Float32Array {
  return generateFromSVGPath('confetti', count, 0.3);
}

export function generateTrophyPoints(count: number): Float32Array {
  return generateFromSVGPath('trophy', count, 0.2);
}

export function generateExcitedPoints(count: number): Float32Array {
  return generateFromSVGPath('excited', count, 0.3);
}

// Additional shapes
export function generateThinkingPoints(count: number): Float32Array {
  return generateFromSVGPath('thinking', count, 0.2);
}

export function generateConfusedPoints(count: number): Float32Array {
  return generateFromSVGPath('confused', count, 0.2);
}

export function generateErrorPoints(count: number): Float32Array {
  return generateFromSVGPath('error', count, 0.15);
}

export function generateSpeechPoints(count: number): Float32Array {
  return generateFromSVGPath('speech', count, 0.2);
}

export function generateDocumentPoints(count: number): Float32Array {
  return generateFromSVGPath('document', count, 0.15);
}

export function generateCalculatorPoints(count: number): Float32Array {
  return generateFromSVGPath('calculator', count, 0.2);
}

export function generateBellPoints(count: number): Float32Array {
  return generateFromSVGPath('bell', count, 0.2);
}

export function generateGraduationPoints(count: number): Float32Array {
  return generateFromSVGPath('graduation', count, 0.2);
}

/**
 * Convert SVG path to particle distribution
 * Distributes particles along path outlines with proper density
 */
export function generateFromSVGPath(
  emojiName: string,
  count: number,
  depthVariation: number = 0.2
): Float32Array {
  const emojiRef = getEmojiReference(emojiName);
  if (!emojiRef) {
    console.warn(`[Shapes] No emoji reference found for: ${emojiName}`);
    return generateSpherePoints(count);
  }

  const positions = new Float32Array(count * 3);
  const pathPoints: number[][] = [];
  const featurePoints: number[][] = [];
  
  // Collect all path points
  emojiRef.svgPaths.forEach((path) => {
    if (path.type === 'feature' || path.type === 'detail') {
      featurePoints.push(...path.points);
    } else {
      pathPoints.push(...path.points);
    }
  });

  // Calculate total path length for distribution
  let totalLength = 0;
  const pathSegments: Array<{ start: number[]; end: number[]; length: number }> = [];
  
  emojiRef.svgPaths.forEach((path) => {
    for (let i = 0; i < path.points.length - 1; i++) {
      const start = path.points[i];
      const end = path.points[i + 1];
      const length = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      totalLength += length;
      pathSegments.push({ start, end, length });
    }
    if (path.closed && path.points.length > 0) {
      const start = path.points[path.points.length - 1];
      const end = path.points[0];
      const length = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      totalLength += length;
      pathSegments.push({ start, end, length });
    }
  });

  // Distribute particles along paths
  const densityMultiplier = emojiRef.particleDensity || 1.0;
  const featureDensity = densityMultiplier * 2.0; // Features get 2x density
  const baseParticleCount = Math.floor(count * 0.7);
  const featureParticleCount = count - baseParticleCount;

  let particleIndex = 0;

  // Distribute base particles along outline paths
  if (pathSegments.length > 0 && baseParticleCount > 0) {
    let currentLength = 0;
    const targetSpacing = totalLength / baseParticleCount;

    for (let i = 0; i < baseParticleCount && particleIndex < count; i++) {
      const targetLength = i * targetSpacing;
      
      // Find segment containing target length
      let accumulatedLength = 0;
      for (const segment of pathSegments) {
        if (accumulatedLength + segment.length >= targetLength) {
          const t = (targetLength - accumulatedLength) / segment.length;
          const x = segment.start[0] + (segment.end[0] - segment.start[0]) * t;
          const y = segment.start[1] + (segment.end[1] - segment.start[1]) * t;
          
          // Add depth variation
          const z = (Math.random() - 0.5) * depthVariation;
          
          positions[particleIndex * 3] = x;
          positions[particleIndex * 3 + 1] = y;
          positions[particleIndex * 3 + 2] = z;
          
          particleIndex++;
          break;
        }
        accumulatedLength += segment.length;
      }
    }
  }

  // Fill remaining with feature points and random distribution
  while (particleIndex < count) {
    let x: number, y: number;
    
    if (featurePoints.length > 0 && Math.random() < 0.3) {
      // Use feature point
      const feature = featurePoints[Math.floor(Math.random() * featurePoints.length)];
      x = feature[0] + (Math.random() - 0.5) * 0.1;
      y = feature[1] + (Math.random() - 0.5) * 0.1;
    } else if (pathPoints.length > 0) {
      // Use path point with slight variation
      const point = pathPoints[Math.floor(Math.random() * pathPoints.length)];
      x = point[0] + (Math.random() - 0.5) * 0.15;
      y = point[1] + (Math.random() - 0.5) * 0.15;
    } else {
      // Fallback to random in bounds
      x = (Math.random() - 0.5) * 1.6;
      y = (Math.random() - 0.5) * 1.6;
    }
    
    const z = (Math.random() - 0.5) * depthVariation;
    
    positions[particleIndex * 3] = x;
    positions[particleIndex * 3 + 1] = y;
    positions[particleIndex * 3 + 2] = z;
    
    particleIndex++;
  }

  return positions;
}

