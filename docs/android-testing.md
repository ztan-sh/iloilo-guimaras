# Android testing APK

The current development environment has testing mode disabled: the frontend was rebuilt with all preview flags false and synced to Android. The installed Build 7 testing APK and its archived download retain their compiled sample-data mode; changing local `.env` files does not update an installed APK. The build instructions below explicitly opt back into sample mode.

The Client frontend can be packaged using the existing Capacitor Android project. The testing build launches the sample Client dashboard and includes the Staff/Admin preview links for ID review. It runs from bundled assets without a backend or a Vite server. Payments and bookings use the existing in-memory preview store; restarting the app resets sample data.

The build uses a separate Android application ID, `com.guimarasgo.ticketing.testing`, the launcher name **GuimarasGo Test**, and an orange **T** icon. Its version suffix includes the build number, and the preview banner displays that same number. The production application ID and release configuration remain unchanged.

## Build again

Install dependencies in `client` and provide Java 21 plus an Android SDK with platform 36 and the required build tools. With those tools configured:

```sh
cd client
npm run apk:test
```

For this Mac, the build tools were downloaded temporarily under `/tmp/guimaras-apk-tools`. While those files remain available, use:

```sh
cd client
JAVA_HOME=/tmp/guimaras-apk-tools/jdk/Contents/Home \
ANDROID_HOME=/tmp/guimaras-apk-tools/android-sdk \
ANDROID_USER_HOME=/tmp/guimaras-apk-tools/android-user \
GRADLE_USER_HOME=/tmp/guimaras-apk-tools/gradle-cache \
npm run apk:test
```

The script builds Vite with the Client, Staff and Admin preview flags, `VITE_TEST_APK=true`, and the build number in `VITE_TEST_BUILD`. It syncs web assets into Capacitor and runs `:app:assembleDebug -PclientPreview=true -PpreviewBuildNumber=<number>`. Each successful build increments the previous artifact's version code and creates a versioned filename such as `artifacts/GuimarasGo-testing-7.apk`. It also updates `artifacts/GuimarasGo-testing.apk` and writes the version, timestamp, size and SHA-256 to `artifacts/GuimarasGo-testing.json`. Java/SDK downloads are not part of the script. These artifacts are ignored by Git.

## Install and test

Transfer the newest versioned APK to an Android phone and open the downloaded file. If Android asks, allow installation from the app used to open the APK. Tap **Install** or **Update**, then **Open** in the installer. This installs separately from the original app as **GuimarasGo Test**, with an orange **T** icon. Build 7 should open Sarah's updated sample dashboard with the banner **GuimarasGo Test · Build 7**. No login or real payment is needed. Downloading an APK alone does not update an installed app.

For this session, a local download server is running at http://192.168.1.13:8765/GuimarasGo-testing-7.apk. Connect the phone and Mac to the same Wi-Fi and keep the Mac awake until the download finishes. The Mac's address changed from the previous session; use the current link. Once installed, the sample app runs from its bundled assets. To restart the download server from the repository root:

```sh
python3 -m http.server 8765 --bind 0.0.0.0 --directory artifacts
```

Test the four bottom navigation buttons, vessel/date selection, booking and companions, regular/discounted fares, sample payment outcomes, QR boarding passes, profile and ID-photo picker. On the schedule screen, tap the vessel name to change the travel date or vessel; its back button returns to the dashboard. Use the preview Reset button to restore the sample state. Staff review and Admin links share changes within the running app.

To install using Android platform tools with a connected, authorized device:

```sh
adb install -r artifacts/GuimarasGo-testing.apk
```

The generated APK is a debug build. To return to the normal web/native flow, run `npm run build` without preview flags and then `npx cap sync android` before building Android again. The Client-dashboard redirect is active only when `VITE_TEST_APK=true` is compiled into the web assets; it does not depend on the native bridge being initialized.

## Verified build

- Package: `com.guimarasgo.ticketing.testing`; launcher: **GuimarasGo Test**; version: `1.4-preview.7` (code 7).
- Minimum Android API: 24 (Android 7.0); target/compile API: 36.
- Size: 48,085,423 bytes; SHA-256: `515ef602b9441450e0721120ba693df2caddd37f583151e82e5408172bf49540`.
- Gradle app assembly succeeded; APK v2 debug signature verified with the same signer as the preceding testing builds; ZIP integrity passed. All 177 bundled frontend files matched the Build 7 Vite output when generated, including the six new dashboard assets. The current `dist` and Android asset directories have subsequently been rebuilt for normal mode. No remote development-server URL is configured in the archived APK.
- All 18 frontend unit tests passed. The updated dashboard passed at 320, 375, 402 and 430 pixels, including original artwork dimensions, Figma header/card geometry, all three vessel links, fixed header with a scrollable list, last-card reachability, profile, notifications and dark mode. The four liquid-glass navigation contours and moving crest passed. Build 7 checks passed preview startup with and without a native bridge, the build-number banner, all four main tabs, configured fare, sample payment and QR boarding pass, with no backend requests or runtime errors. Earlier checks cover the corrected schedule and the normal production landing page.

Physical-device installation, camera capture and native PDF downloading still require Android-phone verification. PDF downloading was previously verified in the browser preview.
