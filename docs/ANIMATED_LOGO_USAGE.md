# Schoolgle Animated Logo - Usage Guide

## Overview

The animated logo features 7 planets orbiting around the "Schoolgle" wordmark, representing different modules:
- **HR** (Light Blue)
- **Finance** (Orange)
- **Estates** (Cyan)
- **Compliance** (Purple)
- **Teaching** (Pink)
- **SEND** (Green)
- **Governance** (Gold)

## Component Location

`src/components/SchoolgleAnimatedLogo.tsx`

## Usage Examples

### 1. Using the Logo Component (Recommended)

```tsx
import Logo from '@/components/Logo';

// Animated version (for hero sections)
<Logo variant="animated" size="lg" />

// Icon-only (for headers - default)
<Logo variant="icon-only" size="md" />

// Static full logo
<Logo variant="full" size="md" />
```

### 2. Direct Usage

```tsx
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';

// Hero Section
<div className="text-gray-900 dark:text-white flex items-center justify-center min-h-screen">
  <SchoolgleAnimatedLogo size={560} />
</div>

// Header (smaller, no text)
<SchoolgleAnimatedLogo size={200} showText={false} />

// Loading Screen
<div className="flex items-center justify-center h-screen">
  <SchoolgleAnimatedLogo size={300} />
</div>
```

## Props

### SchoolgleAnimatedLogo Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `520` | Width and height in pixels |
| `className` | `string` | `""` | Additional CSS classes |
| `showText` | `boolean` | `true` | Show/hide "Schoolgle" wordmark |

### Logo Component Props (with animated variant)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'icon-only' \| 'full' \| 'animated'` | `'icon-only'` | Logo variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `showText` | `boolean` | `true` | Show/hide text |
| `className` | `string` | `""` | Additional CSS classes |

## Size Presets (Animated Variant)

- `sm`: 300px
- `md`: 400px
- `lg`: 520px

## Features

✅ **Automatic Light/Dark Mode**
- Text uses `currentColor` - adapts automatically
- Planets retain fixed colors

✅ **Infinite Animation**
- Seamless rotation, never pauses
- Different speeds for each planet (18s - 75s)

✅ **Interactive**
- Planets scale on hover
- Accessible (title attributes)

✅ **Performance**
- Uses `will-change-transform` for optimization
- Framer Motion hardware acceleration

## Where to Use

### ✅ Recommended
- Hero sections
- Landing pages
- Loading screens
- Video backgrounds
- Marketing materials

### ⚠️ Use Sparingly
- Headers (use icon-only instead)
- Navigation bars (too distracting)
- Dense content areas

## Customization

### Change Planet Colors

Edit `src/components/SchoolgleAnimatedLogo.tsx`:

```tsx
const planets = [
  { name: "HR", color: "#ADD8E6", ... },
  // Change colors here
];
```

### Adjust Animation Speed

Modify `duration` values (lower = faster):

```tsx
{ name: "HR", duration: 18, ... },  // 18 seconds per rotation
```

### Change Orbit Radius

Modify `radius` values (pixels from center):

```tsx
{ name: "HR", radius: 70, ... },  // 70px from center
```

## Performance Notes

- Animation uses CSS transforms (GPU accelerated)
- Planets render as simple circles (low overhead)
- Text uses `currentColor` (no color calculations)
- Suitable for 60fps on modern devices

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 (not supported - use static variant)

---

*Created: 2025*
*Component: SchoolgleAnimatedLogo.tsx*

