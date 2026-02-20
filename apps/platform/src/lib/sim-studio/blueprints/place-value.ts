// ============================================================================
// PLACE VALUE BLUEPRINT
// Dienes blocks, number line, and partitioning visualization
// ============================================================================

import {
  BlueprintRenderer,
  SimState,
  CanvasConfig,
  InteractionEvent,
  getCanvasColors,
  clearCanvas,
  drawRoundedRect,
  drawText,
  drawGrid,
  announceToScreenReader,
} from '../runtime/blueprint-engine';

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOCK_SIZE = {
  hundreds: 100,
  tens: 40,
  ones: 15,
};

const BLOCK_COLORS = {
  hundreds: '#ef4444',
  tens: '#3b82f6',
  ones: '#22c55e',
};

// ============================================================================
// PLACE VALUE RENDERER
// ============================================================================

export class PlaceValueBlueprint implements BlueprintRenderer {
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(width: number = 800, height: number = 600) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  render = (ctx: CanvasRenderingContext2D, state: SimState, config: CanvasConfig): void => {
    const colors = getCanvasColors(state.accessibility);

    // Clear canvas
    clearCanvas(ctx, this.canvasWidth, this.canvasHeight, colors.background);

    // Draw based on mode
    if (state.mode === 'teach') {
      this.renderTeachMode(ctx, state, colors);
    } else if (state.mode === 'pupil') {
      this.renderPupilMode(ctx, state, colors);
    } else if (state.mode === 'evidence') {
      this.renderEvidenceMode(ctx, state, colors);
    }

    // Draw value display
    this.drawValueDisplay(ctx, state, colors);
  };

  private renderTeachMode(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    // Draw work area with grid
    drawGrid(
      ctx,
      50,
      100,
      this.canvasWidth - 100,
      this.canvasHeight - 250,
      20,
      colors.grid,
      1
    );

    // Draw blocks tray at bottom
    this.drawBlocksTray(ctx, state, colors);

    // Draw work area blocks
    this.drawWorkAreaBlocks(ctx, state, colors);

    // Draw number line
    this.drawNumberLine(ctx, state, colors);

    // Draw mode indicator
    drawText(
      ctx,
      '👨‍🏫 TEACH MODE',
      this.canvasWidth / 2,
      30,
      18,
      colors.text,
      'center'
    );
  }

  private renderPupilMode(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    // Draw simplified work area
    drawGrid(
      ctx,
      50,
      100,
      this.canvasWidth - 100,
      this.canvasHeight - 250,
      20,
      colors.grid,
      1
    );

    // Draw blocks tray
    this.drawBlocksTray(ctx, state, colors);

    // Draw work area blocks
    this.drawWorkAreaBlocks(ctx, state, colors);

    // Draw simplified number line
    this.drawNumberLine(ctx, state, colors);

    // Draw mode indicator
    drawText(
      ctx,
      '🎯 PUPIL MODE',
      this.canvasWidth / 2,
      30,
      18,
      colors.text,
      'center'
    );

    // Draw prompt for pupil
    if (state.value === 0) {
      drawText(
        ctx,
        'Drag blocks to make a number!',
        this.canvasWidth / 2,
        this.canvasHeight - 60,
        16,
        colors.highlight,
        'center'
      );
    }
  }

  private renderEvidenceMode(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    // Same as pupil mode but with additional evidence collection UI
    this.renderPupilMode(ctx, state, colors);

    // Draw evidence panel
    this.drawEvidencePanel(ctx, state, colors);

    // Draw mode indicator
    drawText(
      ctx,
      '📊 EVIDENCE MODE',
      this.canvasWidth / 2,
      30,
      18,
      colors.text,
      'center'
    );
  }

  private drawBlocksTray(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    const trayY = this.canvasHeight - 120;
    const trayHeight = 100;

    // Draw tray background
    drawRoundedRect(
      ctx,
      50,
      trayY,
      this.canvasWidth - 100,
      trayHeight,
      10,
      colors.background + 'cc',
      colors.grid
    );

    // Draw hundreds blocks
    for (let i = 0; i < 3; i++) {
      this.drawHundredsBlock(
        ctx,
        100 + i * (BLOCK_SIZE.hundreds + 20),
        trayY + 20,
        colors.hundreds
      );
    }

    // Draw tens blocks
    for (let i = 0; i < 5; i++) {
      this.drawTensBlock(
        ctx,
        100 + i * (BLOCK_SIZE.tens + 15),
        trayY + 20,
        colors.tens
      );
    }

    // Draw ones blocks
    for (let i = 0; i < 10; i++) {
      this.drawOnesBlock(
        ctx,
        100 + i * (BLOCK_SIZE.ones + 10),
        trayY + 70,
        colors.ones
      );
    }

    // Labels
    drawText(ctx, 'Hundreds', 100, trayY - 5, 12, colors.text, 'left', 'bottom');
    drawText(ctx, 'Tens', 100, trayY + 55, 12, colors.text, 'left', 'bottom');
    drawText(ctx, 'Ones', 100, trayY + 105, 12, colors.text, 'left', 'bottom');
  }

  private drawWorkAreaBlocks(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    // Draw hundreds blocks in work area
    for (let i = 0; i < state.hundreds; i++) {
      const x = 100 + (i % 5) * (BLOCK_SIZE.hundreds + 20);
      const y = 120 + Math.floor(i / 5) * (BLOCK_SIZE.hundreds + 20);
      this.drawHundredsBlock(ctx, x, y, colors.hundreds);
    }

    // Draw tens blocks in work area
    for (let i = 0; i < state.tens; i++) {
      const x = 100 + (i % 8) * (BLOCK_SIZE.tens + 15);
      const y = 280 + Math.floor(i / 8) * (BLOCK_SIZE.tens + 15);
      this.drawTensBlock(ctx, x, y, colors.tens);
    }

    // Draw ones blocks in work area
    for (let i = 0; i < state.ones; i++) {
      const x = 100 + (i % 15) * (BLOCK_SIZE.ones + 10);
      const y = 380 + Math.floor(i / 15) * (BLOCK_SIZE.ones + 10);
      this.drawOnesBlock(ctx, x, y, colors.ones);
    }
  }

  private drawHundredsBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) {
    const size = BLOCK_SIZE.hundreds;
    const unitSize = size / 10;

    // Draw 10x10 grid
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        drawRoundedRect(
          ctx,
          x + col * unitSize,
          y + row * unitSize,
          unitSize - 1,
          unitSize - 1,
          2,
          color,
          'rgba(0,0,0,0.1)'
        );
      }
    }
  }

  private drawTensBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const width = BLOCK_SIZE.tens;
    const height = BLOCK_SIZE.tens * 2.5;
    const unitSize = width / 10;

    // Draw 1x10 grid
    for (let i = 0; i < 10; i++) {
      drawRoundedRect(
        ctx,
        x + i * unitSize,
        y,
        unitSize - 1,
        height - 1,
        2,
        color,
        'rgba(0,0,0,0.1)'
      );
    }
  }

  private drawOnesBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const size = BLOCK_SIZE.ones;
    drawRoundedRect(ctx, x, y, size, size, 3, color, 'rgba(0,0,0,0.1)');
  }

  private drawNumberLine(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    const lineY = 80;
    const lineStart = 400;
    const lineEnd = this.canvasWidth - 50;
    const lineLength = lineEnd - lineStart;

    // Draw main line
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStart, lineY);
    ctx.lineTo(lineEnd, lineY);
    ctx.stroke();

    // Draw ticks and labels
    const maxValue = 500;
    const step = 50;

    for (let value = 0; value <= maxValue; value += step) {
      const x = lineStart + (value / maxValue) * lineLength;

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, lineY - 5);
      ctx.lineTo(x, lineY + 5);
      ctx.stroke();

      // Draw label
      drawText(ctx, value.toString(), x, lineY - 10, 12, colors.text, 'center', 'bottom');
    }

    // Draw current value marker
    if (state.value > 0 && state.value <= maxValue) {
      const markerX = lineStart + (state.value / maxValue) * lineLength;

      // Draw arrow
      ctx.fillStyle = colors.highlight;
      ctx.beginPath();
      ctx.moveTo(markerX, lineY - 15);
      ctx.lineTo(markerX - 8, lineY - 25);
      ctx.lineTo(markerX + 8, lineY - 25);
      ctx.closePath();
      ctx.fill();

      // Draw value label
      drawRoundedRect(
        ctx,
        markerX - 25,
        lineY - 50,
        50,
        25,
        5,
        colors.highlight,
        colors.text
      );
      drawText(ctx, state.value.toString(), markerX, lineY - 37, 14, colors.text, 'center');
    }
  }

  private drawValueDisplay(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    const displayX = this.canvasWidth - 120;
    const displayY = this.canvasHeight - 60;

    // Draw display box
    drawRoundedRect(
      ctx,
      displayX - 80,
      displayY - 20,
      160,
      40,
      10,
      colors.background + 'cc',
      colors.text
    );

    // Draw value
    drawText(
      ctx,
      state.value.toString(),
      displayX,
      displayY + 5,
      24,
      colors.text,
      'center'
    );

    // Draw partitioning
    const partitionText = `${state.hundreds}H + ${state.tens}T + ${state.ones}O`;
    drawText(
      ctx,
      partitionText,
      displayX,
      displayY + 35,
      14,
      colors.text,
      'center'
    );
  }

  private drawEvidencePanel(ctx: CanvasRenderingContext2D, state: SimState, colors: any) {
    const panelX = 50;
    const panelY = this.canvasHeight - 180;
    const panelWidth = 200;
    const panelHeight = 50;

    // Draw panel background
    drawRoundedRect(
      ctx,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      10,
      colors.background + 'cc',
      colors.highlight
    );

    // Draw evidence icon
    drawText(ctx, '📊', panelX + 20, panelY + 25, 20, colors.text, 'left');

    // Draw status
    const status = state.value > 0 ? 'Recording...' : 'Waiting';
    drawText(ctx, status, panelX + 50, panelY + 25, 14, colors.text, 'left');
  }

  handleInteraction = (event: InteractionEvent, state: SimState): SimState => {
    const newState = { ...state };

    switch (event.type) {
      case 'click':
        // Handle block selection
        return this.handleClick(event, newState);
      case 'dragStart':
        newState.isDragging = true;
        newState.dragTarget = { x: event.x, y: event.y };
        return newState;
      case 'dragMove':
        if (newState.isDragging) {
          // Update drag position
          newState.dragTarget = { x: event.x, y: event.y };
        }
        return newState;
      case 'dragEnd':
        newState.isDragging = false;
        newState.dragTarget = undefined;
        return this.handleDrop(event, newState);
      case 'keydown':
        return this.handleKeydown(event, newState);
      default:
        return newState;
    }
  };

  private handleClick(event: InteractionEvent, state: SimState): SimState {
    // Check if clicked on blocks tray
    const trayY = this.canvasHeight - 120;

    if (event.y > trayY && event.y < trayY + 100) {
      // Check which type of block
      if (event.y > trayY + 20 && event.y < trayY + 60) {
        // Hundreds or tens
        if (event.x > 100 && event.x < 100 + 3 * (BLOCK_SIZE.hundreds + 20)) {
          state.hundreds = Math.min(state.hundreds + 1, 5);
          announceToScreenReader(`Added hundreds block. Total: ${state.value}`);
        } else if (event.x > 100 && event.x < 100 + 5 * (BLOCK_SIZE.tens + 15)) {
          state.tens = Math.min(state.tens + 1, 10);
          announceToScreenReader(`Added tens block. Total: ${state.value}`);
        }
      } else if (event.y > trayY + 70) {
        // Ones
        if (event.x > 100 && event.x < 100 + 10 * (BLOCK_SIZE.ones + 10)) {
          state.ones = Math.min(state.ones + 1, 20);
          announceToScreenReader(`Added ones block. Total: ${state.value}`);
        }
      }
    }

    // Update total value
    state.value = state.hundreds * 100 + state.tens * 10 + state.ones;

    return state;
  }

  private handleDrop(event: InteractionEvent, state: SimState): SimState {
    // Simplified: same as click for MVP
    return this.handleClick(event, state);
  }

  private handleKeydown(event: InteractionEvent, state: SimState): SimState {
    switch (event.key) {
      case 'r':
      case 'R':
        // Reset
        return this.reset();
      case '+':
      case '=':
        // Add ones
        state.ones = Math.min(state.ones + 1, 20);
        break;
      case '-':
        // Remove ones
        state.ones = Math.max(state.ones - 1, 0);
        break;
      case 'ArrowUp':
        // Add tens
        state.tens = Math.min(state.tens + 1, 10);
        break;
      case 'ArrowDown':
        // Remove tens
        state.tens = Math.max(state.tens - 1, 0);
        break;
      case 'ArrowRight':
        // Add hundreds
        state.hundreds = Math.min(state.hundreds + 1, 5);
        break;
      case 'ArrowLeft':
        // Remove hundreds
        state.hundreds = Math.max(state.hundreds - 1, 0);
        break;
    }

    state.value = state.hundreds * 100 + state.tens * 10 + state.ones;
    return state;
  }

  reset = (): SimState => {
    return {
      value: 0,
      mode: 'teach',
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium',
        keyboardOnly: false,
        screenReader: false,
      },
      hundreds: 0,
      tens: 0,
      ones: 0,
      isDragging: false,
      lastFrameTime: 0,
      frameCount: 0,
    };
  };

  validate = (state: SimState): { valid: boolean; feedback?: string } => {
    if (state.value === 0) {
      return { valid: false, feedback: 'Add some blocks to make a number' };
    }

    if (state.value > 500) {
      return { valid: false, feedback: 'Maximum value is 500' };
    }

    return { valid: true, feedback: `Great! You made ${state.value}` };
  };
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPlaceValueBlueprint(width?: number, height?: number) {
  return new PlaceValueBlueprint(width, height);
}
