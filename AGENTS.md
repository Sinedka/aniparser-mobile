# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Screen components and navigation layout (player, tabs, side panel).
- `components/`: Reusable UI and custom player widgets (see `components/custom/`).
- `services/`: API clients and player/source integrations.
- `stores/`: Zustand state stores.
- `hooks/`, `constants/`: Shared hooks and theme constants.
- `__tests__/` and `test/`: Jest tests and fixtures (if needed).
- `android/` and `ios/`: Native project files and build configs.

## Build, Test, and Development Commands
- `npm run start`: Start the Metro bundler for local development.
- `npm run android`: Build and run the Android app on a device/emulator.
- `npm run ios`: Build and run the iOS app in the simulator.
- `npm run lint`: Run ESLint across the repo.
- `npm test`: Run Jest tests (React Native preset).

## Coding Style & Naming Conventions
- TypeScript/TSX is the default for app code (`.ts`/`.tsx`).
- Indentation: 2 spaces; keep lines concise and readable.
- Components use PascalCase (e.g., `VideoPlayer`), hooks use `useX` naming.
- Prefer descriptive names for screens and routes (e.g., `PlayerSidePanel`).
- Linting: ESLint is configured via `@react-native/eslint-config`.
- Formatting: Prettier is available; keep formatting consistent with existing files.

## Testing Guidelines
- Framework: Jest with the React Native preset (`jest.config.js`).
- Place tests in `__tests__/` (e.g., `__tests__/App.test.tsx`).
- Name tests to match the component or module under test.
- Run with `npm test`; add or update tests when changing core player logic.

## Commit & Pull Request Guidelines
- Commit style in history is short and lowercase (e.g., "added player side panel").
- Keep commits focused on a single change.
- PRs should include: a short summary, testing notes (`npm test`, `npm run lint`), and screenshots for UI changes.
- Link related issues or feature requests when available.

## Configuration Notes
- Node.js >= 20 is required (`package.json` engines).
- Android/iOS builds rely on native projects under `android/` and `ios/`.
