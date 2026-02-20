# ResusBuddy

A clinical-grade intelligent decision support application implementing the 2025 AHA Cardiac Arrest Algorithm for adult and pediatric resuscitation in hospital code teams and training scenarios.

## Overview

ResusBuddy is a Progressive Web App (PWA) designed to assist healthcare professionals during cardiac arrest situations by providing real-time guidance following American Heart Association guidelines. The app features:

- **Real-time Code Management**: Track cardiac arrest events with automated timing and rhythm checks
- **Adult & Pediatric Protocols**: Complete implementation of adult and pediatric resuscitation algorithms
- **Bradycardia & Tachycardia Modules**: Guided pathways for stable and unstable arrhythmias
- **CPR Quality Tracking**: Monitor compression timing and ensure guideline compliance
- **Post-ROSC Care**: Structured checklist for return of spontaneous circulation
- **Session History**: Review past resuscitation events with complete timeline and notes
- **Offline Support**: Fully functional without internet connection
- **Cross-Platform**: Available as web app and native mobile app (iOS/Android)

## Important Disclaimer

**FOR EDUCATIONAL AND TRAINING PURPOSES ONLY**

This application is intended for:
- Educational training scenarios
- Resuscitation certification practice
- Reference during simulations

This tool is **NOT** intended to replace:
- Clinical judgment
- Formal resuscitation training and certification
- Established hospital protocols
- Real-time physician oversight during actual resuscitation

Healthcare providers are solely responsible for patient care decisions. Always follow your institution's protocols and guidelines.

## Technology Stack

This project is built with modern web technologies:

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: XState (state machines)
- **Mobile**: Capacitor for iOS/Android native apps
- **Routing**: React Router
- **Internationalization**: i18next
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 16+ and npm (recommended: [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- For mobile development: Xcode (iOS) or Android Studio (Android)

### Installation

```sh
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd acl-assist-now

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

### Web Development

```sh
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Mobile Development

```sh
# Android
npm run cap:sync:android    # Sync web assets to Android
npm run cap:open:android    # Open Android Studio
npm run cap:run:android     # Build and run on Android device/emulator
npm run android:dev         # Development build and run
npm run android:build       # Production build for Android

# iOS
npm run cap:sync:ios        # Sync web assets to iOS
npm run cap:open:ios        # Open Xcode
npm run cap:run:ios         # Build and run on iOS device/simulator
npm run ios:dev             # Development build and run
```

## Features

### Code Management
- Start/pause/resume cardiac arrest protocols
- Automatic 2-minute CPR cycle timing
- Rhythm check reminders
- Medication tracking and suggestions
- Defibrillation tracking with joule settings

### Clinical Decision Support
- Shockable rhythm pathway (VF/pVT)
- Non-shockable rhythm pathway (PEA/Asystole)
- Reversible causes checklist (H's and T's)
- Pregnancy-specific considerations
- Post-ROSC care protocol

### Arrhythmia Management
- Bradycardia assessment and treatment pathways
- Tachycardia evaluation (stable vs unstable)
- SVT vs Sinus Tachycardia differentiation
- Medication dosing calculators

### Session Management
- Weight-based medication calculations
- Session notes and timestamps
- Complete event timeline
- PDF export of session summaries
- Local storage (no cloud/no data collection)

## Development

### Project Structure

```
src/
├── components/
│   ├── acls/              # ACLS-specific components
│   │   ├── bradytachy/    # Bradycardia/Tachycardia modules
│   │   └── views/         # Main code screen views
│   └── ui/                # shadcn/ui components
├── pages/                 # Route pages
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
└── main.tsx              # Application entry point
```

### Adding Features

When contributing to this project:
1. Follow existing code patterns and component structure
2. Ensure clinical accuracy - reference AHA guidelines
3. Add tests for new functionality
4. Update relevant documentation

## Deployment

### Web (PWA)
```sh
npm run build
```
Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

### Mobile App Store

For iOS and Android builds, follow the [Capacitor deployment guide](https://capacitorjs.com/docs/deployment) for detailed instructions on creating production builds and publishing to app stores.

## References

This application implements guidelines from:
- [2024 AHA Advanced Cardiovascular Life Support Guidelines](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001376)
- [2024 AHA Pediatric Advanced Life Support Guidelines](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001368)

## Privacy

- All data is stored locally in your browser/device
- No analytics or tracking
- No internet connection required after initial load
- No data is transmitted to external servers

## License

See LICENSE file for details.

## Developer

Created by [G.R.](https://www.linkedin.com/in/g-r-078715203/)

## Support

For issues or feature requests, please use the GitHub issue tracker.

---

**Remember**: This is a training and reference tool. Always prioritize formal resuscitation training, clinical judgment, and institutional protocols in real patient care scenarios.
