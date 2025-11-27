# Schoolgle Loader - Usage Guide

## Overview

The Schoolgle Loader is a loading spinner that displays 7 planets orbiting around a center point, matching the solar system physics of the animated logo. Perfect for loading states, data fetching, and waiting indicators.

## Component Location

`src/components/SchoolgleLoader.tsx`

## Features

✅ **Solar System Physics**
- Inner planets orbit faster (1.8s - 3.0s)
- Outer planets orbit slower (3.6s - 7.5s)
- Matches real solar system behavior

✅ **Consistent Design**
- Same planet sizes and colors as logo
- Matches Schoolgle brand identity
- Smooth, infinite animation

✅ **Flexible Sizing**
- Default: 160px
- Customizable size prop
- Responsive to container

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `160` | Width and height in pixels |
| `className` | `string` | `""` | Additional CSS classes |
| `showText` | `boolean` | `false` | Show/hide loading text |
| `text` | `string` | `"Loading..."` | Custom loading message |

## Usage Examples

### Basic Loader

```tsx
import SchoolgleLoader from '@/components/SchoolgleLoader';

<SchoolgleLoader />
```

### Custom Size

```tsx
<SchoolgleLoader size={200} />
```

### With Loading Text

```tsx
<SchoolgleLoader 
  showText 
  text="Loading data..." 
/>
```

### Full Screen Loading

```tsx
<div className="flex items-center justify-center min-h-screen">
  <SchoolgleLoader 
    size={240} 
    showText 
    text="Preparing your dashboard..." 
  />
</div>
```

### Inline Loading

```tsx
<div className="flex items-center gap-3">
  <SchoolgleLoader size={40} />
  <span className="text-gray-600">Processing...</span>
</div>
```

### Button Loading State

```tsx
<button disabled className="flex items-center gap-2">
  <SchoolgleLoader size={20} />
  <span>Saving...</span>
</button>
```

### Card Loading State

```tsx
<div className="bg-white rounded-xl p-8">
  <div className="flex flex-col items-center justify-center py-12">
    <SchoolgleLoader size={120} showText text="Loading framework data..." />
  </div>
</div>
```

## Planet Details

| Planet | Color | Size | Orbit Speed | Radius |
|--------|-------|------|-------------|--------|
| HR | Light Blue (#ADD8E6) | 10px | 1.8s | 30px |
| Finance | Orange (#FFAA4C) | 12px | 2.4s | 40px |
| Estates | Cyan (#00D4D4) | 14px | 3.0s | 50px |
| Compliance | Purple (#E6C3FF) | 12px | 3.6s | 60px |
| Teaching | Pink (#FFB6C1) | 14px | 4.4s | 70px |
| SEND | Green (#98FF98) | 12px | 6.0s | 80px |
| Governance | Gold (#FFD700) | 16px | 7.5s | 90px |

## Common Use Cases

### 1. Page Loading

```tsx
export default function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SchoolgleLoader size={200} showText text="Loading..." />
    </div>
  );
}
```

### 2. Data Fetching

```tsx
const [loading, setLoading] = useState(true);

{loading ? (
  <SchoolgleLoader size={120} showText text="Fetching data..." />
) : (
  <DataComponent />
)}
```

### 3. Form Submission

```tsx
const [submitting, setSubmitting] = useState(false);

<button 
  type="submit" 
  disabled={submitting}
  className="flex items-center gap-2"
>
  {submitting && <SchoolgleLoader size={20} />}
  <span>{submitting ? 'Saving...' : 'Save'}</span>
</button>
```

### 4. Async Operations

```tsx
const handleAction = async () => {
  setLoading(true);
  try {
    await performAction();
  } finally {
    setLoading(false);
  }
};

{loading && (
  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
    <SchoolgleLoader size={160} showText text="Processing..." />
  </div>
)}
```

## Styling

### Custom Colors

The loader uses fixed planet colors matching the brand. To customize:

```tsx
// Edit src/components/SchoolgleLoader.tsx
const planets = [
  { name: "HR", color: "#YOUR_COLOR", ... },
  // ...
];
```

### Custom Background

```tsx
<div className="bg-gray-50 rounded-xl p-8">
  <SchoolgleLoader size={120} />
</div>
```

### Dark Mode

The loader works automatically in dark mode. Planets remain colored, background adapts:

```tsx
<div className="dark:bg-gray-900">
  <SchoolgleLoader size={160} showText text="Loading..." />
</div>
```

## Performance

- Uses Framer Motion for smooth animations
- Hardware-accelerated transforms
- Optimized with `will-change-transform`
- Lightweight (~2KB gzipped)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 (not supported)

---

*Created: 2025*
*Component: SchoolgleLoader.tsx*
*Matches: SchoolgleAnimatedLogo.tsx planet sizes and colors*

