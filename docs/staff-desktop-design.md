# Staff desktop implementation

**Latest update:** See [Staff and Admin desktop update](staff-admin-flow-update.md) for the newly added pages, current routes and connected preview workflows. This document records the original Staff implementation.
Source: [Staff · Desktop flow](https://www.figma.com/design/3wPWM2XOyqMX1dSp4cC3y6/commission-GuimarasGO?node-id=250-15069).

## Audit

No supported design-system integration issues found in the inspected sample. Confidence: 88%.

The linked URL initially targeted the Admin flow (`250:14159`). The Staff section (`250:15069`) was selected in Figma and matches the requested scope. All eight screen hierarchies and their 177 instances were inspected. Node-level bindings were sampled on the sign-in introduction, hero typography, sidebar, active navigation, repeated panel tray, input instances and capacity track/fill. These use the file's own Desktop and Client families, shared typography styles, and variables. The inspected components are local to this file; their publication status was not established.

| Reused family | Source node | Component key |
| --- | --- | --- |
| Desktop / GO brand mark | 169:1143 | 76c11ed6da6bbe57f4342afa739d1d6691270b63 |
| Client / Profile input | 105:276 | 1ca266919c916e08098280176643052a7621838a |
| Desktop / Primary button | 168:1175 | 6ad41e48e5d653207b43df7a7a16c675ed819d33 |
| Desktop / Secondary button | 163:443 | 3591c3c01cb16994afb5770637d6daf794521824 |
| Desktop / Metric | 163:439 | 09fb96400e9a603f905f1bd955d9759016b79c04 |
| Desktop / Table cell | 163:436 | 87758cca7167df33e927379458d5c9f157ccd6ed |

This is a sampled binding and override audit. It does not certify every property in the board. Code Connect is unavailable on the connected Pro plan; this does not establish a missing library connection. No Figma nodes were edited.

## Screen mapping

| Figma screen | Node | Development route / state |
| --- | --- | --- |
| Staff · Sign in | 250:15070 | `/staff/login` |
| Staff · Terminal overview | 250:15106 | `/staff/overview` |
| Staff · Verify a ticket | 250:15209 | `/staff/scanner` |
| Staff · Ticket verified | 250:15292 | Successful lookup of a paid, unused ticket for the selected trip |
| Staff · Boarding recorded | 250:15410 | Successful boarding update |
| Staff · Ticket cannot be boarded | 250:15501 | Unpaid, cancelled, rejected, wrong-trip, or used ticket |
| Staff · Walk-in ticketing | 250:15581 | `/staff/walk-in` |
| Staff · Boarding manifest | 250:15692 | `/staff/manifest` |

The implementation uses the existing React/Vite and plain CSS stack. Shared staff primitives and scoped CSS variables carry the Figma palette, Geist typography, radii and spacing. The original Figma SVG assets are downloaded into `client/public/images/staff`; temporary Figma URLs are not used by the application. GSAP provides brief entrance transitions and small-screen reveal motion, with reduced-motion support and lifecycle cleanup. The supplied operational design takes precedence over the gpt-taste skill's marketing hero, marquee, carousel and AIDA layout selections.

## Live behavior and deliberate adaptations

- The user chose to keep existing configured capacities and fares. Capacities come from FerrySchedule; figures and names in Figma are illustrative data. Checkout rates remain ₱40 per passenger, ₱150 per motorcycle, plus ₱65 PPA per ticket.
- Trip selection considers date, direction, vessel and departure time. Manila calendar dates are used for staff operations. Paid totals include every passenger in a group, not just the number of booking records.
- Walk-in motorcycle allocation defaults to zero for existing trips, preserving existing online capacity. An administrator can configure it in the existing schedule form, within the total motorcycle capacity. Passenger-only terminal sales are available without that allocation. Schedule availability deducts the configured walk-in allocation from the online motorcycle quota; passenger counts include both sources. Matching is specific to the crossing, and passenger-only tickets do not consume motorcycle slots.
- Walk-in cash tickets require payment confirmation. The server calculates the fare and checks both paid and pending reservations before issuance. Repeated submissions of the same sale ID return the original ticket. No passenger age, gender or uploaded payment proof is fabricated for terminal tickets.
- Terminal-sale transactions serialize concurrent staff sales for a departure. They require a MongoDB replica set or sharded cluster (including Atlas). The pre-existing passenger payment flow does not participate in this transaction protocol; simultaneous online payment submissions remain an existing capacity-consistency limitation.
- Boarding, rejection and arrival updates are atomic, preventing two staff requests from boarding or timing out the same ticket twice. The previous arrival/time-out and rejection-with-reason actions remain available.
- Camera permission is requested on the scan action. Manual lookup remains available when permission is denied or camera access is unsupported. Streams are stopped on lookup, navigation and logout.
- Responsive layouts, visible keyboard focus, semantic tables, a skip link, accessible dialogs, and a printable issued ticket supplement the desktop reference.

## Validation

Run `npm test` in `server` and `client`, and `npm run build` in `client`. Backend tests use model mocks and schema validation; they do not write to the user's database. Browser checks use controlled API fixtures to exercise the staff flow; live hardware scanning and real database transactions require the deployed environment.

Completed verification: 17 backend tests and 3 client tests passed, the production build passed, and `git diff --check` passed. Browser checks covered sign-in, password visibility, ticket lookup, boarding, used/unpaid/wrong-trip rejection states, arrival confirmation, walk-in cash issuance, refreshed manifest totals, camera-denied fallback, logout, and dialog keyboard behavior. Desktop and mobile screenshots were reviewed at widths from 390 to 1440 pixels, with no page overflow, runtime errors or missing assets. A synthetic-camera check also confirmed live stream startup, explicit stop and cleanup when navigating away from the scanner.
