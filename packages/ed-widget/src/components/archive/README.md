# Particle3D Archive

This directory contains archived implementations of the Particle3D component.

## Current Implementation

The current `Particle3D.ts` uses a **Solar System → Chaser Formation** animation:
- **Idle (chat closed)**: 8 planets orbit around central sun (Ed's head)
- **Active (chat open)**: Planets spiral inward, then form tight chaser formation
- **Performance**: ~1,200 particles total (vs 2,500 in shape morphing)

## Archived: Shape Morphing System

**File**: `Particle3D-shape-morphing-ARCHIVED.ts`

**Features**:
- 30+ shape morphing (pencil, heart, star, thumbsup, checkmark, smiley, etc.)
- Flag morphing with color patterns
- Emoji reference integration
- SVG path-based shape generation
- Reaction mode system

**Particle Count**: 2,500 particles

## Restoring Shape Morphing

If you need to restore the shape morphing functionality:

1. **Backup current implementation**:
   ```bash
   cp Particle3D.ts Particle3D-solar-system-ARCHIVED.ts
   ```

2. **Restore archived version**:
   ```bash
   cp archive/Particle3D-shape-morphing-ARCHIVED.ts Particle3D.ts
   ```

3. **Update Ed.ts** (if needed):
   - The `morphTo()` method is still available for compatibility
   - Remove `setActive()` calls if not needed

4. **Rebuild**:
   ```bash
   cd packages/ed-widget
   npm run build
   ```

## Performance Comparison

| Feature | Solar System | Shape Morphing |
|---------|--------------|----------------|
| Particles | ~1,200 | 2,500 |
| GPU Usage | Low | Medium |
| CPU Usage | Low | Medium |
| Older Devices | ✅ Smooth | ⚠️ May lag |
| Visual Appeal | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Why Archive?

The solar system animation was chosen for:
- Better performance on older school devices (2015+ tablets/laptops)
- Simpler, more maintainable code
- Still visually engaging
- Lower resource usage

The shape morphing system is preserved in case:
- Performance requirements change
- Visual variety is needed
- Specific shapes are required for certain interactions




