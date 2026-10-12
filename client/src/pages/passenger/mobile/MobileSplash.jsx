import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { useClient } from './MobileState';
import { Art } from './MobileUI';
import { ClientLogin } from './MobileAuth';
import { splashTracks } from './splashMotion';

gsap.registerPlugin(CustomEase);
const positions = {
    '204:370': ['9f3e2.svg', -201, 676], '204:384': ['6eb18.svg', -142, 700], '204:398': ['b883b.svg', -245, 735],
    '201:370': ['d398a.svg', 111, 347], '201:379': ['43a7f.svg', 131, 367],
    '201:388': ['31544.svg', 153.66, 416.61], '201:401': ['8ca13.svg', 169.08, 391.27], '201:414': ['d3b60.svg', 202.5, 388.67], '201:427': ['cee41.svg', 224.15, 402.84], '201:440': ['d6a54.svg', 231.97, 438.45], '201:453': ['13959.svg', 214.97, 459.7], '201:466': ['11e77.svg', 180.33, 464.72], '201:479': ['a9efa.svg', 154.56, 444.04], '194:1656': ['25de0.svg', 118.03, 371]
};
export default function ClientSplash() {
    const c = useClient(); const root = useRef();
    useEffect(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { c.go('login'); return; }
        const context = gsap.context(() => {
            const timeline = gsap.timeline({ onComplete: () => c.go('login') });
            for (const node of splashTracks) {
                const target = root.current.querySelector(`[data-motion-id="${node.id}"]`); if (!target) continue;
                const alias = key => key === 'rotate' ? 'rotation' : key;
                timeline.set(target, Object.fromEntries(Object.entries(node.initial).map(([k, v]) => [alias(k), v])), 0);
                for (const [key, values] of Object.entries(node.animate)) {
                    const t = node.transition[key];
                    for (let i = 1; i < values.length; i++) {
                        const ease = t.ease[i - 1];
                        const curve = Array.isArray(ease) ? CustomEase.create(`client-${node.id}-${key}-${i}`, `M0,0 C${ease.join(',')} 1,1`) : 'none';
                        timeline.to(target, { [alias(key)]: values[i], duration: (t.times[i] - t.times[i - 1]) * t.duration, ease: curve }, t.times[i - 1] * t.duration);
                    }
                }
            }
        }, root);
        return () => context.revert();
    }, []);
    return <div className="ggo-splash" ref={root} aria-label="Guimaras Go welcome animation"><div className="ggo-splash-canvas"><Art file="fe7ad.svg" className="ggo-glow-top" /><Art file="11b5e.svg" className="ggo-glow-bottom" /><Art file="2869d.svg" className="ggo-brand-ring" /><div className="ggo-splash-login" data-motion-id="254:1095"><ClientLogin /></div><div data-motion-id="204:369" className="ggo-ocean-waves">{Object.entries(positions).filter(([id]) => id.startsWith('204:')).map(([id, [file, x, y]]) => <div key={id} data-motion-id={id} style={{ left: x, top: y }}><Art file={file} /></div>)}</div>{Object.entries(positions).filter(([id]) => !id.startsWith('204:')).map(([id, [file, x, y]]) => <div key={id} data-motion-id={id} className="ggo-splash-particle" style={{ left: x, top: y }}><Art file={file} /></div>)}</div><button className="ggo-skip-splash" onClick={() => c.go('login')}>Skip</button></div>;
}
