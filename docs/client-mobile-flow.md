# Client mobile flow

Implemented from the Client section (92:70) of [commission GuimarasGO](https://www.figma.com/design/3wPWM2XOyqMX1dSp4cC3y6/commission-GuimarasGO?node-id=92-70). The mobile design changes the React frontend. The existing Capacitor Android project now supports a separate [testing APK build](android-testing.md) using the sample Client flow. No backend changes or native release build were made in this pass.

## Test locally

The default environment now uses the normal authenticated flow. `client/.env` disables Client, Staff and Admin previews and `VITE_TEST_APK`, and points to the API on port 5001. The local Client login is http://localhost:5173/login. MongoDB connectivity, login gating, CORS and disabled preview routes were verified. The previous sample-data preview server was stopped. Both real `.env` files remain ignored by Git; `.env.example` contains no credentials.

For an intentional design preview, use a 402 × 874 browser device viewport for the closest Figma comparison. No backend or login is required for preview screens.

To start it again from `client`:

```sh
VITE_CLIENT_PREVIEW=true VITE_STAFF_PREVIEW=true VITE_ADMIN_PREVIEW=true npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

These flags gate the preview routes. Omit them for the normal app. Preview sample data is held in memory and is reset by a full reload or any role’s Reset button. Use the Client/Staff/Admin links to switch roles while retaining preview changes. Real authentication tokens are left intact by preview actions.

### Test on your phone over Wi-Fi

To enable the optional phone preview again, connect the phone and Mac to the same Wi-Fi and start the command below. Then open http://192.168.1.13:5175/preview/client/dashboard in Safari or Chrome and leave the Mac awake. No backend is needed for this sample-data preview.

To restart that preview from `client`:

```sh
VITE_CLIENT_PREVIEW=true VITE_STAFF_PREVIEW=true VITE_ADMIN_PREVIEW=true npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

If the Mac's Wi-Fi address changes, use the Network URL printed by Vite with `/preview/client/dashboard` appended. Preview changes stay in one browser session; a phone and Mac do not share sample bookings. Use the Staff/Admin links in the same phone browser to review its sample IDs. Client and operations IDs support local HTTP previews without requiring `crypto.randomUUID`.

1. Select a vessel, departure, vehicle and passenger count. The seeded Sarah account requests a Student discount; either approve its sample ID in Staff review or choose “Continue at regular fare.”
2. Add a companion or edit the profile to test age 60+, Student and PWD eligibility. Use Gender → Choose to open the full-screen picker; Done saves the choice and Cancel leaves the form unchanged. Take ID photo opens the device camera or file picker. Photos are checked for supported type and a 5 MB limit. They remain in preview memory.
3. Use Staff review to approve the matching ID or request a clearer photo, then return using Client preview. Each requested ID must be approved before discounted payment. Approval does not confirm a booking.
4. Pay creates a sample processing payment. The clearly labelled controls above the confirmation screen simulate Paid, Processing or Failed. Confirmed payments unlock the QR boarding pass and PDF download. Processing and Failed do not.
5. Open processing and failed records in Payment history to see their details. Processing returns to history; failed payments offer a new trip. Paid records open the boarding pass. Test the four history filters, tickets, notifications/read filters, profile editing, preferences, authentication loading and reset confirmation. Replay splash runs the Figma 4.65-second animation; reduced motion skips it.

## Design coverage

| Figma nodes | Implemented screen or state |
| --- | --- |
| 191:12212 | Splash, coordinated waves/ripples/droplets/logo/login reveal |
| 232:369, 241:997 | Login, validation, loading |
| 232:370, 241:998, 363:4127 | Registration, loading, age-60+ ID requirement |
| 232:371, 232:372 | Password-reset dialog and preview confirmation |
| 1:1521 | Vessel dashboard and floating bottom navigation |
| 1:1591 | Vessel schedules, date, direction, available spaces |
| 1:1724, 315:2664, 315:3048 | Booking, motorcycle, companions, individual discount decisions |
| 1:1817, 315:2893, 315:3277 | Payment and corresponding fare summaries |
| 1:1868 | Confirmed payment, plus processing and failed outcomes |
| 1:154, 122:1682, 486:4579 | Refined boarding pass, original route/ferry artwork, perforated QR panel, dynamic reference QR, PDF |
| 82:932, 92:210, 92:300, 92:390 | Payment history: All, Paid, Processing, Failed |
| 465:4574, 465:4581 | Processing and failed payment-detail dialogs |
| 82:2319, 106:189, 106:190 | Profile, edit profile, language preference |
| 324:3542, 324:3576, 324:3610 | ID capture, review, required photo |
| 324:3648, 324:3687, 324:3720 | Awaiting review, approved, clearer photo requested |
| 357:3863 | Registration age keypad |
| 437:4673 | Passenger gender picker for registration, profile and companions |
| 379:4058, 379:4137 | Notifications: All and Unread |

The code uses Geist, the Client ink/aqua/surface/accent palette, shared input/action/panel/navigation components, original vessel art and SVG assets. Static map, ferry, pins and avatar artwork were exported from the original Figma layers; the map's departure/arrival labels follow the booked direction. The refined pass uses the original orange vessel shape and paper perforation. At the user's request, the bottom navigation now uses a glass-style CSS bar and a moving orange lens with the original Figma icon assets. Boarding passes show the actual route, date and available vessel name. Code Connect map access was unavailable for the connected Figma seat; Material 3 placeholders returned no usable React import, so original artwork and local components were used. QR content is generated from the booking reference with the GO mark at its center. Device status bars and home indicators belong to the operating system and are not duplicated in the app.

Gender selection keeps unsaved registration, profile and companion fields intact. Payment dialogs display the selected record's reference, method and configured amount. Native dialogs trap focus, support Escape and return focus when closed; entry animation respects reduced motion. The centered GuimarasGo prototype helper and backup boarding frames are not separate app pages.

The navigation lives in `MobileNav.jsx` and stays mounted in `MobileState.jsx` while switching Home, Payment history, My tickets and Profile. Following the user's four-state reference, the bar retains a 75-pixel capsule with a 10-pixel raised curve above the selected circle. Its end caps rise when Home or Profile is selected. GSAP moves one solid orange lens, stretches it during travel and settles it over the selected icon in 0.58 seconds; the bar contour follows that same movement on every frame. Rapid taps interrupt the current movement and head to the latest tab; browser back/forward also updates it. Resize and reduced-motion changes align both the lens and curve immediately. All four 64-pixel controls fit inside the bar, with bottom safe-area spacing and a dark-mode surface. Browser verification covers all four curve positions, curve alignment during travel, rapid switching, back/forward, reduced motion and widths from 320 to 430 pixels plus the desktop preview.

The October 12 dashboard refresh follows the updated frame `1:1521`, as confirmed by the user. It uses the `#efefef` surface, compact avatar and notification bell, revised header spacing, original 354 × 258 curved vessel silhouettes, a 12-pixel overlap, orange and white card treatments, upright Geist vessel names, and the original ferry cutout and downward chevrons. The vessel list scrolls independently of the greeting and includes the Figma 96-pixel tail so the last vessel remains reachable above the navigation. Cards scale their original artwork to the available width; small-phone captions are adjusted for readability. Each card displays its actual vessel name and availability and opens that vessel's schedule. Profile, notifications, dark mode and the existing GSAP navigation remain functional. All six new assets are bundled locally. The 13-node read-only [dashboard audit](client-dashboard-design-audit.json) and [structural evidence](client-dashboard-audit-evidence.json) record the inspected scope. Verification passed at 320, 375, 402 and 430 pixels, all vessel links and independent scrolling, plus 18 frontend tests and the packaged Build 7 flow. Browser evidence is under `/tmp/guimaras-dashboard-refresh` for this session.

The schedule screen was rechecked against frame `1:1591` after the user's screenshot. It now uses the original back/bell controls, 20% dark image overlay, Libre Bodoni greeting and Arimo vessel name, 226-pixel hero, 55-pixel direction strip and 112-pixel departure rows. The next available departure has the Figma countdown column, calculated from its actual Manila date/time. Capacity chips retain the configured totals and current online availability. Afternoon times use the 24-hour clock to keep them unambiguous without adding AM/PM to the compact layout. The route line displays the known crossing duration; it does not invent a live vessel countdown. Tap the vessel name to open the date/vessel sheet. The dashboard toolbar and bottom navigation are omitted on this frame; its back button returns to vessel selection. Original switch, car, bell and back artwork is bundled locally. Verification covers image dimensions, four phone widths, countdown, date/vessel changes, reversed direction and departure selection, with 18 frontend unit tests passing.

Configured fares are retained: ₱40 per passenger, ₱150 motorcycle surcharge, ₱65 PPA per booking. Preview pricing follows the chosen vessel’s Admin prices. Approved discounts apply to each eligible passenger fare, excluding motorcycle and PPA charges. Limits remain 100 passenger spaces and 10 motorcycles per preview trip, with the existing two walk-in motorcycle spaces. Solo/companion/motorcycle groups allow at most 10/10/3 passengers. New bookings snapshot their fare; changing Admin prices does not alter paid receipts. Pending sample payments reserve spaces; failed payments release them.

## Existing live API boundary

Normal routes use passenger authentication and the existing `/auth/me`, `/auth/profile`, `/auth/password`, `/auth/notifications`, `/bookings/my` and `/bookings/schedules/available` contracts. Payment uses the existing Maya/QRPh merchant QR, `/payment/upload-proof` and `/payment/create-booking`, with no automatic payment verification. Normal GCash/Mastercard gateways, ID submission/review and password-reset sending remain unavailable because those services do not exist. The preview never calls them.

Age/gender/category are device-local passenger preferences because the current account API stores name, email and phone. Language is saved as a preference; translations beyond English are pending. New notification screens show account-owned booking updates, and preview ID events are restricted to the account and its booking passengers. The current payment controller does not yet persist all of the supplied vessel/companion/fare-snapshot metadata; completing that live cross-role persistence requires a separate backend pass.

Implementation lives in `client/src/pages/passenger/mobile`. Legacy passenger files are retained. Public passenger routes now use the new mobile components; Staff/Admin previews share the existing operations store. To undo the mobile pass, restore the passenger route imports/entries in App.jsx, remove the new mobile directory and Client image assets, and remove the Client preview links, mobile test file and viewport-fit addition. Preserve prior Staff/Admin work.

Structural review: [Client design-system audit](client-mobile-design-audit.json), with the latest 11-node sample in [audit evidence](client-mobile-audit-evidence.json). Earlier implementation verification covered the existing Client screens, cross-role ID review and mocked live API contracts. The latest refresh passes 17 frontend unit tests and the production build, gender commit/cancel with unsaved form preservation, processing/failed details, a decoded GO-branded QR, PDF downloads and boarding-pass layouts at 320, 375, 402 and 430 pixels. The new picker and payment dialogs pass 12 responsive checks across those widths, plus keyboard focus containment, Escape dismissal and focus return. The Wi-Fi HTTP check covers companion selection, configured ₱145/₱105 totals, processing ticket guards, failed-payment retry and a confirmed reverse-route pass. Latest browser harnesses and screenshots are in `/tmp/guimaras-client-refresh` for this session.
