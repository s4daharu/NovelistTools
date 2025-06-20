
# Novelist Tools

Novelist Tools is a web application offering a suite of utilities for authors, particularly those working with EPUB files and a custom JSON-based novel backup format. It is designed to be easily packaged as an Android mobile application using Capacitor and now includes integration with core Capacitor plugins. It is also configured as a Progressive Web App (PWA).

## Features

*   **EPUB Chapter Splitter:** Upload an EPUB and split it into individual or grouped chapter text files.
*   **Novel Backup Utility:** Create, extend, merge, and find/replace within custom JSON novel backup files. (Note: These are now individual tools on the dashboard).
*   **ZIP to EPUB Converter:** Convert a ZIP archive of text files into a valid EPUB file.
*   **EPUB to ZIP (TXT) Converter:** Extract chapter content from an EPUB into a ZIP of text files.
*   **Create Backup from ZIP:** Generate a novel backup file from a ZIP of text chapters.
*   **Augment Backup with ZIP:** Add chapters from a ZIP file to an existing backup.
*   **Mobile-Friendly UI:** Responsive design with touch gesture support for sidebar navigation.
*   **PWA Enabled:** Can be installed to the home screen and offers offline capabilities for cached assets.
*   **Capacitor Integration (Android):**
    *   Native Status Bar styling.
    *   Haptic feedback for interactions.
    *   Native file saving for downloads via Capacitor Filesystem to the app's private external storage (in a `Downloads/` subfolder, aiming for MediaScanner visibility) and attempts to open files with FileOpener.
    *   Custom Android back button handling.

## Prerequisites

*   **Modern Web Browser:** For PWA usage.
*   **(Optional for Android Build) Node.js and npm (or yarn):** Required for installing Capacitor and its dependencies. Download from [nodejs.org](https://nodejs.org/).
*   **(Optional for Android Build) Android Studio:** Latest stable version recommended for Android builds. Download from [developer.android.com/studio](https://developer.android.com/studio).
*   **(For GitHub Pages Deployment) esbuild:** A JavaScript bundler used to compile the TypeScript code. Install globally: `npm install -g esbuild` or as a dev dependency: `npm install --save-dev esbuild`.
*   **(For GitHub Pages Deployment) Git:** For version control and pushing to GitHub.

## Deploying to GitHub Pages (Step-by-Step Guide)

This guide will walk you through compiling the application and deploying it as a live website using GitHub Pages, making it accessible as a PWA. Before you begin, ensure you have the necessary tools listed in the "Prerequisites" section above (specifically Git, Node.js/npm, and esbuild).

### Step 1: Prepare Your Project Files

1.  **Compile TypeScript to JavaScript:**
    *   Open your terminal or command prompt in the project's root folder.
    *   If you installed `esbuild` as a development dependency (recommended), run:
        ```bash
        npx esbuild index.tsx --bundle --outfile=index.js --format=esm --platform=browser
        ```
    *   If you installed `esbuild` globally, you can run:
        ```bash
        esbuild index.tsx --bundle --outfile=index.js --format=esm --platform=browser
        ```
    *   This command bundles `index.tsx` and all its imported TypeScript modules (like those in the `ts/` directory) into a single `index.js` file in your project's root. The `--platform=browser` flag ensures browser compatibility.

2.  **Ensure All Necessary Files Are Present:**
    Verify that the following files and folders are present in the root of your project directory. These are the files GitHub Pages will serve:
    *   `index.html` (main page)
    *   `index.css` (styles)
    *   `index.js` (compiled JavaScript from Step 1.1)
    *   `jszip.min.js` (JSZip library, crucial for EPUB/ZIP operations)
    *   `manifest.json` (PWA manifest)
    *   `service-worker.js` (PWA service worker)
    *   `icons/` (folder containing all application icons as specified in `manifest.json`)
    *   (Optional but good practice) `README.md` (this file)

### Step 2: Create a GitHub Repository

*   Go to [GitHub.com](https://github.com/) and log in or sign up.
*   Create a new repository. You can name it, for example, `novelist-tools-pwa`. You can choose to make it public or private (GitHub Pages works with public repositories by default on the free plan; private repositories may require GitHub Pro or specific configurations for Pages).

### Step 3: Add and Commit Your Files to Git

1.  **Initialize Git in your project folder (if not already a Git repository):**
    Open your terminal in the project's root folder and run:
    ```bash
    git init
    ```
2.  **Connect your local repository to the GitHub repository:**
    Replace `<your-username>` and `<repository-name>` with your actual GitHub username and the repository name you created in Step 2.
    ```bash
    git remote add origin https://github.com/<your-username>/<repository-name>.git
    ```
3.  **Add all project files to Git's staging area:**
    ```bash
    git add .
    ```
4.  **Commit the files:**
    ```bash
    git commit -m "Initial project setup for GitHub Pages deployment"
    ```

### Step 4: Push to GitHub

1.  **Set your default branch name (if needed):**
    GitHub's default branch name is often `main`. If your local default branch is `master` (common in older Git versions), you might want to push to `main` on GitHub.
    To push your current local branch to `main` on GitHub:
    ```bash
    git push -u origin HEAD:main  # Pushes current branch to 'main' and sets up tracking
    ```
    If your local branch is already `main`, you can simply use:
    ```bash
    git push -u origin main
    ```

### Step 5: Configure GitHub Pages

1.  Go to your repository on GitHub.com.
2.  Click on the **Settings** tab (usually near the top of the repository page, look for a gear icon).
3.  In the left sidebar of the Settings page, navigate to the **Pages** section (under "Code and automation").
4.  Under the "Build and deployment" heading:
    *   For **Source**, select "Deploy from a branch".
    *   Under **Branch**:
        *   Select the branch you pushed your code to (e.g., `main`).
        *   Ensure the folder is set to `/(root)`.
5.  Click **Save**.

### Step 6: Access Your Deployed App

*   GitHub Pages will now start building and deploying your site. This process might take a few minutes. You can often see the progress or status on the same "Pages" settings screen.
*   Once deployed, the URL for your live site will be displayed at the top of the 'GitHub Pages' settings section. It will typically be in the format: `https://<your-username>.github.io/<repository-name>/`.
*   Visit this URL in your browser. You should see your Novelist Tools application!
*   **PWA Functionality:** Since `manifest.json` and `service-worker.js` are included and correctly referenced in `index.html`, the site should also function as a PWA, allowing users to "install" it to their home screen on supported devices and browsers.

### Updating Your Deployed App

If you make further changes to your application (e.g., update TypeScript code, styles, or HTML):
1.  **Re-compile your TypeScript:** Run the appropriate `esbuild` command from Step 1.1 again.
2.  **Commit your changes:**
    ```bash
    git add .
    git commit -m "Describe your updates here"
    ```
3.  **Push the changes to GitHub:**
    ```bash
    git push
    ```
GitHub Pages will automatically detect the new push to your configured branch and redeploy your site with the latest changes. This might also take a few minutes.

## Capacitor Integration Guide for Android

Follow these steps to package Novelist Tools as a native Android mobile application using Capacitor.

### 1. Install Capacitor CLI

If you haven't already, install the Capacitor CLI globally:

```bash
npm install -g @capacitor/cli
```

### 2. Initialize Capacitor in Your Project

Navigate to the root directory of the Novelist Tools project in your terminal and run:

```bash
# First, ensure your web assets (index.html, index.js, index.css, jszip.min.js, icons/) are in the root.
# If you have a build step that outputs to a 'dist' folder, use --web-dir=dist.
# For this project, if running from the root without a separate build output folder:
npx cap init "Novelist Tools" "com.novelisttools.app" --web-dir=.
```

*   **App Name:** "Novelist Tools" (or your preferred name)
*   **App ID:** A unique identifier for your app (e.g., `com.yourdomain.novelisttools`)
*   **`--web-dir=.`**: This explicitly sets your web asset directory to the current project root. If you *do* have a build process that outputs to a folder like `dist/`, then use `--web-dir=dist` and ensure all necessary assets (including `jszip.min.js` and `icons/`) are copied there by your build.

This will generate a `capacitor.config.ts` (or `.json`) file.

### 3. Install Core Capacitor Packages & Android Platform

Install the necessary Capacitor core and Android platform packages in your project:

```bash
npm install @capacitor/core @capacitor/android
```

### 4. Add Android Platform

Add the Android native platform to your project:

```bash
npx cap add android
```
This will create an `android` folder in your project, containing the native Android project files.

### 5. Install Essential Capacitor Plugins

The following plugins are **now integrated** into the application's TypeScript code. Ensure they are installed in your project:

```bash
npm install @capacitor/app @capacitor/filesystem @capacitor/haptics @capacitor/status-bar
npm install @awesome-cordova-plugins/file-opener cordova-plugin-file-opener2
```
For `@awesome-cordova-plugins/file-opener`, you need both the npm package and the Cordova plugin.

Consider also these for enhanced native feel:
```bash
npm install @capacitor/keyboard @capacitor/splash-screen
```

### 6. Example `capacitor.config.ts`

Your `capacitor.config.ts` file is crucial. Here's an example configuration. You should customize `appId` and `appName`. The `webDir` should match your web asset directory.

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novelisttools.app', // Replace with your actual App ID
  appName: 'Novelist Tools',    // Replace with your actual App Name
  webDir: '.', // IMPORTANT: This should be '.' if your index.html is in the root. Or 'dist' if you build to a dist folder.
  bundledWebRuntime: false, 
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true, 
      backgroundColor: "#111111", 
      androidSplashResourceName: "splash", 
      androidScaleType: "CENTER_CROP", 
      showSpinner: true,
      androidSpinnerStyle: "large", 
      spinnerColor: "#0097a7", 
    },
  }
};

export default config;
```

### 7. Important: JSZip Library

The application's PWA setup (`index.html` and `service-worker.js`) already references a local `jszip.min.js`.
Ensure `jszip.min.js` is in your project root (or the specified `webDir` if different) for Capacitor to correctly bundle it.
The script tag in `index.html` is:
```html
<script src="jszip.min.js"></script>
```
This path must be correct relative to `index.html` within your `webDir`.

### 8. Build/Prepare Your Web Assets

Ensure your `index.js` (compiled from `index.tsx`), `index.css`, `jszip.min.js`, `manifest.json`, `service-worker.js`, and `icons/` folder are correctly placed in the `webDir` (project root or `dist/` if configured).

### 9. Sync Web Assets with Capacitor

After making any changes to your web code or installing/updating plugins, you need to sync these changes with the Android project:

```bash
npx cap sync android
```
This command copies your web assets from your configured `webDir` to the Android platform directory and updates plugin configurations.

### 10. Open Android Project in Android Studio

Open the native Android project in Android Studio:

```bash
npx cap open android
```

### 11. Run on Device or Emulator

Once the project is open in Android Studio:

*   Let Gradle sync complete.
*   Select a target device or emulator.
*   Click the "Run" button.

## Important Considerations for Android Apps

*   **App Icons and Splash Screens:**
    *   Capacitor uses native Android mechanisms. Generate assets and place them in `android/app/src/main/res/`.
    *   Tools like Android Studio's "Image Asset Studio" or `npx @capacitor/assets generate` can help.
*   **Native Permissions & File Storage (Important for Android 10+):**
    *   The app uses `Directory.External` within the app's sandboxed external storage (`Android/data/YOUR_APP_ID/files/Downloads/`). This is compliant with Scoped Storage. `FileOpener` is used to provide immediate access.
*   **Offline Storage:**
    *   The PWA service worker handles asset caching. For user settings, consider Capacitor's Storage API (`@capacitor/preferences`).
*   **Debugging:**
    *   Use Chrome DevTools (`chrome://inspect`) for web content debugging in Capacitor.

This guide should help you get Novelist Tools running as an Android mobile application with Capacitor!
