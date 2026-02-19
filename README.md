# ResusBuddy

ResusBuddy is a clinical-grade ACLS/PALS decision-support Progressive Web App for training and simulation use, aligned with 2025 AHA cardiac arrest workflows.

## Important Disclaimer

**For educational and simulation use only. Not for real-patient clinical decision-making.**

Use institutional protocols, formal training, and clinician judgment in real care settings.

## Key Capabilities

- Adult and pediatric cardiac arrest pathways (ACLS/PALS)
- Bradycardia and tachycardia guided pathways
- CPR rhythm-check and medication timing support
- Intervention timeline and session history
- Weight-based pediatric dosing
- Offline-first behavior with local persistence
- Multi-language interface (i18next)

## Platform Scope

- Web (PWA)
- Android (Capacitor)
- iOS (Capacitor)

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind + shadcn/ui
- Capacitor (Android/iOS)
- Vitest + Testing Library
- i18next

## Architecture Notes

The protocol flow is implemented with custom React hooks rather than a runtime XState machine:

- `src/hooks/useACLSLogic.ts`: cardiac arrest phases, timers, interventions
- `src/hooks/useBradyTachyLogic.ts`: brady/tachy assessment and treatment flow
- `src/types/acls.ts`: centralized clinical and session types
- `src/lib/*Dosing.ts`: adult/pediatric/brady-tachy dosing utilities

## Development

### Prerequisites

- Node.js 18+ recommended
- npm
- Android Studio/Xcode for native builds

### Install

```bash
npm install
```

### Run and Build

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:run
npm run test:coverage
```

### Mobile

```bash
npm run cap:sync:android
npm run cap:run:android
npm run android:dev
npm run android:build

npm run cap:sync:ios
npm run cap:run:ios
npm run ios:dev
```

## Data and Privacy

- Session data is stored locally (IndexedDB/localStorage)
- No backend is required for core operation
- No analytics pipeline is required for app functionality

## License

MIT. See `LICENSE`.
