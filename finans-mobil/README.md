# Dumut Expo React Native Mobile Client

This directory contains the cross-platform mobile application codebase for the Dumut ecosystem, built using React Native and Expo.

---

## Architectural Details and Components

The client manages key modules:
*   **Virtual Pet Engine:** Powered by React Three Fiber and Three.js for displaying interactive 3D companion animations.
*   **Geospatial Tracking:** Visualizes transactional data point clusters utilizing map layers.
*   **Voice Recorder Interface:** Employs Expo-AV to record user audio commands, convert them to files, and transmit them as base64 strings to the processing APIs.
*   **Dynamic Dashboard (Widgets):** Features customizable dashboard tiles supporting layout configurations for user preferences.
*   **State Architecture:** Manages user credentials, authentication statuses, levels, and application states through clean React Contexts.

---

## Setting Up and Running

### Prerequisites
*   Node.js 18+ and npm
*   Expo Go app on iOS/Android or native simulators

### Installation steps

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure API URLs:**
    Modify the configuration entries inside `src/config.ts`:
    ```typescript
    export const config = {
      apiUrl: 'http://your-computer-ip:3000/api/v1', // Point to backend gateway
      googleClientId: '',
      googleIosClientId: '',
      googleAndroidClientId: '',
    };
    ```

3.  **Start the compiler:**
    ```bash
    npx expo start
    ```
    *   Press `a` to load on an Android Emulator.
    *   Press `i` to launch on an iOS Simulator.
    *   Scan the terminal QR code with your phone camera (iOS) or Expo Go app (Android) to execute directly on hardware.

---

## Directory Contexts

*   `src/api/`: Handles networking interfaces using Axios interceptors to automatically insert authorization tokens and rotate refreshed sessions.
*   `src/components/`: Modular UI elements like cards, custom buttons, inputs, and toast indicators.
*   `src/context/`: Authentication state provider keeping trace of onboarding parameters.
*   `src/navigation/`: Route stacks for Onboarding workflows, Authentication steps, and Core tabs (Dashboard, Assistant, Markets, Social).
*   `src/screens/`: Layout screens for transaction logging, level statuses, collaborative savings groups, and chat pages.
*   `LEVEL_SYSTEM.md`: Contains extensive specifications for leagues, streaks, and XP points calculations.
