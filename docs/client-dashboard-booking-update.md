# Client dashboard and booking update · October 14, 2026

Implemented from the current Figma frames in commission GuimarasGO:

| Screen | Figma node |
| --- | --- |
| Client dashboard · Mobile | 1:1521 |
| Mobile book ticket | 1:1724 |
| Mobile book ticket · Big bike question | 610:4701 |

The dashboard uses the original orange, gold and brown vessel silhouettes, white labels and the existing ferry cutout. The navigation now follows Home, My tickets, Payment history and Profile, with the 388 × 87 reference geometry at a 402-pixel viewport and the moving GSAP contour.

Booking uses the compact back/bell header, checkout progress, original 234 × 308.795 ticket silhouette, independently scrolling vehicle and passenger details, and the persistent Continue action. At 402 × 874, the ticket starts at y=222, the details at y=550, and Continue at y=779. Very short phone screens allow the page to scroll so all controls remain reachable. Device status bars and system home indicators remain native.

Selecting Motorcycle opens the centered, accessible big-bike question. Yes selects big-bike; No selects standard. Escape or tapping outside cancels without changing the selection. Both motorcycle types use the configured motorcycle fare and maximum of three passengers; passenger-only bookings permit ten. Switching to a motorcycle trims the passenger list to three, as the existing flow did. The selection survives the booking draft and is sent to checkout as motorcycleType. The booking schema and active payment route retain that value; older motorcycle submissions default to standard.

Configured fares remain passenger ₱40, motorcycle ₱150 and PPA ₱65. A regular passenger-only booking totals ₱105; one regular passenger with either motorcycle type totals ₱255. Figma's illustrative ₱150/₱50 values are not used for charging.

The [structural audit](client-dashboard-booking-design-audit.json) and [evidence](client-dashboard-booking-audit-evidence.json) record the read-only inspected scope. Intentional color overrides are not treated as integration drift.

Validation uses an isolated browser session and intercepted API responses, without creating accounts, payments or bookings in the live database. The 320, 375, 402 and 430-pixel checks cover assets, layout, dialog answers and cancellation, passenger limits, scroll behavior, checkout totals and normal mode. Evidence and screenshots for this session are under /tmp/guimaras-mobile-refresh. All 19 frontend tests and the two focused motorcycle persistence/validation tests pass. The pre-existing backend test “schedule availability reserves the walk-in allocation within the unchanged total” still fails at server/tests/staffFlow.test.js:146 with undefined !== 6; it also fails with the original HEAD Booking model.

Testing flags remain disabled. Use http://localhost:5173/login and a real client account to review the flow. Existing installed APKs do not pick up source changes automatically.

The final navigation checks also pass animated contour movement, rapid tab switching and reduced motion. The dialog and checkout are reachable at 320 × 568. The production build succeeds, and synced Android web assets match it byte for byte.

