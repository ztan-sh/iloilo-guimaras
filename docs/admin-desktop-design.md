# Admin desktop implementation

**Latest update:** See [Staff and Admin desktop update](staff-admin-flow-update.md) for the newly added pages, current routes and connected preview workflows. This document records the original Admin implementation.
Implemented the nine screens in [Admin · Desktop flow](https://www.figma.com/design/3wPWM2XOyqMX1dSp4cC3y6/commission-GuimarasGO?node-id=250-14159). This pass changes the frontend only. The Staff flow remains available.

## Preview

The running local frontend is at **http://localhost:5174/preview/admin/login**. The sample account is prefilled; click **Sign in as Admin**. All preview changes stay in memory. **Reset sample data** or a page reload restores the sample records. Preview sign-in and logout leave real authentication storage untouched.

To start both previews again:

```sh
cd "/Users/ryan/guimaras go/iloilo-guimaras/client"
VITE_STAFF_PREVIEW=true VITE_ADMIN_PREVIEW=true npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

The normal dev command leaves preview routes disabled. Each preview requires its own environment flag and runs only in development or on a local host.

Try selecting another trip in **Schedules**, editing or adding a trip, searching ticket/passenger/system records, and opening **View payment** from a ticket. The sample 11:30 departure demonstrates a full trip and manifest pagination. The date/trip button in the desktop header changes the shared selection across record screens.

## Screens and routes

| Figma frame | Screen | Normal route |
| --- | --- | --- |
| 250:14160 | Admin sign-in | `/admin/login` (also `/admin-login`) |
| 250:14196 | Operations overview | `/admin/overview` |
| 250:14314 | Ferry schedules | `/admin/schedules` |
| 250:14420 | Trip details | `/admin/trips/:tripId` |
| 250:14508 | Ticket records | `/admin/tickets` |
| 250:14631 | Passenger information | `/admin/passengers` |
| 250:14746 | Payment records | `/admin/payments` |
| 250:14854 | Boarding records | `/admin/boarding` |
| 250:14964 | System records | `/admin/records` |

Preview routes replace `/admin` with `/preview/admin`. Adding a trip uses `/trips/new`.

## Design and data

The implementation follows Figma's Geist typography, warm surfaces, orange primary actions, teal navigation, 248px sidebar, 6px panel trays, 24px inner panel padding and 728px/360px detail columns. Buttons, panels, metrics, capacity tracks, notices, dialogs and restrained GSAP motion reuse the Staff primitives. Admin status variants and icons follow the Admin reference. Seventeen downloaded SVG assets retain their native geometry. Reduced-motion preferences disable entrance animation; narrow layouts reflow and tables scroll within their panels.

All trip metrics use the selected date, direction, vessel and departure. Paid manifests exclude pending, rejected and cancelled tickets. Companion rows share their holder's ticket and motorcycle. Revenue uses successful payment amounts; payment records retain processing and failed states separately. The API's reservation count still determines a full/closed trip, since pending bookings can reserve capacity in the existing app.

The preview uses the app's existing 100-passenger/10-motorcycle capacities and fares (₱40 per passenger, ₱150 per motorcycle, ₱65 PPA fee per booking), rather than the illustrative Figma values. Its sample split is 8 online and 2 walk-in motorcycles. Normal screens read each trip's actual configured capacities; saving schedule information preserves those values. Adding a trip copies the selected service's capacities, with the backend's existing defaults when no service is selected.

Normal routes use the existing `/admin/login`, `/admin/me`, `/bookings` and `/bookings/schedules` API contracts. Schedule creation and editing use the existing POST/PUT endpoints. `/admin-dashboard` is retained and linked as **More admin tools** for payment verification, staff management, closures and controls outside the nine-screen Figma flow.

The backend has no dedicated payment-attempt or audit-log endpoint. The normal payment screen represents stored pending/rejected bookings; System records derives the latest payment state and boarding activity from available timestamps. It cannot reconstruct past status changes or schedule edits whose timestamps are absent from the schedule response. The screen states this limitation. Preview schedule changes produce local sample events. Existing schedule edits do not migrate old booking identities; this frontend pass preserves that API behavior.

## Audit and verification

The read-only Figma audit covered all nine frame hierarchies, high-fidelity design context and screenshots, 363 instances across 23 source variants/components, variable definitions and a 20-node binding/override sample. No supported integration drift was found within that scope. Source components are local to this file; publication status and Code Connect were not assessed. See `admin-desktop-design-audit.json` for the structured report.

Verification covered:

- Six frontend tests, including trip isolation, paid/boarded totals, companion handling and timestamp-backed activity.
- All nine preview screens; schedule add/edit/cancel and route validation; record searches; ticket/payment details; pagination; date/trip selection; reset and logout.
- Browser checks at 1440, 1280, 1024, 768 and 375px; no page overflow, missing assets or runtime errors.
- Preview isolation: no API calls or real authentication changes.
- Normal routes with intercepted API fixtures: auth guard, login, connection retry, admin/staff token isolation, record navigation and logout. Saving a fixture trip retained its custom 137-passenger/12-motorcycle capacities and 3 walk-in slots.
- Production build and Staff preview regression checks.

No real server or database was used for the frontend browser checks.
