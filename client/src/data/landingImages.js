// ============================================================
// GUIMARASGO LANDING PAGE IMAGES
// ============================================================
//
// Put all landing-page images inside:
//
// client/public/images/landing/
//
// You only need to change the filenames below.
// Do NOT change the LandingPage.jsx image paths manually.
//
// ============================================================

const IMAGE_BASE = "/images/landing";

export const landingImages = {
    // ========================================================
    // HERO SECTION
    // ========================================================

    hero: `${IMAGE_BASE}/hero.png`,

    heroBoat: `${IMAGE_BASE}/hero-boat.png`,

    // ========================================================
    // ABOUT US SECTION
    // ========================================================

    about: {
        beach: `${IMAGE_BASE}/about-beach.png`,

        ticketBooth: `${IMAGE_BASE}/about-ticket-booth.png`,

        rocks: `${IMAGE_BASE}/about-rocks.png`,
    },

    // ========================================================
    // TRAVELER'S EXPERIENCE
    // ========================================================

    experience: {
        box1: `${IMAGE_BASE}/experience-box-1.png`,

        box2: `${IMAGE_BASE}/experience-box-2.png`,
    },

    // ========================================================
    // TRAVEL / INFORMATION CARDS
    // ========================================================

    travelCards: {
        card1: `${IMAGE_BASE}/travel-card-1.png`,

        card2: `${IMAGE_BASE}/travel-card-2.png`,

        card3: `${IMAGE_BASE}/travel-card-3.png`,
    },

    // ========================================================
    // HOW IT WORKS
    // ========================================================

    howItWorks: {
        main: `${IMAGE_BASE}/how-it-works.png`,
    },

    // ========================================================
    // DESTINATIONS
    // ========================================================

    destinations: {
        aerial: `${IMAGE_BASE}/destination-aerial.png`,

        sailboat: `${IMAGE_BASE}/sailboat.png`,
    },

    // ========================================================
    // FOOTER
    // ========================================================

    footer: {
        background: `${IMAGE_BASE}/footer-background.png`,
    },
};

export default landingImages;