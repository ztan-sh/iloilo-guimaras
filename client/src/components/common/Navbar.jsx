import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { Button, MobileDialog } from '../../pages/passenger/mobile/MobileUI';
import './Navbar.css';

export default function Navbar({ onSectionSelect, treatment = 'on-dark' }) {
    const location = useLocation();
    const navigate = useNavigate();
    const menuId = useId();
    const navRef = useRef(null);
    const toggleRef = useRef(null);
    const portalRef = useRef(null);
    const hadPortalOpen = useRef(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [portalOpen, setPortalOpen] = useState(false);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const outside = event => {
            if (!navRef.current?.contains(event.target)) setMobileMenuOpen(false);
        };
        const escape = event => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
                toggleRef.current?.focus();
            }
        };
        const desktop = window.matchMedia('(min-width: 981px)');
        const resized = event => { if (event.matches) setMobileMenuOpen(false); };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        desktop.addEventListener('change', resized);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
            desktop.removeEventListener('change', resized);
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (portalOpen) { hadPortalOpen.current = true; return; }
        if (!hadPortalOpen.current) return;
        hadPortalOpen.current = false;
        const frame = requestAnimationFrame(() => {
            const target = window.matchMedia('(max-width: 980px)').matches ? toggleRef.current : portalRef.current;
            target?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, [portalOpen]);

    const selectSection = id => {
        setMobileMenuOpen(false);
        if (location.pathname === '/') onSectionSelect?.(id);
    };
    const closePortal = () => setPortalOpen(false);

    return <>
        <header className={`website-navigation website-navigation-${treatment}`}>
            <nav ref={navRef} className="website-nav" aria-label="Main navigation">
                <Link className="website-nav-brand" to="/#home" onClick={() => selectSection('home')} aria-label="GuimarasGo overview">
                    <span className="website-nav-logo"><img src="/images/landing/navigation-logo.svg" width={59.4513} height={50.7123} alt="" /></span>
                    <span className="website-nav-wordmark">GuimarasGo</span>
                </Link>
                <button ref={toggleRef} type="button" className="website-nav-toggle" onClick={() => setMobileMenuOpen(open => !open)} aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls={menuId}>
                    {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </button>
                <div id={menuId} className={`website-nav-links ${mobileMenuOpen ? 'is-open' : ''}`}>
                    <Link className="website-nav-link website-nav-overview" to="/#home" onClick={() => selectSection('home')}>Overview</Link>
                    <Link className="website-nav-link website-nav-faqs" to="/#faq" onClick={() => selectSection('faq')}>FAQs</Link>
                    <Link className="website-nav-link website-nav-app" to="/get-app" onClick={() => setMobileMenuOpen(false)} aria-current={location.pathname === '/get-app' ? 'page' : undefined}>Get the App</Link>
                    <button ref={portalRef} type="button" className="website-nav-link website-nav-sign-in" aria-haspopup="dialog" aria-expanded={portalOpen} onClick={() => { setMobileMenuOpen(false); setPortalOpen(true); }}>Staff / Admin sign-in</button>
                </div>
            </nav>
        </header>
        {portalOpen && <MobileDialog className="website-portal-dialog" title="Staff / Admin sign-in" onClose={closePortal}>
            <div className="website-portal-heading"><h2>Staff / Admin sign-in</h2><p>Choose your portal to sign in.</p></div>
            <div className="website-portal-choices"><Button orange onClick={() => navigate('/staff/login')}>Staff sign-in</Button><Button orange onClick={() => navigate('/admin/login')}>Admin sign-in</Button></div>
            <button type="button" className="website-portal-back" onClick={closePortal}>Back to landing page</button>
        </MobileDialog>}
    </>;
}
