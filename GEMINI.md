# OrionTV Project Instructions

OrionTV is a specialized React Native TVOS application built with Expo, designed for streaming video content on Android TV (v5.0+) and Apple TV. It features a TV-optimized UI and a responsive layout for mobile and tablet devices.

## Project Overview

- **Core Framework**: [React Native TVOS](https://github.com/react-native-tvos/react-native-tvos) (v0.73.7-0). This is a fork of React Native optimized for TV platforms.
- **Platform Support**: Android TV (API 21+), Apple TV, Mobile, and Tablet.
- **Key Technologies**:
    - **Expo SDK 50/51**: Provides native capabilities and build tooling.
    - **Expo Router**: File-based routing system (v3.4.x).
    - **Zustand**: Lightweight state management (v5.0.6).
    - **TypeScript**: Complete type safety throughout the codebase.
    - **Expo AV**: Video playback engine.

## Architecture & Directory Structure

- `app/`: Expo Router routes and screen layouts (e.g., `index.tsx`, `detail.tsx`, `play.tsx`).
- `components/`: Reusable UI components. Use `.tv.tsx` extension for TV-specific variants (e.g., `VideoCard.tv.tsx`).
- `services/`: Service layer for external integrations:
    - `api.ts`: Centralized HTTP client using `fetch`.
    - `storage.ts`: Typed `AsyncStorage` wrappers and managers.
    - `remoteControlService.ts`: TCP-based HTTP server for remote input.
    - `updateService.ts`: APK update management.
- `stores/`: Zustand state stores (e.g., `settingsStore.ts`, `playerStore.ts`, `homeStore.ts`).
- `hooks/`: Custom hooks:
    - `useTVRemoteHandler.ts`: Manages TV remote events (D-pad, play/pause, seek).
    - `useResponsiveLayout.ts`: Provides device type detection and breakpoints.
- `utils/`: Utilities for logging (`Logger.ts`), device detection (`DeviceUtils.ts`), and responsive styling.
- `constants/`: Application-wide constants, colors, and theme definitions.
- `xml/`: Custom Android native configurations (e.g., `network_security_config.xml`).

## Key Development Commands

Always use **Yarn 1 (Classic)**.

- `yarn start`: Start Metro Bundler with `EXPO_TV=1` and `EXPO_USE_METRO_WORKSPACE_ROOT=1`.
- `yarn android`: Build and run on an Android TV device or emulator.
- `yarn ios`: Build and run on an Apple TV device or simulator.
- `yarn prebuild`: Regenerate native project files (run after dependency changes). Automatically calls `yarn copy-config`.
- `yarn copy-config`: Copies custom configurations from `xml/` to `android/app/src/`.
- `yarn build`: Generate a production Release APK.
- `yarn lint`: Run ESLint checks using the Expo config.
- `yarn typecheck`: Run TypeScript compiler for type checking.
- `yarn test`: Run unit tests using Jest.

## Development Conventions

- **TV-First Design**: Prioritize D-pad navigation and focus management. Use `useTVRemoteHandler` for playback controls.
- **Responsive Layout**:
    - Mobile: `< 768px`
    - Tablet: `768px - 1023px`
    - TV: `≥ 1024px`
- **Component Strategy**: Prefer shared components. Use platform-specific file extensions (`.tv.tsx`) only when significantly different interaction or UI is required.
- **State Management**: Use Zustand stores in `@/stores`. Persistence is handled via `AsyncStorage` in the service layer.
- **Path Aliases**: Use `@/*` to reference the project root (e.g., `import { api } from "@/services/api"`).
- **Environment**: `EXPO_TV=1` must be set for all development and build commands to enable TV features.
- **Logging**: Use the custom `Logger` utility with tags: `const logger = Logger.withTag('MyTag');`.
- **Theme**: The application is **Dark Theme only**. `colorScheme` is hardcoded to `"dark"` in `RootLayout`.
- **Native Configuration**: Do not modify `android/` or `ios/` folders directly if possible. Instead, modify `app.json` or files in `xml/` and run `yarn prebuild`.

## Testing

- Unit tests are located in `**/__tests__/*.test.ts`.
- Use `yarn test` for continuous testing or `yarn test-ci` for a single run with coverage.
- Mocks for React Native and Expo modules are encouraged for utility testing.
