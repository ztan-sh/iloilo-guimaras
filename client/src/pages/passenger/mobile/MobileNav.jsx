import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const navItems = [['dashboard', 'Home', '63c2a.svg'], ['bookings', 'My tickets', 'nav-tickets.svg'], ['history', 'Payment history', 'nav-payments.svg'], ['profile', 'Profile', 'nav-profile.svg']];

// Keep the 75px capsule and the updated 12px raised shoulder, moving its crest
// with the selected circle. The end caps rise too when an outer tab is active.
function navSurfacePath(width, centre) {
    const radius = 37.5; const shoulder = 61; const k = 0.55228475; const rise = 12;
    const middle = rise + radius; const bottom = rise + radius * 2;
    const top = x => { const d = Math.min(Math.abs(x - centre) / shoulder, 1); return rise - rise / 2 * (1 + Math.cos(Math.PI * d)); };
    const slope = x => { const d = x - centre; return Math.abs(d) >= shoulder ? 0 : rise / 2 * Math.PI / shoulder * Math.sin(Math.PI * d / shoulder); };
    const points = [radius, ...[centre - shoulder, centre - 30, centre, centre + 30, centre + shoulder].filter(x => x > radius && x < width - radius), width - radius];
    const n = value => Number(value.toFixed(3));
    const left = top(radius); const right = top(width - radius);
    let path = `M0 ${middle} C0 ${n(middle - (middle - left) * k)} ${n(radius * (1 - k))} ${n(left - slope(radius) * radius * k)} ${radius} ${n(left)}`;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]; const b = points[i]; const step = (b - a) / 3;
        path += ` C${n(a + step)} ${n(top(a) + slope(a) * step)} ${n(b - step)} ${n(top(b) - slope(b) * step)} ${n(b)} ${n(top(b))}`;
    }
    return `${path} C${n(width - radius * (1 - k))} ${n(right + slope(width - radius) * radius * k)} ${width} ${n(middle - (middle - right) * k)} ${width} ${middle} C${width} ${n(middle + radius * k)} ${n(width - radius * (1 - k))} ${bottom} ${n(width - radius)} ${bottom} H${radius} C${n(radius * (1 - k))} ${bottom} 0 ${n(middle + radius * k)} 0 ${middle} Z`;
}

export function BottomNav({ active, href }) {
    const ref = useRef(null); const activeRef = useRef(active); const moveRef = useRef(null);
    activeRef.current = active;
    useGSAP((context, contextSafe) => {
        const nav = ref.current; const glass = nav.querySelector('.ggo-nav-glass'); const sheen = nav.querySelector('.ggo-nav-sheen');
        const surface = nav.querySelector('.ggo-nav-surface'); const outline = nav.querySelector('.ggo-nav-outline'); const contour = outline.querySelector('path');
        const items = nav.querySelector('.ggo-nav-items');
        const icons = nav.querySelectorAll('.ggo-nav-icon'); const motion = matchMedia('(prefers-reduced-motion: reduce)');
        let travel; let width = nav.clientWidth;
        const shape = () => {
            const centre = Number(gsap.getProperty(glass, 'x')) + glass.offsetWidth / 2 + items.offsetLeft;
            const path = navSurfacePath(width, centre);
            surface.style.clipPath = `path('${path}')`;
            outline.setAttribute('viewBox', `0 0 ${width} 87`);
            contour.setAttribute('d', path);
        };
        const move = contextSafe(animate => {
            const target = nav.querySelector(`[data-page="${activeRef.current}"]`);
            if (!target) return;
            const x = target.offsetLeft + (target.offsetWidth - glass.offsetWidth) / 2;
            const distance = Math.abs(x - Number(gsap.getProperty(glass, 'x')));
            travel?.kill();
            if (!animate || motion.matches || distance < 0.5) {
                gsap.set(glass, { x, scaleX: 1, scaleY: 1, autoAlpha: 1 });
                shape();
                gsap.set(sheen, { opacity: 0 });
                gsap.set(icons, { y: 0, scale: 1 });
                gsap.set(target.querySelector('.ggo-nav-icon'), { y: -1, scale: 1.06 });
                return;
            }
            travel = gsap.timeline()
                .to(glass, { x, duration: 0.58, ease: 'power3.inOut', onUpdate: shape }, 0)
                .to(glass, { scaleX: Math.min(1.42, 1 + distance / 450), scaleY: 0.84, duration: 0.16, ease: 'power2.out' }, 0)
                .to(glass, { scaleX: 0.96, scaleY: 1.06, duration: 0.22, ease: 'power2.out' }, 0.16)
                .to(glass, { scaleX: 1, scaleY: 1, duration: 0.2, ease: 'power2.out' }, 0.38)
                .to(icons, { y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }, 0)
                .to(target.querySelector('.ggo-nav-icon'), { y: -1, scale: 1.06, duration: 0.32, ease: 'back.out(1.6)' }, 0.12)
                .fromTo(sheen, { xPercent: -65, opacity: 0 }, { xPercent: 65, opacity: 0.75, duration: 0.32, ease: 'power2.inOut' }, 0)
                .to(sheen, { opacity: 0, duration: 0.2 }, 0.32);
        });
        moveRef.current = move; move(false);
        const observer = new ResizeObserver(() => { if (nav.clientWidth !== width) { width = nav.clientWidth; move(false); } });
        observer.observe(nav);
        const motionChanged = () => move(false);
        motion.addEventListener('change', motionChanged);
        return () => { observer.disconnect(); motion.removeEventListener('change', motionChanged); moveRef.current = null; };
    }, { scope: ref });
    useGSAP(() => { moveRef.current?.(true); }, { scope: ref, dependencies: [active] });
    return <nav ref={ref} className="ggo-bottom-nav" aria-label="Client navigation"><span className="ggo-nav-surface" aria-hidden="true" /><svg className="ggo-nav-outline" width="100%" height="87" aria-hidden="true"><path fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="ggo-nav-items"><div className="ggo-nav-wells" aria-hidden="true">{navItems.map(([page]) => <span key={page} />)}</div><span className="ggo-nav-glass" aria-hidden="true"><span className="ggo-nav-sheen" /></span>{navItems.map(([page, label, file]) => <Link key={page} data-page={page} aria-label={label} aria-current={active === page ? 'page' : undefined} className={active === page ? 'active' : ''} to={href(page)}><img src={`/images/client/${file}`} width={20} height={20} alt="" className="ggo-art ggo-nav-icon" /><span className="ggo-nav-label">{label === 'My tickets' ? 'Tickets' : label === 'Payment history' ? 'Payments' : label}</span></Link>)}</div></nav>;
}
