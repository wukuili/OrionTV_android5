# AGENTS.md

## Commands

- `yarn start` — Metro bundler with `EXPO_TV=1` (required for TV mode)
- `yarn android` / `yarn ios` — Build & run on device (also sets `EXPO_TV=1`)
- `yarn prebuild` — Regenerate native projects after dependency changes; also runs `yarn copy-config`
- `yarn copy-config` — Copies `xml/*` into `android/app/src/*/` (TV-specific Android configs like network security)
- `yarn build` — Production APK: prebuilds then runs `gradle assembleRelease`
- `yarn build-debug` — `gradle assembleDebug` (no prebuild step)
- `yarn test` — Jest in watch mode
- `yarn test-ci` — Jest single-run with coverage
- `yarn lint` — `expo lint` (ESLint with expo config)
- `yarn typecheck` — `tsc --noEmit`
- `yarn clean` — Clears Metro, yarn, and Gradle caches

**Verification order:** `lint` → `typecheck` → `test`

## Architecture

- **TV-first React Native app** using `react-native-tvos` (pinned via `resolutions` in package.json to `~0.73.7-0`). Not standard React Native.
- **Expo SDK 50** with **Expo Router v3** (`expo-router ~3.4.x`). Routes are files in `app/`: `index`, `detail`, `play`, `search`, `live`, `settings`, `favorites`.
- **`EXPO_TV=1`** must be set for all dev/build commands. Without it, TV-specific features are disabled.
- **New Architecture is disabled** (`newArchEnabled: false` in app.json for both iOS and Android).
- **Android minSdkVersion is 21** (Android 5.0). ABI filters: armeabi-v7a, arm64-v8a, x86, x86_64.
- **Babel** strips `console.*` calls in production via `transform-remove-console`.
- **Metro** is configured for a monorepo workspace root (`../..`), not a standalone project. `EXPO_USE_METRO_WORKSPACE_ROOT=1` is set in all scripts.

## Platform Variants

- TV-specific component files use `.tv.tsx` extension (e.g., `VideoCard.tv.tsx`). Metro resolves `.tv.*` before standard extensions when `EXPO_TV=1`.
- **Currently only one `.tv.tsx` file exists** (`components/VideoCard.tv.tsx`). Most components are shared.
- `useTVRemoteHandler` hook handles hardware remote events (D-pad, play/pause, seek) — only meaningful on TV.
- `useResponsiveLayout` and `DeviceUtils` provide breakpoints: mobile `<768px`, tablet `768–1023px`, TV `≥1024px`.

## State Management (Zustand v5)

Each store in `stores/` uses Zustand's `create` pattern:
- `settingsStore` — API URL, M3U URL, preferences; loads from AsyncStorage on init
- `homeStore` — Home content, categories, Douban data, play records
- `playerStore` — Playback state, episode management, controls visibility
- `remoteControlStore` — TCP HTTP server for remote device control
- `authStore`, `detailStore`, `favoritesStore`, `sourceStore`, `updateStore`

Stores import from `services/storage.ts` (AsyncStorage wrapper) and `services/api.ts` (HTTP client).

## Services

- `api.ts` — Central HTTP client; all API calls go here. Returns typed interfaces.
- `storage.ts` — AsyncStorage wrapper with typed keys (`STORAGE_KEYS`) and manager classes (`SettingsManager`, `PlayRecordManager`, `FavoritesManager`).
- `remoteControlService.ts` / `tcpHttpServer.ts` — TCP-based HTTP server for remote input (not on mobile).
- `updateService.ts` — APK update check and download.
- `m3u.ts`, `m3u8.ts`, `m3u8Filter.ts` — M3U/M3U8 playlist parsing.

## Key Conventions

- **Path alias:** `@/*` maps to project root (tsconfig paths).
- **Package manager:** Yarn 1 (Classic). Use `yarn`, not `npm`.
- **Dark theme only** — `colorScheme` is hardcoded to `"dark"` in `_layout.tsx`.
- **App scheme:** `oriontv://` (deep linking).
- **Android package:** `com.oriontv`. Uses cleartext traffic (`usesCleartextTraffic: true`) and custom network security config from `xml/`.
- **No `.mobile.tsx` or `.tablet.tsx` files currently exist.** Only `.tv.tsx` variants are used.
- **Tests** live in `utils/__tests__/` (DeviceUtils, ResponsiveStyles). Run specific tests: `yarn test utils/__tests__/DeviceUtils.test.ts`.
- **Chinese comments** are common throughout the codebase.

## Build Gotchas

- `yarn prebuild` must run after any dependency change before native builds.
- `yarn copy-config` copies all files from `xml/` into `android/app/src/*/` — needed for Android TV network security config.
- `yarn build` does prebuild + release APK. `yarn build-debug` skips prebuild.
- CI uses Node 18, JDK 17 (Zulu). Two workflows: `build-apk.yml` (main APK) and `android4.4.yml` (legacy Android 4.4 build).