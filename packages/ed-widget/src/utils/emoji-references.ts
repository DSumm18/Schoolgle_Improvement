/**
 * Emoji Reference Library
 * SVG paths and color palettes for emoji-accurate particle shapes
 * All coordinates normalized to -1 to 1 range
 */

export interface EmojiReference {
  name: string;
  svgPaths: PathData[];
  colors: ColorPalette;
  featurePoints?: FeaturePoint[];
  particleDensity?: number; // Multiplier for feature areas
}

export interface PathData {
  type: 'outline' | 'feature' | 'detail';
  points: number[][]; // [x, y] pairs, normalized -1 to 1
  closed?: boolean;
}

export interface ColorPalette {
  primary: [number, number, number]; // RGB 0-1
  secondary?: [number, number, number];
  accent?: [number, number, number];
  background?: [number, number, number];
}

export interface FeaturePoint {
  type: 'eye' | 'hand' | 'detail' | 'highlight';
  position: [number, number];
  size: number;
}

/**
 * Emoji reference data
 */
export const EMOJI_REFERENCES: Record<string, EmojiReference> = {
  // Core shapes
  pencil: {
    name: 'pencil',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.3, -0.8], [-0.25, -0.8], [-0.2, -0.75], [-0.15, -0.7],
          [-0.1, -0.65], [-0.05, -0.6], [0, -0.55], [0.05, -0.5],
          [0.1, -0.45], [0.15, -0.4], [0.2, -0.35], [0.25, -0.3],
          [0.3, -0.25], [0.3, 0.4], [0.25, 0.5], [0.2, 0.6],
          [0.15, 0.7], [0.1, 0.75], [0.05, 0.8], [0, 0.85],
          [-0.05, 0.8], [-0.1, 0.75], [-0.15, 0.7], [-0.2, 0.6],
          [-0.25, 0.5], [-0.3, 0.4], [-0.3, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.25, 0.6], [-0.2, 0.65], [-0.15, 0.7], [-0.1, 0.75],
          [-0.05, 0.8], [0, 0.85], [0.05, 0.8], [0.1, 0.75],
          [0.15, 0.7], [0.2, 0.65], [0.25, 0.6]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow body
      secondary: [1.0, 0.75, 0.8], // Pink eraser
      accent: [0.2, 0.2, 0.2] // Gray tip
    }
  },

  lightbulb: {
    name: 'lightbulb',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 0.6], [0.15, 0.55], [0.25, 0.45], [0.3, 0.3],
          [0.3, 0.1], [0.25, -0.1], [0.15, -0.25], [0, -0.3],
          [-0.15, -0.25], [-0.25, -0.1], [-0.3, 0.1], [-0.3, 0.3],
          [-0.25, 0.45], [-0.15, 0.55], [0, 0.6]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.15, -0.3], [-0.1, -0.4], [-0.05, -0.45], [0, -0.5],
          [0.05, -0.45], [0.1, -0.4], [0.15, -0.3], [0.15, -0.5],
          [0.1, -0.55], [0.05, -0.6], [0, -0.65], [-0.05, -0.6],
          [-0.1, -0.55], [-0.15, -0.5], [-0.15, -0.3]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow bulb
      secondary: [0.5, 0.5, 0.5], // Gray base
      accent: [1.0, 1.0, 0.9] // Light glow
    }
  },

  heart: {
    name: 'heart',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -0.3], [0.2, -0.5], [0.4, -0.4], [0.5, -0.2],
          [0.5, 0], [0.4, 0.3], [0.2, 0.6], [0, 0.8],
          [-0.2, 0.6], [-0.4, 0.3], [-0.5, 0], [-0.5, -0.2],
          [-0.4, -0.4], [-0.2, -0.5], [0, -0.3]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.3], // Red
      accent: [1.0, 0.4, 0.5] // Lighter red
    }
  },

  star: {
    name: 'star',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -1.0], [0.2, -0.3], [0.95, -0.3], [0.3, 0.1],
          [0.6, 0.8], [0, 0.4], [-0.6, 0.8], [-0.3, 0.1],
          [-0.95, -0.3], [-0.2, -0.3], [0, -1.0]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.84, 0.0], // Gold
      accent: [1.0, 0.9, 0.3] // Bright yellow
    }
  },

  thumbsup: {
    name: 'thumbsup',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.3, 0.6], [-0.2, 0.7], [-0.1, 0.75], [0, 0.8],
          [0.1, 0.75], [0.2, 0.7], [0.3, 0.6], [0.35, 0.5],
          [0.4, 0.4], [0.4, 0.2], [0.35, 0.1], [0.3, 0],
          [0.25, -0.1], [0.2, -0.15], [0.15, -0.2], [0.1, -0.25],
          [0, -0.3], [-0.1, -0.25], [-0.15, -0.2], [-0.2, -0.15],
          [-0.25, -0.1], [-0.3, 0], [-0.35, 0.1], [-0.4, 0.2],
          [-0.4, 0.4], [-0.35, 0.5], [-0.3, 0.6]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.3, 0.6], [0.35, 0.5], [0.4, 0.4], [0.4, 0.2],
          [0.35, 0.1], [0.3, 0]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [0.2, 0.8, 0.2], // Green
      secondary: [0.9, 0.7, 0.5] // Skin tone
    },
    featurePoints: [
      { type: 'hand', position: [0.35, 0.3], size: 0.15 }
    ],
    particleDensity: 1.5
  },

  checkmark: {
    name: 'checkmark',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.6, -0.2], [-0.4, 0], [-0.2, 0.2], [0, 0.4],
          [0.2, 0.6], [0.4, 0.8], [0.6, 1.0]
        ],
        closed: false
      },
      {
        type: 'outline',
        points: [
          [-0.6, 0.2], [-0.4, 0], [-0.2, -0.2]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [0.2, 0.8, 0.2], // Green
      accent: [0.3, 0.9, 0.3] // Bright green
    }
  },

  smiley: {
    name: 'smiley',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 1.0], [0.3, 0.95], [0.55, 0.8], [0.75, 0.55],
          [0.9, 0.3], [0.95, 0], [0.9, -0.3], [0.75, -0.55],
          [0.55, -0.8], [0.3, -0.95], [0, -1.0], [-0.3, -0.95],
          [-0.55, -0.8], [-0.75, -0.55], [-0.9, -0.3], [-0.95, 0],
          [-0.9, 0.3], [-0.75, 0.55], [-0.55, 0.8], [-0.3, 0.95],
          [0, 1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, 0.2], [-0.25, 0.25], [-0.2, 0.2], [-0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.2, 0.2], [0.25, 0.25], [0.3, 0.2], [0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.4, -0.2], [-0.2, -0.4], [0, -0.5], [0.2, -0.4],
          [0.4, -0.2]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow
      secondary: [0.2, 0.2, 0.2], // Black eyes/smile
      accent: [1.0, 0.9, 0.3] // Bright yellow
    },
    featurePoints: [
      { type: 'eye', position: [-0.25, 0.2], size: 0.1 },
      { type: 'eye', position: [0.25, 0.2], size: 0.1 }
    ],
    particleDensity: 2.0
  },

  // Essential new shapes
  book: {
    name: 'book',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.8, -0.6], [-0.4, -0.8], [0, -0.9], [0.4, -0.8],
          [0.8, -0.6], [0.8, 0.6], [0.4, 0.8], [0, 0.9],
          [-0.4, 0.8], [-0.8, 0.6], [-0.8, -0.6]
        ],
        closed: true
      },
      {
        type: 'detail',
        points: [
          [0, -0.9], [0, 0.9]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [0.6, 0.4, 0.2], // Brown
      secondary: [0.9, 0.85, 0.8], // Beige pages
      accent: [0.5, 0.3, 0.1] // Dark brown
    }
  },

  clock: {
    name: 'clock',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 1.0], [0.3, 0.95], [0.55, 0.8], [0.75, 0.55],
          [0.9, 0.3], [0.95, 0], [0.9, -0.3], [0.75, -0.55],
          [0.55, -0.8], [0.3, -0.95], [0, -1.0], [-0.3, -0.95],
          [-0.55, -0.8], [-0.75, -0.55], [-0.9, -0.3], [-0.95, 0],
          [-0.9, 0.3], [-0.75, 0.55], [-0.55, 0.8], [-0.3, 0.95],
          [0, 1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0, 0], [0, -0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0, 0], [0.3, 0]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 1.0, 1.0], // White
      secondary: [1.0, 0.85, 0.0], // Yellow
      accent: [0.2, 0.2, 0.2] // Black hands
    },
    featurePoints: [
      { type: 'detail', position: [0, 0], size: 0.1 }
    ]
  },

  warning: {
    name: 'warning',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -1.0], [0.6, 0.4], [0.3, 0.8], [0, 0.9],
          [-0.3, 0.8], [-0.6, 0.4], [0, -1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0, -0.3], [0, 0.1]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [-0.05, 0.3], [0.05, 0.3], [0.05, 0.4], [-0.05, 0.4],
          [-0.05, 0.3]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.65, 0.0], // Orange/Yellow
      secondary: [1.0, 0.2, 0.2], // Red
      accent: [0.2, 0.2, 0.2] // Black exclamation
    }
  },

  question: {
    name: 'question',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.2, -0.8], [0, -1.0], [0.3, -0.9], [0.5, -0.7],
          [0.6, -0.4], [0.5, -0.1], [0.3, 0.1], [0, 0.2],
          [-0.2, 0.3], [-0.3, 0.5], [-0.2, 0.7], [0, 0.8],
          [0.2, 0.7], [0.3, 0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0, 0.9], [0, 1.0]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 1.0, 1.0], // White
      secondary: [1.0, 0.85, 0.0], // Yellow
      accent: [0.2, 0.2, 0.2] // Black
    }
  },

  loading: {
    name: 'loading',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.3, -0.8], [-0.2, -0.9], [0, -1.0], [0.2, -0.9],
          [0.3, -0.8], [0.3, -0.6], [0.2, -0.5], [0, -0.4],
          [-0.2, -0.5], [-0.3, -0.6], [-0.3, -0.8]
        ],
        closed: true
      },
      {
        type: 'outline',
        points: [
          [-0.3, 0.8], [-0.2, 0.9], [0, 1.0], [0.2, 0.9],
          [0.3, 0.8], [0.3, 0.6], [0.2, 0.5], [0, 0.4],
          [-0.2, 0.5], [-0.3, 0.6], [-0.3, 0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, -0.7], [-0.3, 0.7]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [0.2, 0.4, 0.9], // Blue
      secondary: [1.0, 1.0, 1.0], // White
      accent: [0.1, 0.2, 0.7] // Dark blue
    }
  },

  calendar: {
    name: 'calendar',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.8, -0.6], [0.8, -0.6], [0.8, 0.8], [-0.8, 0.8],
          [-0.8, -0.6]
        ],
        closed: true
      },
      {
        type: 'detail',
        points: [
          [-0.8, -0.2], [0.8, -0.2]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.8, 0.2], [0.8, 0.2]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.8, 0.6], [0.8, 0.6]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.4, -0.6], [-0.4, 0.8]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [0, -0.6], [0, 0.8]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [0.4, -0.6], [0.4, 0.8]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 1.0, 1.0], // White
      secondary: [1.0, 0.2, 0.2], // Red header
      accent: [0.2, 0.2, 0.2] // Black grid
    }
  },

  search: {
    name: 'search',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.3, -0.3], [-0.5, -0.1], [-0.6, 0.1], [-0.6, 0.3],
          [-0.5, 0.5], [-0.3, 0.6], [-0.1, 0.6], [0.1, 0.5],
          [0.3, 0.3], [0.4, 0.1], [0.4, -0.1], [0.3, -0.3],
          [0.1, -0.4], [-0.1, -0.4], [-0.3, -0.3]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.4, 0.3], [0.6, 0.5], [0.7, 0.6]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [0.2, 0.4, 0.9], // Blue
      secondary: [1.0, 1.0, 1.0], // White
      accent: [0.1, 0.2, 0.7] // Dark blue
    }
  },

  phone: {
    name: 'phone',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.4, -0.8], [0.4, -0.8], [0.5, -0.7], [0.6, -0.5],
          [0.6, 0.5], [0.5, 0.7], [0.4, 0.8], [-0.4, 0.8],
          [-0.5, 0.7], [-0.6, 0.5], [-0.6, -0.5], [-0.5, -0.7],
          [-0.4, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.2, -0.6], [0.2, -0.6], [0.2, -0.5], [-0.2, -0.5],
          [-0.2, -0.6]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [0.2, 0.2, 0.2], // Black
      secondary: [0.5, 0.5, 0.5], // Gray
      accent: [0.1, 0.1, 0.1] // Dark gray
    }
  },

  location: {
    name: 'location',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -1.0], [0.3, -0.7], [0.5, -0.3], [0.6, 0.1],
          [0.5, 0.4], [0.3, 0.6], [0, 0.7], [-0.3, 0.6],
          [-0.5, 0.4], [-0.6, 0.1], [-0.5, -0.3], [-0.3, -0.7],
          [0, -1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0, 0], [0, 0.1], [0.1, 0], [0, -0.1],
          [-0.1, 0], [0, 0]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.2], // Red
      secondary: [1.0, 1.0, 1.0], // White center
      accent: [0.8, 0.1, 0.1] // Dark red
    },
    featurePoints: [
      { type: 'detail', position: [0, 0], size: 0.15 }
    ]
  },

  // Celebration shapes
  fireworks: {
    name: 'fireworks',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 0], [0.2, 0.3], [0.4, 0.5], [0.3, 0.7],
          [0.1, 0.8], [-0.1, 0.7], [-0.3, 0.5], [-0.2, 0.3],
          [0, 0]
        ],
        closed: false
      },
      {
        type: 'outline',
        points: [
          [0, 0], [0.3, 0.2], [0.5, 0.4], [0.7, 0.3],
          [0.8, 0.1], [0.7, -0.1], [0.5, -0.3], [0.3, -0.2],
          [0, 0]
        ],
        closed: false
      },
      {
        type: 'outline',
        points: [
          [0, 0], [-0.3, 0.2], [-0.5, 0.4], [-0.7, 0.3],
          [-0.8, 0.1], [-0.7, -0.1], [-0.5, -0.3], [-0.3, -0.2],
          [0, 0]
        ],
        closed: false
      },
      {
        type: 'outline',
        points: [
          [0, 0], [0.2, -0.3], [0.4, -0.5], [0.3, -0.7],
          [0.1, -0.8], [-0.1, -0.7], [-0.3, -0.5], [-0.2, -0.3],
          [0, 0]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.2], // Red
      secondary: [1.0, 0.85, 0.0], // Yellow
      accent: [0.2, 0.6, 1.0] // Blue
    }
  },

  party: {
    name: 'party',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.6, -0.8], [-0.4, -0.9], [-0.2, -0.95], [0, -1.0],
          [0.2, -0.95], [0.4, -0.9], [0.6, -0.8], [0.7, -0.6],
          [0.8, -0.4], [0.8, -0.2], [0.7, 0], [0.6, 0.2],
          [0.4, 0.3], [0.2, 0.4], [0, 0.5], [-0.2, 0.4],
          [-0.4, 0.3], [-0.6, 0.2], [-0.7, 0], [-0.8, -0.2],
          [-0.8, -0.4], [-0.7, -0.6], [-0.6, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.3, 0.1], [0.5, 0.3], [0.7, 0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [-0.3, 0.1], [-0.5, 0.3], [-0.7, 0.5]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.2], // Red
      secondary: [1.0, 0.85, 0.0], // Yellow
      accent: [0.2, 0.6, 1.0] // Blue
    }
  },

  confetti: {
    name: 'confetti',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.8, -0.8], [-0.6, -0.9], [-0.4, -0.8], [-0.2, -0.6],
          [0, -0.4], [0.2, -0.2], [0.4, 0], [0.6, 0.2],
          [0.8, 0.4], [0.9, 0.6], [0.8, 0.8], [0.6, 0.9],
          [0.4, 0.8], [0.2, 0.6], [0, 0.4], [-0.2, 0.2],
          [-0.4, 0], [-0.6, -0.2], [-0.8, -0.4], [-0.9, -0.6],
          [-0.8, -0.8]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.2], // Red
      secondary: [1.0, 0.85, 0.0], // Yellow
      accent: [0.2, 0.6, 1.0] // Blue
    }
  },

  trophy: {
    name: 'trophy',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.4, -0.8], [-0.3, -0.9], [-0.2, -0.95], [0, -1.0],
          [0.2, -0.95], [0.3, -0.9], [0.4, -0.8], [0.5, -0.6],
          [0.6, -0.3], [0.6, 0.1], [0.5, 0.4], [0.4, 0.6],
          [0.3, 0.7], [0.2, 0.75], [0, 0.8], [-0.2, 0.75],
          [-0.3, 0.7], [-0.4, 0.6], [-0.5, 0.4], [-0.6, 0.1],
          [-0.6, -0.3], [-0.5, -0.6], [-0.4, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, 0.8], [-0.2, 0.9], [0, 0.95], [0.2, 0.9],
          [0.3, 0.8], [0.3, 0.85], [0.2, 0.9], [0, 0.92],
          [-0.2, 0.9], [-0.3, 0.85], [-0.3, 0.8]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.84, 0.0], // Gold
      secondary: [1.0, 0.9, 0.3], // Bright gold
      accent: [0.8, 0.6, 0.0] // Dark gold
    }
  },

  excited: {
    name: 'excited',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -1.0], [0.2, -0.8], [0.4, -0.6], [0.5, -0.3],
          [0.4, 0], [0.2, 0.3], [0, 0.5], [-0.2, 0.3],
          [-0.4, 0], [-0.5, -0.3], [-0.4, -0.6], [-0.2, -0.8],
          [0, -1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0, 0], [0.3, 0.3], [0.5, 0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0, 0], [-0.3, 0.3], [-0.5, 0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0, 0], [0.3, -0.3], [0.5, -0.5]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0, 0], [-0.3, -0.3], [-0.5, -0.5]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow
      secondary: [1.0, 1.0, 1.0], // White
      accent: [1.0, 0.9, 0.3] // Bright yellow
    }
  },

  // Additional shapes
  thinking: {
    name: 'thinking',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 1.0], [0.3, 0.95], [0.55, 0.8], [0.75, 0.55],
          [0.9, 0.3], [0.95, 0], [0.9, -0.3], [0.75, -0.55],
          [0.55, -0.8], [0.3, -0.95], [0, -1.0], [-0.3, -0.95],
          [-0.55, -0.8], [-0.75, -0.55], [-0.9, -0.3], [-0.95, 0],
          [-0.9, 0.3], [-0.75, 0.55], [-0.55, 0.8], [-0.3, 0.95],
          [0, 1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, 0.2], [-0.25, 0.25], [-0.2, 0.2], [-0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.2, 0.2], [0.25, 0.25], [0.3, 0.2], [0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.2, -0.3], [-0.1, -0.4], [0, -0.45], [0.1, -0.4],
          [0.2, -0.3]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0.6, 0.4], [0.7, 0.5], [0.8, 0.6], [0.85, 0.7],
          [0.8, 0.8], [0.7, 0.85], [0.6, 0.8], [0.55, 0.7],
          [0.6, 0.6], [0.65, 0.5], [0.6, 0.4]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow
      secondary: [0.2, 0.2, 0.2], // Black
      accent: [1.0, 0.9, 0.3] // Bright yellow
    }
  },

  confused: {
    name: 'confused',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, 1.0], [0.3, 0.95], [0.55, 0.8], [0.75, 0.55],
          [0.9, 0.3], [0.95, 0], [0.9, -0.3], [0.75, -0.55],
          [0.55, -0.8], [0.3, -0.95], [0, -1.0], [-0.3, -0.95],
          [-0.55, -0.8], [-0.75, -0.55], [-0.9, -0.3], [-0.95, 0],
          [-0.9, 0.3], [-0.75, 0.55], [-0.55, 0.8], [-0.3, 0.95],
          [0, 1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, 0.2], [-0.25, 0.25], [-0.2, 0.2], [-0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.2, 0.2], [0.25, 0.25], [0.3, 0.2], [0.25, 0.15]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.3, -0.2], [-0.2, -0.3], [-0.1, -0.35], [0, -0.4],
          [0.1, -0.35], [0.2, -0.3], [0.3, -0.2]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.85, 0.0], // Yellow
      secondary: [0.2, 0.2, 0.2], // Black
      accent: [1.0, 0.9, 0.3] // Bright yellow
    }
  },

  error: {
    name: 'error',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.7, -0.7], [-0.5, -0.9], [-0.2, -1.0], [0.2, -1.0],
          [0.5, -0.9], [0.7, -0.7], [0.9, -0.5], [1.0, -0.2],
          [1.0, 0.2], [0.9, 0.5], [0.7, 0.7], [0.5, 0.9],
          [0.2, 1.0], [-0.2, 1.0], [-0.5, 0.9], [-0.7, 0.7],
          [-0.9, 0.5], [-1.0, 0.2], [-1.0, -0.2], [-0.9, -0.5],
          [-0.7, -0.7]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.4, -0.4], [0.4, 0.4]
        ],
        closed: false
      },
      {
        type: 'feature',
        points: [
          [0.4, -0.4], [-0.4, 0.4]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 0.2, 0.2], // Red
      secondary: [0.8, 0.1, 0.1], // Dark red
      accent: [1.0, 0.4, 0.4] // Light red
    }
  },

  speech: {
    name: 'speech',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.6, -0.8], [0.6, -0.8], [0.8, -0.6], [0.8, 0.4],
          [0.6, 0.6], [0.4, 0.7], [0.2, 0.8], [0, 0.9],
          [-0.2, 0.8], [-0.4, 0.7], [-0.6, 0.6], [-0.8, 0.4],
          [-0.8, -0.6], [-0.6, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0, 0.9], [0.2, 1.0], [0.1, 0.95]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 1.0, 1.0], // White
      secondary: [0.2, 0.4, 0.9], // Blue
      accent: [0.9, 0.95, 1.0] // Light blue
    }
  },

  document: {
    name: 'document',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.6, -0.9], [0.6, -0.9], [0.7, -0.8], [0.7, 0.8],
          [0.6, 0.9], [-0.6, 0.9], [-0.7, 0.8], [-0.7, -0.8],
          [-0.6, -0.9]
        ],
        closed: true
      },
      {
        type: 'detail',
        points: [
          [-0.5, -0.6], [0.5, -0.6]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.5, -0.3], [0.5, -0.3]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.5, 0], [0.5, 0]
        ],
        closed: false
      },
      {
        type: 'detail',
        points: [
          [-0.5, 0.3], [0.3, 0.3]
        ],
        closed: false
      }
    ],
    colors: {
      primary: [1.0, 1.0, 1.0], // White
      secondary: [0.9, 0.9, 0.9], // Light gray
      accent: [0.2, 0.2, 0.2] // Black text
    }
  },

  calculator: {
    name: 'calculator',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.7, -0.8], [0.7, -0.8], [0.8, -0.7], [0.8, 0.7],
          [0.7, 0.8], [-0.7, 0.8], [-0.8, 0.7], [-0.8, -0.7],
          [-0.7, -0.8]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.6, -0.6], [0.6, -0.6], [0.6, -0.5], [-0.6, -0.5],
          [-0.6, -0.6]
        ],
        closed: true
      },
      {
        type: 'detail',
        points: [
          [-0.5, -0.2], [-0.2, -0.2], [-0.2, 0], [-0.5, 0],
          [-0.5, -0.2]
        ],
        closed: true
      },
      {
        type: 'detail',
        points: [
          [0.2, -0.2], [0.5, -0.2], [0.5, 0], [0.2, 0],
          [0.2, -0.2]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [0.5, 0.5, 0.5], // Gray
      secondary: [0.2, 0.2, 0.2], // Black
      accent: [0.7, 0.7, 0.7] // Light gray
    }
  },

  bell: {
    name: 'bell',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [0, -1.0], [0.2, -0.9], [0.4, -0.7], [0.5, -0.4],
          [0.5, 0.1], [0.4, 0.4], [0.3, 0.6], [0.2, 0.7],
          [0, 0.8], [-0.2, 0.7], [-0.3, 0.6], [-0.4, 0.4],
          [-0.5, 0.1], [-0.5, -0.4], [-0.4, -0.7], [-0.2, -0.9],
          [0, -1.0]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [-0.1, 0.8], [0.1, 0.8], [0.15, 0.85], [0.1, 0.9],
          [-0.1, 0.9], [-0.15, 0.85], [-0.1, 0.8]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [1.0, 0.84, 0.0], // Gold
      secondary: [1.0, 0.9, 0.3], // Bright gold
      accent: [0.8, 0.6, 0.0] // Dark gold
    }
  },

  graduation: {
    name: 'graduation',
    svgPaths: [
      {
        type: 'outline',
        points: [
          [-0.8, -0.2], [-0.6, -0.4], [-0.3, -0.5], [0, -0.6],
          [0.3, -0.5], [0.6, -0.4], [0.8, -0.2], [0.8, 0.2],
          [0.6, 0.4], [0.3, 0.5], [0, 0.6], [-0.3, 0.5],
          [-0.6, 0.4], [-0.8, 0.2], [-0.8, -0.2]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.8, -0.2], [0.9, -0.1], [1.0, 0], [0.9, 0.1],
          [0.8, 0.2], [0.7, 0.1], [0.6, 0], [0.7, -0.1],
          [0.8, -0.2]
        ],
        closed: true
      },
      {
        type: 'feature',
        points: [
          [0.4, 0.3], [0.5, 0.4], [0.6, 0.5], [0.5, 0.6],
          [0.4, 0.5], [0.3, 0.4], [0.4, 0.3]
        ],
        closed: true
      }
    ],
    colors: {
      primary: [0.2, 0.2, 0.2], // Black
      secondary: [0.4, 0.4, 0.4], // Dark gray
      accent: [1.0, 0.84, 0.0] // Gold tassel
    }
  }
};

/**
 * Get emoji reference by name
 */
export function getEmojiReference(name: string): EmojiReference | undefined {
  return EMOJI_REFERENCES[name];
}

/**
 * Get all available emoji names
 */
export function getAvailableEmojis(): string[] {
  return Object.keys(EMOJI_REFERENCES);
}

