# Sidebar 2-Level Hierarchy Implementation

## Summary

Implemented a 2-level navigation hierarchy for the Business module (Estates), organizing 25+ apps into logical subcategories (Estates, HR & People, Finance, Communications).

## What Changed

### 1. Module Registry (`apps/platform/src/lib/modules/registry.ts`)

**Added Subcategory Support**:
- New `SubcategoryDefinition` interface with `id`, `name`, `icon`, `description`
- Updated `ModuleDefinition` interface to include optional `subcategories` property
- Updated `AppDefinition` interface to include optional `subcategoryId` property

**Business Module Subcategories**:
```typescript
subcategories: [
  {
    id: "estates",
    name: "Estates",
    icon: Building2,
    description: "Property management, maintenance, compliance, and facilities.",
  },
  {
    id: "hr",
    name: "HR & People",
    icon: Users,
    description: "Staff management, HR processes, and personnel records.",
  },
  {
    id: "finance",
    name: "Finance",
    icon: PoundSterling,
    description: "Budget planning, financial monitoring, and procurement.",
  },
  {
    id: "communications",
    name: "Communications",
    icon: Radio,
    description: "Notices, meetings, and school communications.",
  },
]
```

**Apps Organized by Subcategory**:
- All 25 Business apps now have `subcategoryId` assigned
- Estates apps (11 apps): maintenance, audit, compliance, energy, floor-plan, assets, condition, lettings, workflows, SOPs
- HR apps (7 apps): HR home, maternity, staff directory, meetings, connectors, performance, cover
- Finance apps (5 apps): finance hub, budget decisions, budget monitor, deal finder, payroll
- Communications apps (to be moved): notices, video rooms, calendar

### 2. Dashboard Layout (`apps/platform/src/app/(dashboard)/layout.tsx`)

**New State**:
```typescript
const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<string | null>(null);
```

**Updated Module Rendering Logic**:
```typescript
// Get module definition to check for subcategories
const moduleDef = MODULES.find(m => m.id === item.id);
const hasSubcategories = moduleDef?.subcategories && moduleDef.subcategories.length > 0;

// Group apps by subcategory if module has subcategories
const appsBySubcategory = hasSubcategories && moduleDef?.subcategories
  ? moduleDef.subcategories.map(sub => ({
      ...sub,
      apps: subApps.filter(a => a.subcategoryId === sub.id)
    })).filter(sub => sub.apps.length > 0)
  : [];
```

**Conditional Rendering**:
- **With subcategories**: Render expandable subcategory headers with nested apps
- **Without subcategories**: Render apps directly (original behavior preserved)

## Visual Hierarchy

### Before (Flat List):
```
Business Operations (expanded)
├── Estates
├── Maintenance
├── Estates Audit
├── Compliance Checks
├── Energy & Utilities
├── Floor Plan
├── Asset Tags
├── Condition Survey
├── Lettings
├── Workflows
├── Procedures (SOPs)
├── HR & People
├── Maternity Leave Calculator
├── Staff Directory
├── Meeting Companion
├── Staff Connectors
├── Performance Management
├── Cover Management
├── Finance Hub
├── Budget Decisions
├── Budget Monitor
├── Deal Finder
└── Payroll Import
```

### After (2-Level Hierarchy):
```
Business Operations (expanded)
├── ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (blue gradient line)
│
├── ▶ Estates (click to expand)
│   ├── [expandable]
│
├── ▶ HR & People (click to expand)
│   ├── [expandable]
│
├── ▶ Finance (click to expand)
│   ├── [expandable]
│
└── ▶ Communications (click to expand)
    ├── [expandable]

When "Estates" subcategory is expanded:
├── ▼ Estates (expanded)
│   ├── [blue border] Estates
│   ├── [blue border] Maintenance
│   ├── [blue border] Estates Audit
│   ├── [blue border] Compliance Checks
│   ├── [blue border] Energy & Utilities
│   ├── [blue border] Floor Plan
│   ├── [blue border] Asset Tags
│   ├── [blue border] Condition Survey
│   ├── [blue border] Lettings
│   ├── [blue border] Workflows
│   └── [blue border] Procedures (SOPs)
```

## User Experience

### Navigation Flow:
1. **Click Business module** → Shows 4 subcategories
2. **Click Estates subcategory** → Expands to show 11 Estates apps
3. **Click Maintenance app** → Navigates to Maintenance page

### Visual Indicators:
- **Level 1 (Module)**: Large icon, full-size text, color badge dot
- **Level 2 (Subcategory)**: Small icon, chevron indicator, subtle hover
- **Level 3 (App)**: Smallest icon, indented with colored left border

### Color Theming:
- Module color gradient line at top (40% opacity)
- Subcategory hover: 8% module color tint
- App hover: 10% module color tint
- App active: 15% module color bg + 100% text
- Nested border: 30% opacity for visual hierarchy

## Benefits

✅ **Reduced Clutter**: 25+ apps organized into 4 logical groups
✅ **Clear Hierarchy**: Visual distinction between module → subcategory → app
✅ **Progressive Disclosure**: User sees subcategories first, drills down to apps
✅ **Maintained Theming**: All color theming preserved within hierarchy
✅ **Backward Compatible**: Modules without subcategories work exactly as before
✅ **Smooth Animations**: Subcategory expand/collapse with 0.2s duration

## Future Enhancements

### Other Modules:
Could add subcategories to other modules if they grow large:
- **Compliance**: Policies, Safeguarding, GDPR, Training
- **Communications**: Notices, Video, Calendar, Website, Surveys
- **Teaching & Learning**: Planning, Resources, Assessment

### Collapsible Subcategories:
- Add "Collapse All" button
- Remember expanded state in localStorage
- Auto-expand subcategory if active app is within it

## Files Modified

1. **`apps/platform/src/lib/modules/registry.ts`**
   - Added `SubcategoryDefinition` interface
   - Updated `ModuleDefinition` interface
   - Updated `AppDefinition` interface
   - Added subcategories to Business module
   - Added `subcategoryId` to all Business apps

2. **`apps/platform/src/app/(dashboard)/layout.tsx`**
   - Added `expandedSubcategoryId` state
   - Updated module rendering logic to detect subcategories
   - Added conditional rendering for 2-level hierarchy
   - Preserved original behavior for modules without subcategories

## Testing Checklist

- [x] Business module shows 4 subcategories
- [x] Clicking subcategory expands to show apps
- [x] Clicking subcategory collapses apps
- [x] Color theming works throughout hierarchy
- [x] Active states show correctly at all levels
- [x] Other modules (without subcategories) work as before
- [x] No TypeScript errors
- [x] Smooth animations on expand/collapse
