# CusOwn Mobile

A premium, dual-sided service booking and reservation marketplace mobile application built with React Native and Expo, powered by Supabase.

## Overview

**CusOwn** is a modern platform that connects customers with service business owners (such as salons and wellness centers). It provides a seamless mobile experience for browsing local businesses, scheduling real-time time slots, managing appointments, collecting user feedback, and sending push notifications.

The application leverages a role-based workflow:

- **Customer Role**: Search nearby businesses using GPS coordinates, browse service packages by categories, select and book available time slots, view appointment history, and leave reviews.
- **Owner Role**: Register and configure businesses, set up regular and special hours, define holidays/closures, manage custom or auto-generated slots, track business performance on an analytics dashboard, and manage bookings.

---

## Features

### 🔐 Authentication & Role Management

- **Role Selection**: Guided onboarding split into Customer and Owner roles.
- **Google OAuth Integration**: Native deep linking support via the `cusown://google-callback` custom URL scheme.
- **Soft Deletion & Account Recovery**: Accounts can be soft-deleted; logging back in directs the user to a dedicated recovery flow rather than standard dashboards.

### 👤 Customer Features

- **Location-Based Search**: Query nearby salons/businesses based on coordinates with calculated distances using PostgreSQL PostGIS/RPC.
- **Interactive Browsing**: Filter services by categories and browse featured businesses.
- **Step-by-Step Booking Wizard**:
  1. Service selection
  2. Date & time slot picker (displays real-time slot availability)
  3. Booking review and confirmation receipt
- **Booking Management**: View upcoming or past bookings, with the ability to reschedule or cancel.
- **Ratings & Reviews**: Post-booking review prompt and comment submission for non-hidden, verified customer feedback.

### 💼 Owner Features

- **Business Setup**: Business profile configuration including address details, geo-coordinates, capacity, and default slot duration.
- **Operation Hours Manager**:
  - Regular opening and closing hours.
  - Custom closures, holidays, and special hours (e.g. override hours for specific dates).
- **Slot Generator**: Auto-generate available slots based on business hours or create custom override slots via RPC.
- **Interactive Analytics Dashboard**: Visual analytics track metrics like overall revenue, customer retention rates, average order values, and booking statistics.
- **Order Hub**: Complete overview of upcoming, pending, confirmed, completed, rejected, cancelled, and expired bookings.

### 🔔 Notifications & Deep Linking

- **Real-Time Database Sync**: Live updates for bookings and status changes.
- **Push Notifications**: Integrated via Expo Notifications, automatically registering tokens and syncing to the Supabase backend.
- **Dynamic Routing**: Tapping push notifications deep-links the user directly to the relevant screen (e.g., booking details).

---

## Technology Stack

The project utilizes a modern mobile stack optimized for speed, scalability, and type safety:

- **Core & Runtime**: [React Native](https://reactnative.dev/) (v0.81.5) via [Expo SDK 54](https://expo.dev/) (v54.0.35)
- **Routing & Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (v6.0.23) for file-system based routing
- **Backend & Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2.106.1) for database, user authentication, storage buckets, database migrations, and PostgreSQL RPCs/RLS policies
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (v5.0.0) for global client-side state
- **Caching & Data Fetching**: [TanStack React Query](https://tanstack.com/query/latest) (v5.50.0) for asynchronous query/mutation caching
- **Styling & UI**: [NativeWind](https://www.nativewind.dev/) (v4.2.4) and Tailwind CSS (v3.4.19) using custom HSL/RGB colors tailored for premium dark-mode aesthetics
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) (v7.52.0) combined with [Zod](https://zod.dev/) (v3.23.8) schema validation
- **Animation**: [React Native Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) (v4.1.1)
- **Quality Assurance**: Jest, ESLint, Prettier, Husky, and Lint-Staged
- **Note on Payments**: `react-native-razorpay` is declared in `package.json` dependencies and is verified during local EAS builds, but is not currently integrated into the primary frontend scheduling workflow (uses mock/receipt verification).

---

## Project Structure

```text
CusOwn-Mobile/
├── android/                 # Native Android project configuration
├── ios/                     # Native iOS project configuration
├── app/                     # Expo Router file-system routing entry points
│   ├── (auth)/              # Authentication routing group (Google OAuth callbacks)
│   ├── (customer)/          # Customer application pages (Home, Profile, Bookings, Categories)
│   ├── (owner)/             # Business owner application pages (Dashboard, Analytics, Hub, Settings)
│   ├── (public)/            # Shared onboarding, welcome, and splash screens
│   ├── (tabs)/              # Shared navigation tabs configuration
│   └── _layout.tsx          # App root router layout, auth listener, and providers
├── assets/                  # Images, logos, and onboarding vector SVGs
├── scripts/                 # Platform-specific local build wrapper scripts
│   ├── lib/                 # Shared helper functions for environment parsing and EAS compilation
│   ├── build-local-android.sh # Local Android Gradle/EAS build runner script
│   └── build-local-ios.sh   # Local iOS Xcode/EAS build runner script
├── src/                     # Core application source code
│   ├── __tests__/           # Unit and service integration tests
│   ├── components/          # Reusable presentation design primitives (UI, layout, animations)
│   ├── config/              # Centralized configuration (endpoints, routes, strings)
│   ├── constants/           # Shared static constants and application theme config
│   ├── features/            # Domain-oriented modules (auth, booking, customer, owner, reviews, shared)
│   │   ├── [feature]/components/ # Feature-specific UI components
│   │   ├── [feature]/hooks/      # Feature-specific hooks
│   │   ├── [feature]/screens/    # Feature screen implementations (re-exported by app/)
│   │   └── [feature]/types/      # Feature-specific TS interfaces
│   ├── hooks/               # Global utility React hooks (e.g. push notification, modals)
│   ├── lib/                 # Shared singletons and libraries (Supabase, queryClient)
│   ├── providers/           # App-wide React context providers (Notification, Modal)
│   ├── services/            # Data access layer interfacing with Supabase REST and RPCs
│   ├── store/               # Zustand state stores (auth, booking, active role, onboarding)
│   ├── theme/               # Centralized design tokens (colors, radius, spacing, typography)
│   └── types/               # Generated types mapping database schema and notification formats
└── supabase/                # Supabase local environment configuration
    ├── functions/           # Supabase edge functions (notifications, cleanup workers)
    └── migrations/          # Chronological database SQL migrations (tables, RLS policies, RPCs)
```

---

## Prerequisites

To run or build the application locally, you must set up the following tools:

### Core Requirements

- **Node.js**: `v18.x` or `v20+` (CI/CD pipeline runs on Node 18)
- **Package Manager**: `npm` (included with Node.js)
- **EAS CLI**: `npx eas-cli` (build scripts pin `eas-cli` to `v18.12.3` or greater)

### For Android Development & Local Builds

- **Java Development Kit (JDK)**: JDK 17 (Recommended: `brew install openjdk@17` for macOS)
- **Android SDK**: Install Android Studio and configure the SDK (SDK Manager path should be set to `ANDROID_HOME` env variable)
- **Android Command Line Tools**: `adb` configured in your PATH environment variable

### For iOS Development & Local Builds (macOS only)

- **Xcode**: Install Xcode from the Mac App Store
- **Command Line Tools**: Ensure they are installed via `xcode-select --install`
- **CocoaPods**: Install CocoaPods via `brew install cocoapods` or gem utilities

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd CusOwn-Mobile
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Initialize Git Hooks**
   This repository utilizes Husky to run Prettier formatting checks prior to commits:

   ```bash
   npx husky
   ```

4. **Grant Executable Permissions to Build Scripts**
   ```bash
   chmod +x scripts/build-local-android.sh scripts/build-local-ios.sh
   ```

---

## Configuration

The application requires configuration variables matching your Supabase backend environment.

1. **Create Environment File**
   Copy the example file to `.env.local` for development and preview profiles, or `.env.production` for production builds:

   ```bash
   cp .env.example .env.local
   ```

2. **Add Environment Variables**
   Open your copy of `.env.local` and populate the details:

   ```env
   # Required Supabase parameters
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Optional Google OAuth Client Identifier (Set up in Supabase Auth providers)
   # EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
   ```

---

## Running the Project

Run all execution commands from the project root directory.

### Start the Development Server

```bash
npm start
# OR: npm run start
```

_Press `a` to open the app in an Android emulator/device, or `i` to open in iOS simulator/device._

### Running Target Platform Runtimes

```bash
npm run android  # Start development server and run on Android
npm run ios      # Start development server and run on iOS
npm run web      # Start development server and run on Web
```

### Checking and Quality Tools

```bash
npm run typecheck    # Validate TypeScript declarations compiles successfully
npm run lint         # Check codebase for ESLint violations
npm run lint:fix     # Automatically fix eligible linting issues
npm run format       # Prettify the codebase using Prettier config
npm run format:check # Verify if any files violate formatting rules
npm run test         # Run unit and integration tests using Jest
```

---

## Build and Deployment

CusOwn uses **EAS Local Builds** to compile native applications directly on your development machine, avoiding queue times on EAS cloud services.

### Local Android APK Compilation

To generate a standalone APK:

```bash
# Default preview build (loads .env.local)
./scripts/build-local-android.sh

# Production build (loads .env.production)
./scripts/build-local-android.sh production

# Run prerequisite checks only (useful for new system setups)
./scripts/build-local-android.sh --check-only

# Dev client compilation (runs inside native client with Metro active)
./scripts/build-local-android.sh development

# Clean build (clears EAS cache, slower but resolves compilation issues)
./scripts/build-local-android.sh --clean-cache
```

_Output artifact will be written to `build-_.apk`.\*

### Local iOS IPA Compilation

To generate an iOS IPA application package (macOS only):

```bash
# Default preview build (loads .env.local)
./scripts/build-local-ios.sh

# Production build (loads .env.production)
./scripts/build-local-ios.sh production

# Check Xcode environment and configuration
./scripts/build-local-ios.sh --check-only
```

_Output artifact will be written to `build-_.ipa`.\*

---

## Scripts/Commands

| Command                            | Action                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| `npm start`                        | Launches the Expo dev server                                      |
| `npm run android`                  | Runs development build on a connected Android device or emulator  |
| `npm run ios`                      | Runs development build on an iOS simulator or connected iPhone    |
| `npm run web`                      | Launches the application in the web browser                       |
| `npm run typecheck`                | Compiles TypeScript with `--noEmit` to check type safety          |
| `npm run lint`                     | Inspects code files for syntax and stylistic errors               |
| `npm run lint:fix`                 | Automatically fixes style errors where supported                  |
| `npm run build`                    | Alias for `npm run typecheck`                                     |
| `npm run test`                     | Executes unit tests with Jest                                     |
| `npm run build:android`            | Wrapper executing the local Android compilation script            |
| `npm run build:android:production` | Wrapper executing the production local Android compilation script |
| `npm run build:ios`                | Wrapper executing the local iOS compilation script                |
| `npm run format`                   | Runs Prettier formatters on all source files                      |
| `npm run format:check`             | Verifies formatting without altering files                        |

---

## Contributing

1. **Format & Quality Rules**: Ensure code passes typechecks, lint checks, and formatting rules before committing.
2. **Feature Placement**:
   - UI Screens go to `src/features/*/screens/`.
   - Domain UI components go to `src/features/*/components/`.
   - Shared design primitives go to `src/components/ui/`.
   - Supabase DB queries should go into `src/services/supabase/`. Use `api.service.ts` as the primary facade.
3. **Branch & Commit Standard**: Commits must trigger hooks successfully. Keep changes atomic.

---

## License

This project is proprietary and private. All rights reserved. Code and assets cannot be distributed or used without prior consent from the repository owner (`karthiknaramala9949`).
