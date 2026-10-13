# Staff and Admin desktop update

Implemented the latest additions in [the GuimarasGo Figma file](https://www.figma.com/design/3wPWM2XOyqMX1dSp4cC3y6/commission-GuimarasGO?node-id=304-2346). This update changes the frontend only and keeps the existing fares, fees and configured trip capacities.

## Test the update

The local frontend runs at **http://localhost:5174**. Open:

- [Admin ride pricing](http://localhost:5174/preview/admin/pricing)
- [Staff discount approvals](http://localhost:5174/preview/staff/discounts)
- [Staff assisted booking](http://localhost:5174/preview/staff/assisted)

Use **Staff preview** or **Admin preview** in the preview bar to switch roles without reloading. Pricing changes, new assisted bookings, ID decisions and notifications are shared in memory. Reloading or **Reset sample data** clears those shared changes. These routes do not create authentication sessions or contact the backend. Existing role-specific sample records remain fixtures.

To restart the frontend:

```sh
cd "/Users/ryan/guimaras go/iloilo-guimaras/client"
VITE_STAFF_PREVIEW=true VITE_ADMIN_PREVIEW=true npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Try this sequence:

1. In Admin **Ride pricing**, select a vessel, edit its fares or percentages, choose **Review changes**, and save. Switching vessels with an unsaved draft asks whether to discard it.
2. Switch to Staff **Discount approvals**. Sarah has a clearly marked sample ID. Confirm the review checklist and approve it. Ana has no photo, so approval is disabled; choose a reason and request a new photo. The queue becomes empty after both decisions.
3. Open **Assisted booking**, select a vessel, register a temporary customer, and add companions with their own details. Eligible passengers require individual photo review or an explicit regular-fare choice. Uploaded test images stay in memory. Age 60+ requires Senior approval even when the profile category is Regular.
4. Confirm the exact cash amount and issue the ticket. Changes to passengers, motorcycle details, prices or discount eligibility invalidate the payment confirmation. Print the QR ticket or open its passenger details and record boarding. An unpaid, mismatched or used ticket cannot be boarded.
5. Switch to Admin **Booking details** and select the new ticket. Open its payment record. **Notifications** includes the new booking, pricing updates and ID decisions; **Mark all as read** updates that role’s unread indicator.

## Figma coverage

All 18 relevant frames/states were inspected through high-fidelity design context and screenshots. Existing pages were retained; frame 250:15581 was updated from walk-in ticketing to assisted booking.

| Page or state | Figma nodes | Route |
| --- | --- | --- |
| MV Halili pricing, review, saved | 304:2346, 307:3449, 307:3335 | `/admin/pricing` |
| Felipe III pricing, review, saved | 321:2806, 321:3026, 321:3278 | `/admin/pricing?vessel=Felipe%20III` |
| Lite Ferry 22 pricing, review, saved | 321:3503, 321:3723, 321:3975 | `/admin/pricing?vessel=Lite%20Ferry%2022` |
| Admin booking passenger details | 391:4243 | `/admin/bookings?booking=<id>` |
| Admin notifications | 393:4180 | `/admin/notifications` |
| Staff discount queue | 325:3458 | `/staff/discounts` |
| Review ID, approved, new photo requested | 325:3615, 325:3784, 325:3921 | `/staff/discounts?request=<id>` |
| Assisted ticket booking | 250:15581 | `/staff/assisted` |
| Staff booking passenger details | 391:4616 | `/staff/bookings?booking=<id>` |
| Staff notifications | 393:4417 | `/staff/notifications` |

Preview routes replace `/admin` or `/staff` with `/preview/admin` or `/preview/staff`. Admin **ID-review records** opens `/admin/discounts` with read-only decisions; Staff performs approvals. Ticket details and the Staff manifest link to the selected booking. `/staff/walk-in` retains the existing terminal cash-ticketing form.

## Design and behavior

The new pages reuse the existing Geist typography, warm background, flat white panels, orange actions and teal navigation. Pricing follows the new 708/380 column proportions, ID review uses equal columns, and assisted booking retains 728/360 columns. The passenger list follows the new `Desktop / Passenger flow row` component. The bell and pencil SVGs were downloaded directly from Figma and retain their native geometry. Existing shared fields, buttons, notices, native dialogs and reduced-motion-aware GSAP entrance motion remain in use.

The Figma operational layouts take precedence over the taste skill’s randomized marketing layouts, AIDA structure and pinned scrolling. All vessel selections use readable foreground/background combinations. Sidebars contain a scrollable navigation area and retain the account and Log out control; all ten Admin destinations fit at 1440×1000. Mobile pricing keeps every fare column visible.

Initial pricing preserves **₱40 per passenger, ₱150 motorcycle charge and ₱65 PPA fee per booking**. The pricing form expresses these as ₱40 solo, ₱190 with a motorcycle, and ₱80 for two passengers, before the PPA fee. Companion pricing tracks two solo fares; additional passengers also use the solo fare. Each approved Student/PWD/Senior passenger receives one category discount on their passenger fare. Motorcycle charges and PPA fees are excluded. The maximum is 3 passengers with a motorcycle or 10 without. Trips retain configured capacities; sample trips use 100 passengers, 10 motorcycles and 2 walk-in motorcycle slots.

New paid tickets store a fare snapshot, individual passenger details and the recorded payment amount. Later pricing saves affect new bookings for the selected vessel only. ID decisions require a matching passenger identity; changed details cannot reuse an old approval. Approval requires a photo and a completed review checklist. New-photo requests require a reason. Neither decision creates or confirms a payment. Read/unread state is independent for Staff and Admin. No customer notification is sent by the preview.

## Live-service boundary

The backend currently has no vessel-pricing, customer-registration-for-staff, discount-review or Staff/Admin notification endpoints. Those new mutations therefore work only in the frontend preview. Normal routes show explicit availability notices and do not invent ID submissions, approvals or saves. Live assisted booking links to the existing terminal cash-ticketing form.

Booking details on normal routes use actual booking fields and report missing age, gender or category as not recorded. Staff boarding uses the existing guarded `/staff/bookings/:id/board` endpoint. Admin payment links open the actual selected record even when it belongs to another departure. Live notification lists are derived from available booking timestamps; marking them read is session-local. Existing schedule, payment, scanner and manifest behavior remains supported.

## Audit and verification

The read-only integration audit inspected eight representative updated frame hierarchies, **331 instances from 18 source components/variants**, and binding-property samples on **36 nodes**. No supported integration issue was found within that sampled scope. Variable identities, every local override, publication status and Code Connect were not exhaustively verified. See `staff-admin-flow-update-audit.json` and its evidence file.

Verification covered ten frontend tests; three-vessel pricing review/save/cancel; photo approval, missing-photo rejection and an empty queue; individual discounted booking, confirmation invalidation, paid issuance and duplicate boarding prevention; cross-role records and notifications; 42 responsive layouts from 1440×1000 to 900×450 and 375×800; loaded SVG assets; retained Staff/Admin flows; and normal routes with intercepted API fixtures. Preview checks produced no backend requests or authentication changes. The production build succeeds with the existing router-directive and bundle-size warnings. No server or database was needed for these checks.
