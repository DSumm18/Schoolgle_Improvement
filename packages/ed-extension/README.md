# Ed Browser Extension

AI-powered assistant for school software tools. Ed watches your screen and helps you get things done.

## Features

- **Context-Aware Q&A**: Ed sees what you're working on and provides relevant help
- **Tool Recognition**: Automatically detects 30+ school tools (SIMS, Arbor, CPOMS, ParentPay, etc.)
- **Watch Mode**: Ed highlights where to click (coming soon)
- **Act Mode**: Ed performs actions for you with consent (coming soon)

## Development

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### Setup

```bash
cd packages/ed-extension
pnpm install
```

### Build

```bash
# Development build (with source maps)
pnpm run dev

# Production build
pnpm run build:prod
```

### Load in Chrome/Edge

1. Build the extension
2. Open `chrome://extensions` (or `edge://extensions`)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Architecture

```
src/
├── background/
│   └── service-worker.ts    # Background worker for API calls
├── content/
│   ├── inject.ts            # Main content script
│   ├── page-reader.ts       # Extracts page context
│   ├── tool-detector.ts     # Identifies school tools
│   └── ed-widget.ts         # Floating Ed UI
├── popup/
│   ├── popup.html           # Extension popup
│   └── popup.ts             # Popup logic
└── shared/
    ├── types.ts             # TypeScript types
    └── api.ts               # API client
```

## Supported Tools

### MIS
- SIMS
- Arbor
- Bromcom
- ScholarPack

### Finance
- Every Budget Builder
- PS Financials
- Access Finance

### Safeguarding
- CPOMS
- MyConcern
- Safeguard My School

### HR
- The Key HR
- Every HR
- Access People HR

### Parents
- ParentPay
- ParentMail
- SchoolComms
- Weduc

### Teaching
- Google Classroom
- Google Workspace
- Microsoft Teams
- Canva
- Twinkl

### Data
- Analyse School Performance
- FFT Education
- SISRA Analytics

### Admin
- SchoolBus
- SmartSurvey
- HSE Risk Assessment

## Privacy

Ed is designed with privacy as a core principle:

- **Local Processing**: Page context is extracted locally in your browser
- **On-Demand Only**: Data is only sent to the Ed API when you ask a question
- **No Storage**: Ed never stores page content or personal data
- **Password Safety**: Ed ignores password fields entirely
- **User Control**: You can disable Ed on any site

## License

Proprietary - Schoolgle Ltd.

