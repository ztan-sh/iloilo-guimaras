import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
    FiArrowDown,
    FiArrowRight,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiMapPin,
    FiMenu,
    FiSearch,
    FiStar,
    FiUser,
    FiX,
    
} from "react-icons/fi";

import heroImage from "../../assets/Landing/hero.png";
import heroBoatImage from "../../assets/Landing/hero-boat.png";
import aboutBeachImage from "../../assets/Landing/about-beach.png";
import aboutRocksImage from "../../assets/Landing/about-rocks.png";
import aboutTicketBoothImage from "../../assets/Landing/about-ticket-booth.png";
import destinationAerialImage from "../../assets/Landing/destination-aerial.png";
import experienceBox1Image from "../../assets/Landing/experience-box-1.png";
import experienceBox2Image from "../../assets/Landing/experience-box-2.png";
import howItWorksImage from "../../assets/Landing/how-it-works.png";
import sailboatImage from "../../assets/Landing/sailboat.png";
import travelCard1Image from "../../assets/Landing/travel-card-1.png";
import travelCard2Image from "../../assets/Landing/travel-card-2.png";
import travelCard3Image from "../../assets/Landing/travel-card-3.png";

const images = {
    hero: heroImage,
    rocks: aboutRocksImage,
    traveler: travelCard3Image,
    starfish: travelCard1Image,
    ticketBooth: aboutTicketBoothImage,
    speedboat: heroBoatImage,
    beach: aboutBeachImage,
    aerialBeach: destinationAerialImage,
    ferry: travelCard2Image,
    dock: howItWorksImage,
    sailboat: sailboatImage,
    experienceBox1: experienceBox1Image,
    experienceBox2: experienceBox2Image,
};


const faqs = [
    {
        question: "How do I book a ferry trip?",
        answer:
            "Choose your route and travel date, select an available trip, enter the required passenger details, review the booking information, and continue to payment.",
    },
    {
        question: "Can I book for more than one passenger?",
        answer:
            "Yes. GuimarasGo supports passenger details for group bookings within the limits configured by the ferry schedule.",
    },
    {
        question: "How do I know if my payment was received?",
        answer:
            "After payment, your booking remains under payment verification until the submitted payment is reviewed. The booking status will update when verification is completed.",
    },
    {
        question: "What happens after my booking is confirmed?",
        answer:
            "Your confirmed booking is available from your account so you can review the trip, passenger information, and booking details before travelling.",
    },
    {
        question: "Can I change or cancel my booking?",
        answer:
            "Booking changes and cancellation depend on the rules configured by the ferry operator. Check the booking details or contact the support channel provided by the system.",
    },
];

const experienceCards = [
    {
        title: "A clearer way to plan",
        text: "Check your route, schedule, and available trip before you travel.",
        image: images.experienceBox1,
    },
    {
        title: "Built around the trip",
        text: "Enter passenger details only when you reach the booking step that needs them.",
        image: images.experienceBox2,
    },
    {
        title: "Know your booking status",
        text: "Follow payment verification and confirmation from your GuimarasGo account.",
        image: images.rocks,
    },
];

const howItWorks = [
    ["01", "Explore", "Open GuimarasGo and check available ferry schedules for your trip."],
    ["02", "Choose a trip", "Select your route, travel date, and available departure."],
    ["03", "Add passengers", "Choose the vehicle option when applicable and enter passenger details."],
    ["04", "Review", "Check your trip, passenger information, fare, and availability before continuing."],
    ["05", "Pay", "Complete the available payment process and submit the required payment information."],
    ["06", "Verification", "Your payment is reviewed and your booking status is updated."],
    ["07", "Confirmation", "Once confirmed, your booking details are available from your account."],
    ["08", "Travel", "Arrive at the terminal with your confirmed booking and follow boarding instructions."],
];

const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);
    const [experienceIndex, setExperienceIndex] = useState(0);

    const isNativeApp = Capacitor.isNativePlatform();

    useEffect(() => {
        document.documentElement.style.scrollBehavior = "smooth";

        return () => {
            document.documentElement.style.scrollBehavior = "";
        };
    }, []);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const goToLogin = () => {
        setMobileMenuOpen(false);
        navigate("/login");
    };

    const visibleExperienceCards = [
        experienceCards[experienceIndex % experienceCards.length],
        experienceCards[(experienceIndex + 1) % experienceCards.length],
        experienceCards[(experienceIndex + 2) % experienceCards.length],
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');

                :root {
                    --gg-orange: #ff8a1f;
                    --gg-orange-dark: #e76f10;
                    --gg-teal: #12b9bf;
                    --gg-teal-dark: #063f49;
                    --gg-cream: #f6f2eb;
                    --gg-paper: #faf9f6;
                    --gg-ink: #202020;
                    --gg-muted: #707070;
                    --gg-line: rgba(32, 32, 32, 0.12);
                }

                * {
                    box-sizing: border-box;
                }

                html {
                    margin: 0;
                    padding: 0;
                    scroll-behavior: smooth;
                }

                body,
                #root {
                    margin: 0;
                    min-width: 320px;
                    width: 100%;
                }

                body {
                    background: var(--gg-paper);
                    color: var(--gg-ink);
                    font-family: "DM Sans", Arial, Helvetica, sans-serif;
                    overflow-x: hidden;
                }

                button,
                a {
                    font: inherit;
                }

                button {
                    border: 0;
                }

                img {
                    max-width: 100%;
                }

                .gg-page {
                    width: 100%;
                    overflow: hidden;
                    background: var(--gg-paper);
                }

                .gg-section {
                    width: 100%;
                    position: relative;
                }

                .gg-inner {
                    width: min(1240px, calc(100% - 64px));
                    margin: 0 auto;
                }

                .gg-serif {
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-orange-text {
                    color: var(--gg-orange);
                }

                /* =========================
                   HERO
                ========================= */

                .gg-hero {
                    min-height: 100svh;
                    height: 920px;
                    max-height: 1100px;
                    position: relative;
                    color: #fff;
                    background: #07353d;
                    isolation: isolate;
                }

                .gg-hero::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -3;
                    background:
                        linear-gradient(
                            90deg,
                            rgba(3, 25, 30, 0.82) 0%,
                            rgba(3, 25, 30, 0.42) 42%,
                            rgba(3, 25, 30, 0.20) 100%
                        ),
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.20) 0%,
                            rgba(0, 0, 0, 0.05) 45%,
                            rgba(0, 0, 0, 0.60) 100%
                        ),
                        url("${images.hero}") center / cover no-repeat;
                }

                .gg-hero::after {
                    content: "";
                    position: absolute;
                    width: 380px;
                    height: 380px;
                    right: -150px;
                    bottom: -150px;
                    border-radius: 50%;
                    background: rgba(18, 185, 191, 0.16);
                    filter: blur(10px);
                    z-index: -1;
                }

                .gg-nav {
                    position: absolute;
                    z-index: 20;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 92px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 42px;
                }

                .gg-brand {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    cursor: pointer;
                    background: transparent !important;
                    border: none;
                    box-shadow: none;
                    padding: 0;
                }

                .gg-brand img {
                    width: 82px;
                    height: 68px;
                    object-fit: contain;
                    display: block;
                    background: transparent !important;
                    border: none;
                    box-shadow: none;
                }

                .gg-nav-links {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 36px;
                    margin-left: auto;
                    margin-right: 30px;
                }

                .gg-nav-link {
                    position: relative;
                    color: rgba(255,255,255,0.92);
                    background: transparent;
                    padding: 8px 0;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: color .2s ease;
                }

                .gg-nav-link::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    height: 1px;
                    transform: scaleX(0);
                    transform-origin: center;
                    background: var(--gg-orange);
                    transition: transform .2s ease;
                }

                .gg-nav-link:hover {
                    color: #fff;
                }

                .gg-nav-link:hover::after {
                    transform: scaleX(1);
                }

                .gg-nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .gg-circle-action {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    background: rgba(0,0,0,.30);
                    border: 1px solid rgba(255,255,255,.28);
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                    transition: transform .2s ease, background .2s ease;
                }

                .gg-circle-action:hover {
                    transform: translateY(-2px);
                    background: rgba(18,185,191,.85);
                }

                .gg-book-now {
                    height: 44px;
                    padding: 0 23px;
                    border-radius: 7px;
                    background: var(--gg-orange);
                    color: #fff;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-left: 10px;
                    box-shadow: 0 10px 24px rgba(255,138,31,.20);
                    transition: transform .2s ease, background .2s ease;
                }

                .gg-book-now:hover {
                    transform: translateY(-2px);
                    background: #ff9c3d;
                }

                .gg-mobile-toggle {
                    display: none;
                }

                .gg-hero-content {
                    width: min(1240px, calc(100% - 64px));
                    min-height: 100%;
                    margin: 0 auto;
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .gg-hero-copy {
                    width: min(570px, 52%);
                    padding-top: 45px;
                    position: relative;
                    z-index: 3;
                }

                .gg-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                }

                .gg-kicker::before {
                    content: "";
                    width: 36px;
                    height: 1px;
                    background: var(--gg-orange);
                }

                .gg-hero-title {
                    margin: 0;
                    font-size: clamp(58px, 7vw, 104px);
                    line-height: .90;
                    letter-spacing: -0.045em;
                    font-weight: 500;
                }

                .gg-hero-title em {
                    display: block;
                    color: var(--gg-orange);
                    font-weight: 500;
                    font-style: italic;
                    font-family: "Playfair Display", Georgia, serif;
                    margin-left: 34px;
                }

                .gg-hero-description {
                    width: min(430px, 100%);
                    margin: 28px 0 0;
                    color: rgba(255,255,255,.82);
                    font-size: 16px;
                    line-height: 1.65;
                }

                .gg-hero-cta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 30px;
                }

                .gg-primary-cta {
                    min-height: 48px;
                    padding: 0 25px;
                    border-radius: 7px;
                    background: var(--gg-orange);
                    color: #fff;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 15px 30px rgba(255,138,31,.24);
                    transition: transform .2s ease;
                }

                .gg-primary-cta:hover {
                    transform: translateY(-2px);
                }

                .gg-outline-cta {
                    min-height: 48px;
                    padding: 0 21px;
                    border: 1px solid rgba(255,255,255,.42);
                    border-radius: 7px;
                    color: #fff;
                    background: rgba(255,255,255,.06);
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                    backdrop-filter: blur(6px);
                }

                .gg-outline-cta:hover {
                    background: rgba(255,255,255,.12);
                }

                .gg-hero-boat {
                    position: absolute;
                    width: min(690px, 53vw);
                    right: -30px;
                    bottom: 95px;
                    z-index: 2;
                    filter: drop-shadow(0 26px 35px rgba(0,0,0,.35));
                    pointer-events: none;
                }

                .gg-hero-floating {
                    position: absolute;
                    right: 4%;
                    bottom: 42px;
                    width: 220px;
                    padding: 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255,255,255,.94);
                    color: var(--gg-ink);
                    border-radius: 10px;
                    box-shadow: 0 18px 35px rgba(0,0,0,.22);
                    z-index: 4;
                }

                .gg-hero-floating-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: #e6f7f5;
                    color: var(--gg-teal-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                }

                .gg-hero-floating strong {
                    display: block;
                    font-size: 12px;
                    margin-bottom: 2px;
                }

                .gg-hero-floating span {
                    color: var(--gg-muted);
                    font-size: 11px;
                }

                .gg-scroll-hint {
                    position: absolute;
                    bottom: 30px;
                    left: 42px;
                    z-index: 5;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(255,255,255,.74);
                    font-size: 11px;
                    letter-spacing: .13em;
                    text-transform: uppercase;
                }

                .gg-scroll-hint span {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,.35);
                    border-radius: 50%;
                }

                /* =========================
                   ABOUT
                ========================= */

                .gg-about {
                    min-height: 760px;
                    background: #f4f2ed;
                    padding: 115px 0;
                    overflow: hidden;
                }

                .gg-about-layout {
                    min-height: 530px;
                    display: grid;
                    grid-template-columns: .85fr 1.15fr;
                    gap: 90px;
                    align-items: center;
                }

                .gg-about-collage {
                    position: relative;
                    min-height: 510px;
                }

                .gg-about-photo-main {
                    position: absolute;
                    width: 58%;
                    height: 360px;
                    left: 8%;
                    top: 75px;
                    border-radius: 22px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0,0,0,.15);
                    transform: rotate(-3deg);
                }

                .gg-about-photo-main img,
                .gg-about-photo-small img,
                .gg-about-ticket img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .gg-about-photo-small {
                    position: absolute;
                    width: 38%;
                    height: 205px;
                    right: 2%;
                    top: 5px;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 7px solid #f4f2ed;
                    box-shadow: 0 15px 30px rgba(0,0,0,.12);
                    transform: rotate(6deg);
                }

                .gg-about-ticket {
                    position: absolute;
                    width: 42%;
                    height: 185px;
                    right: 9%;
                    bottom: 8px;
                    border-radius: 22px;
                    overflow: hidden;
                    border: 7px solid #f4f2ed;
                    box-shadow: 0 18px 35px rgba(0,0,0,.13);
                    transform: rotate(-7deg);
                }

                .gg-about-boat {
                    position: absolute;
                    width: 250px;
                    left: 5%;
                    bottom: -25px;
                    z-index: 4;
                    filter: drop-shadow(0 13px 14px rgba(0,0,0,.20));
                }

                .gg-about-content {
                    max-width: 640px;
                }

                .gg-section-label {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: clamp(30px, 4vw, 48px);
                    font-style: italic;
                    line-height: 1;
                    margin: 0 0 22px;
                }

                .gg-about-content h2 {
                    margin: 0;
                    font-size: clamp(38px, 5vw, 65px);
                    line-height: .98;
                    letter-spacing: -.04em;
                    font-weight: 500;
                }

                .gg-about-content h2 span {
                    color: var(--gg-teal-dark);
                }

                .gg-about-content p {
                    margin: 28px 0 0;
                    max-width: 600px;
                    color: #535353;
                    line-height: 1.75;
                    font-size: 16px;
                }

                .gg-about-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 18px;
                    margin-top: 34px;
                }

                .gg-stat {
                    border-top: 1px solid var(--gg-line);
                    padding-top: 15px;
                }

                .gg-stat strong {
                    display: block;
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--gg-teal-dark);
                }

                .gg-stat span {
                    display: block;
                    margin-top: 4px;
                    color: #777;
                    font-size: 12px;
                }

                /* =========================
                   MORE THAN BOOKING
                ========================= */

                .gg-more {
                    background: #1d1d1b;
                    color: #fff;
                    padding: 110px 0 125px;
                }

                .gg-more-heading {
                    text-align: center;
                    margin-bottom: 70px;
                }

                .gg-more-heading h2 {
                    margin: 0;
                    font-size: clamp(40px, 5vw, 72px);
                    font-weight: 400;
                    letter-spacing: -.045em;
                }

                .gg-more-heading h2 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-more-heading p {
                    margin: 12px auto 0;
                    max-width: 560px;
                    color: rgba(255,255,255,.58);
                    font-size: 14px;
                    line-height: 1.6;
                }

                .gg-feature-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 28px;
                    align-items: center;
                }

                .gg-feature-card {
                    position: relative;
                    min-height: 450px;
                    border-radius: 18px;
                    overflow: hidden;
                    isolation: isolate;
                    box-shadow: 0 25px 45px rgba(0,0,0,.20);
                }

                .gg-feature-card:nth-child(1) {
                    transform: rotate(-5deg);
                }

                .gg-feature-card:nth-child(2) {
                    transform: translateY(-18px) rotate(-2deg);
                }

                .gg-feature-card:nth-child(3) {
                    transform: rotate(4deg);
                }

                .gg-feature-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    background:
                        linear-gradient(180deg, rgba(0,0,0,.02) 20%, rgba(0,0,0,.80) 100%),
                        var(--feature-image) center / cover no-repeat;
                }

                .gg-feature-card::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, transparent 35%, rgba(0,0,0,.58));
                    z-index: -1;
                }

                .gg-feature-content {
                    min-height: 450px;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .gg-feature-number {
                    font-size: 11px;
                    letter-spacing: .16em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.78);
                }

                .gg-feature-content p {
                    margin: 0;
                    max-width: 270px;
                    font-size: 16px;
                    line-height: 1.5;
                    color: rgba(255,255,255,.84);
                }

                .gg-feature-content h3 {
                    margin: 8px 0 0;
                    font-size: 30px;
                    line-height: 1.05;
                    letter-spacing: -.03em;
                }

                .gg-feature-content h3 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                /* =========================
                   CTA
                ========================= */

                .gg-cta {
                    min-height: 680px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: #fff;
                    isolation: isolate;
                    overflow: hidden;
                }

                .gg-cta::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -2;
                    background:
                        linear-gradient(rgba(0,38,45,.43), rgba(0,38,45,.52)),
                        url("${images.aerialBeach}") center / cover no-repeat;
                }

                .gg-cta::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    background-image:
                        linear-gradient(rgba(255,255,255,.13) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.13) 1px, transparent 1px);
                    background-size: 100px 100px;
                    mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent);
                }

                .gg-cta-content {
                    max-width: 800px;
                    padding: 80px 20px;
                }

                .gg-cta-content .gg-serif {
                    color: var(--gg-orange);
                    font-style: italic;
                    font-size: clamp(32px, 5vw, 62px);
                }

                .gg-cta-content h2 {
                    margin: 0;
                    font-size: clamp(40px, 6vw, 78px);
                    line-height: .98;
                    font-weight: 500;
                    letter-spacing: -.045em;
                }

                .gg-cta-content p {
                    margin: 22px auto 30px;
                    max-width: 570px;
                    color: rgba(255,255,255,.83);
                    font-size: 16px;
                    line-height: 1.6;
                }

                .gg-cta-button {
                    min-width: 210px;
                    height: 52px;
                    padding: 0 28px;
                    border-radius: 999px;
                    background: #fff;
                    color: #222;
                    cursor: pointer;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: transform .2s ease, background .2s ease;
                }

                .gg-cta-button:hover {
                    transform: translateY(-2px);
                    background: #fff8ef;
                }

                /* =========================
                   HOW IT WORKS
                ========================= */

                .gg-how {
                    background: #1d1d1b;
                    color: #fff;
                    padding: 115px 0 120px;
                    position: relative;
                }

                .gg-how-heading {
                    text-align: center;
                    margin-bottom: 65px;
                }

                .gg-how-heading h2 {
                    margin: 0;
                    font-size: clamp(42px, 5vw, 70px);
                    font-weight: 400;
                    letter-spacing: -.045em;
                }

                .gg-how-heading h2 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-how-heading p {
                    color: rgba(255,255,255,.58);
                    font-size: 14px;
                    margin: 14px auto 0;
                    max-width: 560px;
                    line-height: 1.6;
                }

                .gg-how-timeline {
                    position: relative;
                    width: min(1060px, 100%);
                    margin: 0 auto;
                    padding-bottom: 35px;
                }

                .gg-how-line {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 50%;
                    width: 1px;
                    background: linear-gradient(
                        to bottom,
                        transparent,
                        rgba(255,138,31,.72) 8%,
                        rgba(255,138,31,.25) 92%,
                        transparent
                    );
                    transform: translateX(-50%);
                }

                .gg-how-step {
                    position: relative;
                    min-height: 125px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: center;
                    gap: 60px;
                }

                .gg-how-step:nth-child(odd) .gg-how-copy {
                    grid-column: 1;
                    text-align: right;
                    padding-right: 30px;
                }

                .gg-how-step:nth-child(odd) .gg-how-index {
                    grid-column: 2;
                    text-align: left;
                    padding-left: 30px;
                }

                .gg-how-step:nth-child(even) .gg-how-copy {
                    grid-column: 2;
                    grid-row: 1;
                    text-align: left;
                    padding-left: 30px;
                }

                .gg-how-step:nth-child(even) .gg-how-index {
                    grid-column: 1;
                    grid-row: 1;
                    text-align: right;
                    padding-right: 30px;
                }

                .gg-how-copy {
                    position: relative;
                }

                .gg-how-copy h3 {
                    margin: 0 0 7px;
                    font-size: 17px;
                    font-weight: 600;
                }

                .gg-how-copy p {
                    margin: 0;
                    color: rgba(255,255,255,.58);
                    font-size: 12px;
                    line-height: 1.6;
                    max-width: 350px;
                    display: inline-block;
                }

                .gg-how-index {
                    font-family: "Playfair Display", Georgia, serif;
                    font-style: italic;
                    font-size: 19px;
                    color: rgba(255,255,255,.9);
                }

                .gg-how-step-dot {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--gg-orange);
                    box-shadow: 0 0 0 7px rgba(255,138,31,.08);
                    transform: translate(-50%, -50%);
                    z-index: 3;
                }

                .gg-how-image {
                    width: min(630px, 70%);
                    height: 180px;
                    margin: 0 auto 45px;
                    border-radius: 28px;
                    overflow: hidden;
                    position: relative;
                    z-index: 2;
                    box-shadow: 0 22px 50px rgba(0,0,0,.28);
                }

                .gg-how-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center 58%;
                    display: block;
                }

                .gg-how-image::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, rgba(0,0,0,.18), transparent 45%, rgba(0,0,0,.15));
                }

                .gg-how-final {
                    max-width: 680px;
                    margin: 30px auto 0;
                    text-align: center;
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                    font-style: italic;
                    font-size: 23px;
                    line-height: 1.4;
                }

                /* =========================
                   EXPERIENCE
                ========================= */

                .gg-experience {
                    background: #f8f7f3;
                    padding: 110px 0;
                }

                .gg-experience-heading {
                    display: flex;
                    align-items: end;
                    justify-content: space-between;
                    gap: 30px;
                    margin-bottom: 45px;
                }

                .gg-experience-heading h2 {
                    margin: 0;
                    font-size: clamp(40px, 5vw, 64px);
                    line-height: .98;
                    letter-spacing: -.045em;
                    font-weight: 500;
                }

                .gg-experience-heading h2 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-experience-heading p {
                    max-width: 420px;
                    color: #737373;
                    line-height: 1.65;
                    font-size: 14px;
                    margin: 0;
                }

                .gg-experience-stage {
                    display: grid;
                    grid-template-columns: 270px 1fr;
                    gap: 22px;
                    align-items: stretch;
                }

                .gg-experience-quote {
                    border-radius: 18px;
                    background: #ffd91c;
                    padding: 30px 26px;
                    min-height: 360px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .gg-experience-quote .quote-mark {
                    font-family: Georgia, serif;
                    font-size: 60px;
                    line-height: .6;
                    color: rgba(0,0,0,.18);
                }

                .gg-experience-quote h3 {
                    margin: 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: 31px;
                    font-style: italic;
                    font-weight: 500;
                }

                .gg-experience-quote p {
                    margin: 20px 0 0;
                    font-family: "Playfair Display", Georgia, serif;
                    font-size: 13px;
                    line-height: 1.65;
                    color: rgba(0,0,0,.72);
                }

                .gg-stars {
                    display: flex;
                    gap: 3px;
                    color: #111;
                }

                .gg-experience-images {
                    display: grid;
                    grid-template-columns: 1fr 1.05fr;
                    gap: 12px;
                    min-height: 360px;
                }

                .gg-experience-image {
                    overflow: hidden;
                    border-radius: 18px;
                    min-height: 360px;
                    background: #ddd;
                }

                .gg-experience-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .gg-experience-controls {
                    display: flex;
                    gap: 8px;
                    margin-top: 18px;
                }

                .gg-slider-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #fff;
                    border: 1px solid var(--gg-line);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .gg-slider-button:hover {
                    background: var(--gg-orange);
                    color: #fff;
                    border-color: var(--gg-orange);
                }

                /* =========================
                   FAQ
                ========================= */

                .gg-faq {
                    background: #fff;
                    padding: 95px 0 110px;
                }

                .gg-faq-layout {
                    display: grid;
                    grid-template-columns: .75fr 1.25fr;
                    gap: 85px;
                    align-items: start;
                }

                .gg-faq-heading h2 {
                    margin: 0;
                    font-size: clamp(42px, 5vw, 65px);
                    line-height: .98;
                    font-weight: 500;
                    letter-spacing: -.045em;
                }

                .gg-faq-heading h2 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-faq-heading p {
                    color: #777;
                    line-height: 1.65;
                    font-size: 14px;
                    max-width: 370px;
                    margin: 20px 0 0;
                }

                .gg-faq-list {
                    border-top: 1px solid var(--gg-line);
                }

                .gg-faq-item {
                    border-bottom: 1px solid var(--gg-line);
                }

                .gg-faq-question {
                    width: 100%;
                    min-height: 66px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    background: transparent;
                    cursor: pointer;
                    text-align: left;
                    color: #222;
                    font-size: 14px;
                    font-weight: 600;
                }

                .gg-faq-question svg {
                    flex: 0 0 auto;
                    transition: transform .2s ease;
                }

                .gg-faq-item.open .gg-faq-question svg {
                    transform: rotate(180deg);
                }

                .gg-faq-answer {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height .3s ease;
                }

                .gg-faq-item.open .gg-faq-answer {
                    max-height: 180px;
                }

                .gg-faq-answer p {
                    margin: 0;
                    padding: 0 45px 20px 0;
                    color: #777;
                    font-size: 13px;
                    line-height: 1.7;
                }

                /* =========================
                   APP CTA
                ========================= */

                .gg-app {
                    background: #f1eee8;
                    padding: 105px 0 90px;
                    overflow: hidden;
                }

                .gg-app-inner {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 70px;
                    align-items: center;
                }

                .gg-app-copy h2 {
                    margin: 0;
                    font-size: clamp(42px, 5vw, 70px);
                    line-height: .98;
                    letter-spacing: -.045em;
                    font-weight: 500;
                }

                .gg-app-copy h2 em {
                    color: var(--gg-orange);
                    font-family: "Playfair Display", Georgia, serif;
                }

                .gg-app-copy p {
                    color: #6d6d6d;
                    max-width: 480px;
                    line-height: 1.7;
                    font-size: 14px;
                    margin: 22px 0 28px;
                }

                .gg-app-buttons {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .gg-app-button {
                    height: 45px;
                    padding: 0 18px;
                    border-radius: 6px;
                    background: #1e1e1e;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 600;
                }

                .gg-app-button:hover {
                    background: var(--gg-orange);
                }

                .gg-phone-stage {
                    min-height: 430px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .gg-phone {
                    width: 205px;
                    height: 405px;
                    background: #171717;
                    border-radius: 32px;
                    padding: 9px;
                    box-shadow: 0 30px 55px rgba(0,0,0,.24);
                    transform: rotate(-7deg);
                    position: relative;
                    z-index: 3;
                }

                .gg-phone:nth-child(2) {
                    position: absolute;
                    width: 185px;
                    height: 365px;
                    transform: translate(130px, 25px) rotate(7deg);
                    z-index: 2;
                    opacity: .93;
                }

                .gg-phone-screen {
                    width: 100%;
                    height: 100%;
                    border-radius: 25px;
                    overflow: hidden;
                    background: #fff;
                    position: relative;
                }

                .gg-phone-screen::before {
                    content: "GuimarasGo";
                    display: flex;
                    align-items: center;
                    height: 54px;
                    padding: 0 17px;
                    background: #fff;
                    color: var(--gg-teal-dark);
                    font-weight: 800;
                    font-size: 13px;
                }

                .gg-phone-hero {
                    height: 105px;
                    background: url("${images.rocks}") center / cover no-repeat;
                }

                .gg-phone-body {
                    padding: 13px;
                }

                .gg-phone-body .phone-chip {
                    width: 72px;
                    height: 9px;
                    border-radius: 99px;
                    background: #e9e9e9;
                    margin-bottom: 12px;
                }

                .gg-phone-card {
                    padding: 12px;
                    border-radius: 12px;
                    background: #f5f6f6;
                    margin-bottom: 10px;
                }

                .gg-phone-card strong {
                    display: block;
                    font-size: 11px;
                    margin-bottom: 5px;
                }

                .gg-phone-card span {
                    font-size: 9px;
                    color: #777;
                }

                .gg-phone-status {
                    display: inline-flex;
                    margin-top: 9px;
                    padding: 5px 8px;
                    border-radius: 99px;
                    background: #e8f8ef;
                    color: #23844d;
                    font-size: 8px;
                    font-weight: 700;
                }

                /* =========================
                   FOOTER
                ========================= */

                .gg-footer {
                    background: #20201e;
                    color: #fff;
                    padding: 65px 0 25px;
                }

                .gg-footer-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
                    gap: 35px;
                    padding-bottom: 50px;
                }

                .gg-footer-brand img {
                    width: 78px;
                    height: 60px;
                    object-fit: contain;
                }

                .gg-footer-brand p {
                    max-width: 260px;
                    color: rgba(255,255,255,.56);
                    font-size: 13px;
                    line-height: 1.7;
                    margin: 15px 0 0;
                }

                .gg-footer-title {
                    margin: 4px 0 15px;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                }

                .gg-footer-link {
                    display: block;
                    width: fit-content;
                    border: 0;
                    padding: 0;
                    margin: 0 0 10px;
                    background: transparent;
                    color: rgba(255,255,255,.56);
                    text-decoration: none;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                }

                .gg-footer-link:hover {
                    color: var(--gg-orange);
                }

                .gg-footer-socials {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                }

                .gg-footer-social {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,.75);
                }

                .gg-footer-bottom {
                    border-top: 1px solid rgba(255,255,255,.10);
                    padding-top: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    color: rgba(255,255,255,.40);
                    font-size: 10px;
                }

                /* =========================
                   RESPONSIVE
                ========================= */

                @media (max-width: 1100px) {
                    .gg-nav {
                        padding: 0 28px;
                    }

                    .gg-nav-links {
                        gap: 22px;
                        margin-right: 16px;
                    }

                    .gg-hero-content,
                    .gg-inner {
                        width: min(100% - 48px, 1100px);
                    }

                    .gg-hero-boat {
                        width: min(600px, 52vw);
                        right: -50px;
                    }

                    .gg-about-layout {
                        gap: 55px;
                    }

                    .gg-feature-card {
                        min-height: 400px;
                    }

                    .gg-feature-content {
                        min-height: 400px;
                    }

                    .gg-footer-grid {
                        grid-template-columns: 1.4fr repeat(4, 1fr);
                    }
                }

                @media (max-width: 900px) {
                    .gg-nav {
                        height: 76px;
                    }

                    .gg-nav-links,
                    .gg-nav-actions .gg-circle-action,
                    .gg-nav-actions .gg-book-now {
                        display: none;
                    }

                    .gg-mobile-toggle {
                        width: 43px;
                        height: 43px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        color: #fff;
                        background: rgba(0,0,0,.30);
                        border: 1px solid rgba(255,255,255,.30);
                        cursor: pointer;
                    }

                    .gg-mobile-menu {
                        position: absolute;
                        top: 70px;
                        left: 18px;
                        right: 18px;
                        z-index: 30;
                        padding: 12px;
                        border-radius: 16px;
                        background: rgba(20,25,26,.96);
                        border: 1px solid rgba(255,255,255,.12);
                        box-shadow: 0 20px 45px rgba(0,0,0,.25);
                        backdrop-filter: blur(12px);
                    }

                    .gg-mobile-menu button {
                        width: 100%;
                        padding: 13px 12px;
                        border-radius: 10px;
                        background: transparent;
                        color: #fff;
                        text-align: left;
                        cursor: pointer;
                    }

                    .gg-mobile-menu button:hover {
                        background: rgba(255,255,255,.08);
                    }

                    .gg-mobile-menu .mobile-book {
                        margin-top: 5px;
                        background: var(--gg-orange);
                        text-align: center;
                        font-weight: 700;
                    }

                    .gg-hero {
                        height: auto;
                        min-height: 850px;
                    }

                    .gg-hero-content {
                        min-height: 850px;
                        align-items: flex-start;
                        padding-top: 155px;
                    }

                    .gg-hero-copy {
                        width: 72%;
                    }

                    .gg-hero-boat {
                        width: 580px;
                        max-width: 70vw;
                        right: -75px;
                        bottom: 110px;
                        opacity: .94;
                    }

                    .gg-hero-floating {
                        right: 28px;
                        bottom: 32px;
                    }

                    .gg-about-layout {
                        grid-template-columns: 1fr;
                    }

                    .gg-about-collage {
                        min-height: 480px;
                        max-width: 650px;
                        width: 100%;
                        margin: 0 auto;
                    }

                    .gg-about-content {
                        max-width: 750px;
                    }

                    .gg-feature-grid {
                        grid-template-columns: 1fr;
                        max-width: 500px;
                        margin: 0 auto;
                    }

                    .gg-feature-card:nth-child(1),
                    .gg-feature-card:nth-child(2),
                    .gg-feature-card:nth-child(3) {
                        transform: none;
                    }

                    .gg-feature-card {
                        min-height: 390px;
                    }

                    .gg-feature-content {
                        min-height: 390px;
                    }

                    .gg-how-step {
                        min-height: 145px;
                    }

                    .gg-experience-stage {
                        grid-template-columns: 1fr;
                    }

                    .gg-experience-quote {
                        min-height: auto;
                    }

                    .gg-experience-images {
                        min-height: 390px;
                    }

                    .gg-faq-layout {
                        grid-template-columns: 1fr;
                        gap: 45px;
                    }

                    .gg-app-inner {
                        grid-template-columns: 1fr;
                        gap: 35px;
                    }

                    .gg-phone-stage {
                        min-height: 430px;
                    }

                    .gg-footer-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }

                    .gg-footer-brand {
                        grid-column: 1 / -1;
                    }
                }

                @media (max-width: 620px) {
                    .gg-inner,
                    .gg-hero-content {
                        width: calc(100% - 34px);
                    }

                    .gg-nav {
                        padding: 0 17px;
                    }

                    .gg-brand img {
                        width: 67px;
                        height: 55px;
                    }

                    .gg-hero {
                        min-height: 790px;
                    }

                    .gg-hero-content {
                        min-height: 790px;
                        padding-top: 128px;
                    }

                    .gg-hero-copy {
                        width: 100%;
                    }

                    .gg-kicker {
                        font-size: 11px;
                    }

                    .gg-hero-title {
                        font-size: clamp(53px, 16vw, 78px);
                    }

                    .gg-hero-title em {
                        margin-left: 16px;
                    }

                    .gg-hero-description {
                        font-size: 13px;
                        max-width: 350px;
                    }

                    .gg-hero-cta {
                        flex-wrap: wrap;
                    }

                    .gg-primary-cta,
                    .gg-outline-cta {
                        min-height: 44px;
                        font-size: 12px;
                    }

                    .gg-hero-boat {
                        width: 470px;
                        max-width: 90vw;
                        right: -105px;
                        bottom: 76px;
                    }

                    .gg-hero-floating {
                        right: 16px;
                        bottom: 18px;
                        width: 195px;
                    }

                    .gg-scroll-hint {
                        display: none;
                    }

                    .gg-about,
                    .gg-more,
                    .gg-how,
                    .gg-experience,
                    .gg-faq,
                    .gg-app {
                        padding-top: 78px;
                        padding-bottom: 78px;
                    }

                    .gg-about-collage {
                        min-height: 390px;
                    }

                    .gg-about-photo-main {
                        width: 63%;
                        height: 270px;
                        left: 2%;
                    }

                    .gg-about-photo-small {
                        width: 42%;
                        height: 155px;
                        right: 0;
                    }

                    .gg-about-ticket {
                        width: 46%;
                        height: 145px;
                        right: 4%;
                    }

                    .gg-about-boat {
                        width: 180px;
                        left: 0;
                        bottom: -10px;
                    }

                    .gg-about-stats {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }

                    .gg-feature-card {
                        min-height: 360px;
                    }

                    .gg-feature-content {
                        min-height: 360px;
                    }

                    .gg-how-image {
                        width: 100%;
                        height: 150px;
                        border-radius: 20px;
                    }

                    .gg-how-step {
                        min-height: 155px;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }

                    .gg-how-line {
                        left: 50%;
                    }

                    .gg-how-step:nth-child(odd) .gg-how-copy,
                    .gg-how-step:nth-child(even) .gg-how-copy {
                        padding-left: 10px;
                        padding-right: 10px;
                    }

                    .gg-how-step:nth-child(odd) .gg-how-index,
                    .gg-how-step:nth-child(even) .gg-how-index {
                        padding-left: 10px;
                        padding-right: 10px;
                    }

                    .gg-how-copy h3 {
                        font-size: 13px;
                    }

                    .gg-how-copy p {
                        font-size: 10px;
                    }

                    .gg-how-index {
                        font-size: 15px;
                    }

                    .gg-experience-heading {
                        display: block;
                    }

                    .gg-experience-heading p {
                        margin-top: 18px;
                    }

                    .gg-experience-images {
                        grid-template-columns: 1fr 1.05fr;
                        min-height: 290px;
                    }

                    .gg-experience-image {
                        min-height: 290px;
                    }

                    .gg-phone-stage {
                        min-height: 390px;
                        overflow: hidden;
                    }

                    .gg-phone {
                        width: 178px;
                        height: 355px;
                    }

                    .gg-phone:nth-child(2) {
                        width: 160px;
                        height: 320px;
                        transform: translate(100px, 20px) rotate(7deg);
                    }

                    .gg-footer-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 30px 20px;
                    }

                    .gg-footer-brand {
                        grid-column: 1 / -1;
                    }

                    .gg-footer-bottom {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }

                @media (max-width: 390px) {
                    .gg-hero {
                        min-height: 760px;
                    }

                    .gg-hero-content {
                        min-height: 760px;
                    }

                    .gg-hero-title {
                        font-size: 49px;
                    }

                    .gg-hero-boat {
                        width: 420px;
                        right: -115px;
                    }

                    .gg-hero-floating {
                        width: 180px;
                    }

                    .gg-about-photo-main {
                        width: 64%;
                        height: 245px;
                    }

                    .gg-about-photo-small {
                        height: 140px;
                    }

                    .gg-about-ticket {
                        height: 132px;
                    }
                }
            `}</style>

            <main className="gg-page">
                {/* =========================
                    HERO
                ========================= */}
                <section className="gg-section gg-hero" id="home">
                    <nav className="gg-nav" aria-label="Main navigation">
                        <button
                            type="button"
                            className="gg-brand"
                            onClick={() => scrollToSection("home")}
                            aria-label="Go to GuimarasGo home"
                        >
                            <img src="/images/guimarasgo-logo.png" alt="GuimarasGo" />
                        </button>

                        <div className="gg-nav-links">
                            <button className="gg-nav-link" onClick={() => scrollToSection("contact")}>
                                Contact Us
                            </button>
                        </div>

                        <div className="gg-nav-actions">
                            <button
                                type="button"
                                className="gg-circle-action"
                                onClick={goToLogin}
                                aria-label="Login"
                            >
                                <FiUser size={18} />
                            </button>

                            <button
                                type="button"
                                className="gg-circle-action"
                                onClick={() => scrollToSection("faq")}
                                aria-label="Search"
                            >
                                <FiSearch size={18} />
                            </button>

                            <button
                                type="button"
                                className="gg-book-now"
                                onClick={goToLogin}
                            >
                                Book now
                            </button>
                        </div>

                        <button
                            type="button"
                            className="gg-mobile-toggle"
                            onClick={() => setMobileMenuOpen((value) => !value)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                        </button>

                        {mobileMenuOpen && (
                            <div className="gg-mobile-menu">
                                <button onClick={() => scrollToSection("about")}>
                                    Contact Us
                                </button>
                                <button className="mobile-book" onClick={goToLogin}>
                                    Book now
                                </button>
                            </div>
                        )}
                    </nav>

                    <div className="gg-hero-content">
                        <div className="gg-hero-copy">
                            <div className="gg-kicker">Explore Guimaras</div>

                            <h1 className="gg-hero-title">
                                The best places
                                <em>with us.</em>
                            </h1>

                            <p className="gg-hero-description">
                                Diskubreha ang katahum sang Guimaras kag Iloilo upod sa amon. Magplano sang imo biyahe kag himua nga mas mahapos kag matahum ang imo pagpanaw.
                            </p>

                            <div className="gg-hero-cta">
                                <button
                                    type="button"
                                    className="gg-primary-cta"
                                    onClick={goToLogin}
                                >
                                    Book your trip
                                    <FiArrowRight size={17} />
                                </button>

                                <button
                                    type="button"
                                    className="gg-outline-cta"
                                    onClick={() => scrollToSection("about")}
                                >
                                    Explore
                                    <FiArrowDown size={15} />
                                </button>
                            </div>
                        </div>

                        <div className="gg-hero-floating">
                            <div className="gg-hero-floating-icon">
                                <FiMapPin size={18} />
                            </div>
                            <div>
                                <strong>Iloilo ↔ Guimaras</strong>
                                <span>Simple ferry travel planning</span>
                            </div>
                        </div>

                        <div className="gg-scroll-hint">
                            <span><FiArrowDown size={14} /></span>
                            Scroll to explore
                        </div>
                    </div>
                </section>

                


                {/* =========================
                    CTA
                ========================= */}
                <section className="gg-section gg-cta">
                    <div className="gg-cta-content">
                        <div className="gg-serif">find out.</div>
                        <h2>No more guessing before your trip.</h2>
                        <p>
                            Check your ferry schedule, choose your trip, and continue
                            your booking online before heading to the terminal.
                        </p>
                        <button
                            type="button"
                            className="gg-cta-button"
                            onClick={goToLogin}
                        >
                            Explore trips
                            <FiArrowRight size={17} />
                        </button>
                    </div>
                </section>

                {/* =========================
                    HOW IT WORKS
                ========================= */}
                <section className="gg-section gg-how" id="how-it-works">
                    <div className="gg-inner">
                        <div className="gg-how-heading">
                            <h2>
                                How it <em>works</em>
                            </h2>
                            <p>
                                A simple journey from checking a schedule to arriving
                                at the terminal with your confirmed booking.
                            </p>
                        </div>

                        <div className="gg-how-image">
                            <img src={images.dock} alt="Ferry arriving at the dock" />
                        </div>

                        <div className="gg-how-timeline">
                            <div className="gg-how-line" />

                            {howItWorks.map(([number, title, text], index) => (
                                <div className="gg-how-step" key={number}>
                                    <div className="gg-how-copy">
                                        <h3>{title}</h3>
                                        <p>{text}</p>
                                    </div>

                                    <div className="gg-how-index">
                                        {number}
                                    </div>

                                    <span className="gg-how-step-dot" />
                                </div>
                            ))}
                        </div>

                        <p className="gg-how-final">
                            You don't need to control every detail — GuimarasGo
                            helps organize the booking process.
                        </p>
                    </div>
                </section>

               
                {/* =========================
                    FAQ
                ========================= */}
                <section className="gg-section gg-faq" id="faq">
                    <div className="gg-inner gg-faq-layout">
                        <div className="gg-faq-heading">
                            <h2>
                                Still have <em>questions?</em>
                            </h2>
                            <p>
                                Here are answers to common questions about using
                                GuimarasGo for ferry travel planning and booking.
                            </p>
                        </div>

                        <div className="gg-faq-list">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;

                                return (
                                    <div
                                        className={`gg-faq-item ${isOpen ? "open" : ""}`}
                                        key={faq.question}
                                    >
                                        <button
                                            type="button"
                                            className="gg-faq-question"
                                            onClick={() =>
                                                setOpenFaq(isOpen ? -1 : index)
                                            }
                                            aria-expanded={isOpen}
                                        >
                                            <span>{faq.question}</span>
                                            <FiChevronDown size={17} />
                                        </button>

                                        <div className="gg-faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* =========================
                    APP DOWNLOAD
                ========================= */}
                <section className="gg-section gg-app">
                    <div className="gg-inner gg-app-inner">
                        <div className="gg-app-copy">
                            <h2>
                                Your ticket,
                                <br />
                                <em>in your pocket.</em>
                            </h2>

                            <p>
                                Use GuimarasGo on the web or install the Android
                                application for a convenient mobile experience.
                                Keep your trip information close while you travel.
                            </p>

                            <div className="gg-app-buttons">
                                {!isNativeApp && (
                                    <button
                                        type="button"
                                        className="gg-app-button"
                                        onClick={() => navigate("/get-app")}
                                    >
                                        Android Download
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="gg-app-button"
                                    onClick={goToLogin}
                                >
                                    Continue to GuimarasGo
                                </button>
                            </div>
                        </div>

                        <div className="gg-phone-stage" aria-hidden="true">
                            <div className="gg-phone">
                                <div className="gg-phone-screen">
                                    <div className="gg-phone-hero" />
                                    <div className="gg-phone-body">
                                        <div className="phone-chip" />
                                        <div className="gg-phone-card">
                                            <strong>Iloilo → Guimaras</strong>
                                            <span>Upcoming ferry trip</span>
                                            <div className="gg-phone-status">CONFIRMED</div>
                                        </div>
                                        <div className="gg-phone-card">
                                            <strong>Travel details</strong>
                                            <span>Passengers and booking information</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="gg-phone">
                                <div className="gg-phone-screen">
                                    <div
                                        className="gg-phone-hero"
                                        style={{ backgroundImage: `url("${images.aerialBeach}")` }}
                                    />
                                    <div className="gg-phone-body">
                                        <div className="phone-chip" />
                                        <div className="gg-phone-card">
                                            <strong>Available trip</strong>
                                            <span>Check schedule and continue</span>
                                        </div>
                                        <div className="gg-phone-card">
                                            <strong>Payment status</strong>
                                            <span>Verification updates</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================
                    FOOTER
                ========================= */}
                <footer className="gg-footer" id="contact">
                    <div className="gg-inner">
                        <div className="gg-footer-grid">
                            <div className="gg-footer-brand">
                                <img
                                    src="/images/guimarasgo-logo.png"
                                    alt="GuimarasGo"
                                />
                                <p>
                                    A digital ferry ticketing experience for travel
                                    between Iloilo and Guimaras.
                                </p>

                                <div className="gg-footer-socials">
                                    <span className="gg-footer-social">f</span>
                                    <span className="gg-footer-social">◎</span>
                                </div>
                            </div>
                            <div>
                                <div className="gg-footer-title">Explore</div>
                                <button
                                    className="gg-footer-link"
                                    onClick={() => scrollToSection("about")}
                                >
                                    Contact Us
                                </button>
                                <button
                                    className="gg-footer-link"
                                    onClick={goToLogin}
                                >
                                    Book now
                                </button>
                            </div>

                            <div>
                                <div className="gg-footer-title">Location</div>
                                <span className="gg-footer-link">Iloilo</span>
                                <span className="gg-footer-link">Guimaras</span>
                                <span className="gg-footer-link">Philippines</span>
                            </div>

                            <div>
                                <div className="gg-footer-title">Contact</div>
                                <span className="gg-footer-link">GuimarasGo Support</span>
                                <span className="gg-footer-link">Online booking assistance</span>
                            </div>
                        </div>

                        <div className="gg-footer-bottom">
                            <span>© {new Date().getFullYear()} GuimarasGo. All rights reserved.</span>
                            <span>Iloilo to Guimaras, simplified.</span>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
};

export default LandingPage;
