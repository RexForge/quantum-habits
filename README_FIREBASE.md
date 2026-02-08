# Firebase Setup Instructions

To enable the social features (Feed, Authentication, Posting), you need to configure Firebase.

1.  **Create a Firebase Project**
    *   Go to [console.firebase.google.com](https://console.firebase.google.com/)
    *   Click "Add project" and follow the steps.

2.  **Enable Authentication**
    *   Go to **Authentication** > **Sign-in method**.
    *   Enable **Google** provider.
    *   Enable **Anonymous** provider (optional, for guest access).

3.  **Create Firstore Database**
    *   Go to **Firestore Database**.
    *   Click "Create database".
    *   Choose "Start in test mode" (for development) or set up proper security rules.

4.  **Get Configuration**
    *   Go to **Project Settings** (gear icon).
    *   Scroll down to "Your apps".
    *   Click the web icon (</>) to create a web app.
    *   Copy the `firebaseConfig` object.

5.  **Update Code**
    *   Open `src/lib/firebase.js`.
    *   Replace the placeholder `firebaseConfig` with your actual config from step 4.

## Data Structure (Auto-created)
*   **users**: Profiles linked to Auth UIDs.
*   **posts**: Social feed posts.
