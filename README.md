# HabitForge - Mobile Habit Tracker

A beautiful, mobile-first habit tracking app built with React, Vite, Tailwind CSS, and Capacitor for cross-platform mobile deployment.

## Features

- **Task Management**: Create, edit, and track tasks with start/end times, priorities, categories, and notes
- **Habit Tracking**: Build and maintain daily habits with streak counters and completion tracking
- **Multiple Views**: Clock view (arc/pie), calendar view, habits dashboard, and statistics
- **Mobile Native Features**:
  - Native push notifications for reminders
  - Camera integration for task photos
  - Location tracking for tasks
  - Haptic feedback on interactions
- **Responsive Design**: Optimized for mobile and desktop
- **Themes**: Light and dark mode support
- **Data Persistence**: Local storage for all data
- **Customization**: Colors, icons, clock styles, and more

## Development

### Web Development
```bash
npm install
npm run dev
```

### Mobile App Development

This app can be built as a native mobile app using Capacitor.

#### Prerequisites
- Node.js and npm
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

#### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Sync to mobile platforms:
   ```bash
   npm run cap:sync
   ```

#### Android
1. Install Android Studio from https://developer.android.com/studio
2. Open the Android project:
   ```bash
   npm run cap:android
   ```
3. In Android Studio, build and run on emulator or device

#### iOS (macOS only)
1. Install Xcode from App Store
2. Add iOS platform:
   ```bash
   npx cap add ios
   ```
3. Open in Xcode:
   ```bash
   npx cap open ios
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run cap:build` - Build and sync to mobile
- `npm run cap:android` - Open Android project in Android Studio
- `npm run cap:sync` - Sync web assets to all platforms

## Technologies Used

- React 19
- Vite
- Tailwind CSS
- Capacitor
- Lucide React (icons)
