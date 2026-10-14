# Landing website navigation and portal menu

Updated from commission GuimarasGO, using Landing / Shared website navigation (663:4823), its light-context reference (663:4769), and Landing · Staff and Admin portal menu (627:4680).

The public landing page now uses the shared Navbar component. It renders the original locally bundled logo SVG and Inter wordmark, followed by Overview, FAQs, Get the App and Staff / Admin sign-in. At 1440 pixels, the header is 104 pixels tall with 64-pixel side padding, 32-pixel link gaps and the reference 44-pixel controls. The logo retains its original 59.4513 × 50.7123 SVG dimensions and Figma wrapper offset.

| Action | Application destination |
| --- | --- |
| Brand / Overview | /#home |
| FAQs | /#faq, the existing landing FAQ section |
| Get the App | /get-app |
| Staff / Admin sign-in | Opens the portal menu |
| Staff sign-in | /staff/login |
| Admin sign-in | /admin/login |
| Back to landing page | Closes the portal menu |

The portal menu reuses the existing accessible MobileDialog and Button components. Its 320 × 288 card is positioned at x=790, y=84 in the 1440-pixel reference viewport, with the Figma white surface, 16-pixel radius, 24-pixel padding, orange 48-pixel actions, Geist typography and dimmed backdrop. Escape, outside clicks and Back close it and return focus to the sign-in trigger or mobile menu toggle. The native dialog contains keyboard focus and makes the background inert.

Below 981 pixels, the same navigation collapses into a compact menu. The menu closes on section selection, Escape, outside clicks and returning to desktop width. The portal card adapts to narrow screens without horizontal overflow. Existing landing content and authentication flows are retained.

Inter 400/500 fonts are bundled through the project's Fontsource pattern; the included license is client/public/licenses/Inter.txt. The original Figma logo is client/public/images/landing/navigation-logo.svg. No temporary Figma asset URLs are used at runtime.

Read-only [structural audit](landing-navigation-design-audit.json) and [evidence](landing-navigation-audit-evidence.json) cover the 14-node inspected sample.

Browser checks pass at 320, 375, 430, 768, 980, 1024, 1280, 1440 and 1920 pixels. They check exact desktop positions, local logo and font loading, mobile collapse, portal geometry, keyboard focus, dismissal, both role destinations, Get the App routing and FAQ scrolling. No runtime errors, failed local assets or backend requests occurred. Browser evidence and screenshots are under /tmp/guimaras-landing-navigation for this session.

Open http://localhost:5173/ to review the navbar and select Staff / Admin sign-in to open the portal menu.
