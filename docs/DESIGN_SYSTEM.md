# Schoolgle Design System

## Brand Guidelines

### Color Palette
- **Background:** White (#ffffff)
- **Primary Text:** Gray-900 (#111827)
- **Secondary Text:** Gray-500 (#6b7280)
- **Muted Text:** Gray-400 (#9ca3af)
- **Borders:** Gray-100/200 (#f3f4f6, #e5e7eb)
- **Interactive:** Gray-900 (hover states)
- **Accent (warnings):** Amber-500 (#f59e0b)
- **Accent (errors):** Red-500 (#ef4444)

### Typography
- **Font Family:** System sans-serif (mimics Google/Apple)
- **Headings:** font-medium, tracking-tight
- **Body:** Regular weight
- **Labels:** text-sm, font-medium

### Form Elements
```css
/* Input fields */
.input {
  @apply w-full px-4 py-3 border border-gray-200 rounded-lg;
  @apply focus:ring-2 focus:ring-gray-900 focus:border-transparent;
  @apply text-gray-900 placeholder:text-gray-400;
}

/* Buttons - Primary */
.btn-primary {
  @apply px-6 py-3 bg-gray-900 text-white rounded-xl;
  @apply font-medium hover:bg-gray-800 transition-colors;
}

/* Buttons - Secondary */
.btn-secondary {
  @apply px-6 py-3 bg-gray-100 text-gray-900 rounded-xl;
  @apply font-medium hover:bg-gray-200 transition-colors;
}
```

---

## Origami Animation System

### Overview
Each page features an animated background with origami shapes that form words. The shapes respond to mouse movement, scattering when the cursor approaches.

### Module Word Mapping

| Route | Module | Background Word | Origami Shape | Accent Color (subtle) |
|-------|--------|-----------------|---------------|----------------------|
| `/dashboard` | School Improvement | **"Improve"** | Paper Crane 🦢 | Gray |
| `/modules` | Module Hub | **"Modules"** | Paper Crane 🦢 | Gray |
| `/modules/compliance` | Compliance | **"Policies"** | Shield/Paper 📄 | Gray |
| `/modules/estates` | Estates | **"Estates"** | Building/House 🏠 | Gray |
| `/modules/hr` | HR | **"People"** | Person 👤 | Gray |
| `/modules/finance` | Finance | **"Finance"** | Coin/Paper 💷 | Gray |
| `/modules/send` | SEND | **"Support"** | Heart ❤️ | Gray |
| `/signup` | Signup | **"Welcome"** | Hexagon 🔷 | Gray |
| `/login` | Login | **"Hello"** | Paper Crane 🦢 | Gray |

### Framework-Specific Words

| Route | Framework | Background Word | Reasoning |
|-------|-----------|-----------------|-----------|
| Dashboard → Ofsted tab | Ofsted | **"Inspect"** | Inspection readiness |
| Dashboard → SIAMS tab | SIAMS | **"Flourish"** | Church school ethos |
| Dashboard → Actions tab | Actions | **"Progress"** | Moving forward |
| Dashboard → Reports tab | Reports | **"Evidence"** | Documentation |
| Dashboard → Voice tab | Voice | **"Listen"** | Voice observation |
| Dashboard → Inspector tab | Mock Inspector | **"Practice"** | Practice makes perfect |

### Origami Shapes by Module

**Paper Crane (Default)** - Used across most modules
```
    /\
   /  \
  /    \
 /      \ Wings
 --------
    ||
```
- Symbolizes: Transformation, progress, aspiration
- Used in: Dashboard, Modules hub, Login

**Shield Shape** - Compliance/Policies
```
  _____
 /     \
|       |
|       |
 \     /
  \   /
   \_/
```
- Symbolizes: Protection, compliance, safety
- Used in: Compliance module

**House/Building Shape** - Estates
```
    /\
   /  \
  /    \
 |------|
 |  []  |
 |______|
```
- Symbolizes: Buildings, facilities, infrastructure
- Used in: Estates module

**Heart Shape** - SEND
```
  /\  /\
 /  \/  \
 \      /
  \    /
   \  /
    \/
```
- Symbolizes: Care, support, inclusion
- Used in: SEND module

### Implementation Notes

1. **Opacity:** 0.2-0.35 for visibility
2. **Color:** `rgba(20, 20, 40, opacity)` - Dark blue-gray
3. **Particle Count:** ~400 minimum
4. **Font Size:** Responsive, max 150px
5. **Mouse Repel Radius:** 150px
6. **Animation Speed:** 2 max speed, 0.05 max force

### Component Props
```typescript
interface OrigamiParticlesProps {
  text: string;      // Word to form
  opacity?: number;  // 0.2-0.35 recommended
  shape?: 'crane' | 'shield' | 'house' | 'heart' | 'hexagon';
}
```

---

## Page-by-Page Styling

### Dashboard (`/dashboard`)
- Origami word: "Improve"
- Shape: Paper crane
- Nav: Gray-900 underline for active tab
- Cards: bg-gray-50, rounded-2xl
- Metrics: Large text-3xl numbers

### Modules Hub (`/modules`)
- Origami word: "Modules"
- Shape: Paper crane
- Hero: Large centered text
- Flow diagram: Gray pills with arrows
- Module cards: White with hover states

### Compliance (`/modules/compliance`)
- Origami word: "Policies"
- Shape: Shield (future)
- Stats: Gray-50 cards with metrics
- Policy table: Clean with status badges
- Alert banner: Red-50 for overdue

### Estates (`/modules/estates`)
- Origami word: "Estates"
- Shape: Building (future)
- Risk scores: Colored circles (red/amber/green)
- Ticket list: Clean table
- Compliance checks: Status cards

### Signup (`/signup`)
- Background: Hexagon shapes (current)
- Origami word: "Welcome" (to implement)
- Multi-step form
- Clean gray inputs

---

## Accessibility

- **Contrast:** All text meets WCAG AA
- **Focus states:** Gray-900 ring on inputs
- **Interactive elements:** Clear hover states
- **Form labels:** Always visible, not just placeholders

---

## Component Library

### Cards
```jsx
<div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
  {/* content */}
</div>
```

### Stat Cards
```jsx
<div className="bg-gray-50 rounded-2xl p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
      <Icon className="w-5 h-5 text-gray-700" />
    </div>
    <span className="text-3xl font-medium text-gray-900">Value</span>
  </div>
  <h3 className="font-medium text-gray-900">Label</h3>
</div>
```

### Navigation Tabs
```jsx
<button className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 
  ${active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
  <Icon size={16} />
  Label
</button>
```

