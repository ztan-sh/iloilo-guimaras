import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useClient } from './MobileState';
import { assetSizes } from './assets';

export function Art({ file, className = '', alt = '', style, ...props }) {
    const size = assetSizes[file];
    return <img src={`/images/client/${file}`} width={size?.w} height={size?.h} alt={alt} className={`ggo-art ${className}`} style={style} {...props} />;
}
const icons = { user: '53aa8.svg', mail: '0ae68.svg', lock: '3a2e4.svg', eye: 'd7cb3.svg', back: '43307.svg', chevron: '552c0.svg', pencil: '02ad5.svg', ticket: '83e1d.svg', card: 'f3a7d.svg', bell: 'bac49.svg', moon: '7469c.svg', language: '7f588.svg', check: 'de98c.svg' };
// Auth icon file names vary between exported frames; these are the original
// profile-input exports, shared by the login, registration and edit forms.
export function Icon({ name }) { return <span className="ggo-icon"><Art file={icons[name]} /></span>; }
export function Brand({ route = false }) { return <div className="ggo-brand"><span className="ggo-brand-logo"><Art file="fe28f.svg" /></span><div><strong>Guimaras Go</strong>{route && <small>Iloilo ↔ Guimaras</small>}</div></div>; }
export function Button({ children, secondary = false, orange = false, className = '', ...props }) { return <button type="button" className={`ggo-button ${secondary ? 'ggo-secondary' : ''} ${orange ? 'ggo-orange' : ''} ${className}`} {...props}>{children}</button>; }
export function Field({ label, icon, type = 'text', hint, labelAction, ...props }) {
    const id = useId(); const [visible, setVisible] = useState(false);
    return <div className="ggo-field"><div className="ggo-field-label"><label htmlFor={id}>{label}</label>{labelAction}</div><div className="ggo-input">{icon && <Icon name={icon} />}<input id={id} type={type === 'password' && visible ? 'text' : type} {...props} />{type === 'password' && <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)}><Art file="d7cb3.svg" /></button>}</div>{hint && <small>{hint}</small>}</div>;
}
export function Gender({ value, onChange }) {
    const id = useId(); const [open, setOpen] = useState(false);
    return <div className="ggo-field"><div className="ggo-field-label"><label htmlFor={id}>Gender</label><button type="button" className="ggo-field-action" aria-label="Choose passenger gender" onClick={() => setOpen(true)}></button></div><div className="ggo-input"><Icon name="user" /><select id={id} value={value} onChange={onChange} required><option value="">Select gender</option>{['Male', 'Female'].map(g => <option key={g}>{g}</option>)}</select></div>{open && <MobileDialog fullscreen title="Passenger gender" onClose={() => setOpen(false)}><GenderPicker value={value} onSave={gender => { onChange({ target: { value: gender } }); setOpen(false); }} onCancel={() => setOpen(false)} /></MobileDialog>}</div>;
}
export function Choices({ options, value, onChange, label }) { return <div className="ggo-choices" role="group" aria-label={label}>{options.map(option => <button type="button" key={option} aria-pressed={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div>; }
export function Panel({ children, className = '', as: Tag = 'section', ...props }) { return <Tag className={`ggo-panel ${className}`} {...props}>{children}</Tag>; }
export function NotificationBell({ compact = false }) { const c = useClient(); return <Link className={`ggo-bell ${compact ? 'ggo-bell-compact' : ''}`} aria-label="Notifications" to={c.href('notifications')}><Icon name="bell" />{c.events.some(e => !c.read.includes(e.id)) && <Art file="1f53b.svg" className="ggo-unread-dot" />}</Link>; }
export function ProfileAvatar() {
    const c = useClient();
    const [failed, setFailed] = useState(false);
    const savedPhoto = c.user?.profilePhoto || c.user?.profilePicture || c.user?.profileImage || c.user?.avatarUrl || c.user?.photoURL || c.user?.imageUrl || c.user?.avatar || c.user?.photo || '';
    const apiRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const photo = savedPhoto ? (/^https?:\/\/|^data:image\//i.test(savedPhoto) ? savedPhoto : `${apiRoot}/${String(savedPhoto).replace(/^\/+/, '')}`) : '';
    useEffect(() => setFailed(false), [photo]);
    return <Link aria-label="Open profile" className="ggo-toolbar-profile" to={c.href('profile')}><span className="ggo-toolbar-avatar">{photo && !failed ? <img src={photo} alt={`${c.user?.fullName || 'Your'} profile`} onError={() => setFailed(true)} /> : <Art file="avatar-sarah.png" alt="Profile" />}</span></Link>;
}
export function Header({ title, description, toolbar = true, back }) {
    const c = useClient();
    return <header className="ggo-header">{toolbar && <div className="ggo-toolbar"><ProfileAvatar /><NotificationBell /></div>}
        {back && <Link className="ggo-back" aria-label="Back" to={c.href(back)}><Icon name="back" /></Link>}<h1>{title}</h1>{description && <p>{description}</p>}
    </header>;
}
export function Progress({ step }) { return <ol className="ggo-progress" aria-label="Checkout progress">{['Trip', 'Payment', 'Ticket'].map((label, i) => <li aria-current={step === i + 1 ? 'step' : undefined} key={label} className={step === i + 1 ? 'selected' : ''}>{i + 1} · {label}</li>)}</ol>; }
export function Footer({ children, helper }) { return <footer className="ggo-action-footer">{helper && <small>{helper}</small>}{children}</footer>; }
export function Row({ label, icon, children, to, onClick }) { const inner = <><Icon name={icon} /><span>{label}</span>{children || <Icon name="chevron" />}</>; return to ? <Link className="ggo-row" to={to}>{inner}</Link> : <button type="button" className="ggo-row" onClick={onClick}>{inner}</button>; }
export function Toggle({ value, onChange, label }) { return <button type="button" className={`ggo-toggle ${value ? 'on' : ''}`} role="switch" aria-checked={value} aria-label={label} onClick={onChange}><span /></button>; }

export function MobileDialog({ title, children, onClose, fullscreen = false, className = '' }) {
    const ref = useRef(null); const id = useId();
    useGSAP(() => {
        const dialog = ref.current; dialog.showModal();
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from(dialog, { opacity: 0, y: fullscreen ? 0 : 12, duration: 0.18, clearProps: 'opacity,transform' });
        return () => dialog.close();
    }, { scope: ref });
    return <dialog ref={ref} className={`ggo-dialog ${fullscreen ? 'ggo-dialog-fullscreen' : ''} ${className}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (!fullscreen && e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}><span id={id} className="ggo-visually-hidden">{title}</span>{children}</dialog>;
}

export function GenderPicker({ value, onSave, onCancel }) {
    const [selected, setSelected] = useState(value);
    const options = ['Male', 'Female', 'Prefer not to say', ...(value === 'Other' ? ['Other'] : [])];
    return <main className="ggo-page ggo-gender-page"><h1>Passenger gender</h1><p>Choose the gender for this passenger’s details.</p><div className="ggo-gender-options" role="group" aria-label="Passenger gender choices">{options.map(option => <button type="button" key={option} aria-pressed={selected === option} className={selected === option ? 'selected' : ''} onClick={() => setSelected(option)}>{option}</button>)}</div><div className="ggo-gender-actions"><Button disabled={!selected} onClick={() => onSave(selected)}>Done</Button><button type="button" className="ggo-picker-cancel" onClick={onCancel}>Cancel</button></div></main>;
}

export function ArtworkStage({ width, height, children, className = '' }) {
    const ref = useRef(null); const [scale, setScale] = useState(1);
    useLayoutEffect(() => { const node = ref.current; const observer = new ResizeObserver(() => setScale(node.clientWidth / width)); setScale(node.clientWidth / width); observer.observe(node); return () => observer.disconnect(); }, [width]);
    return <div ref={ref} className={`ggo-artwork-stage ${className}`} style={{ height: height * scale }}><div style={{ width, height, transform: `scale(${scale})` }}>{children}</div></div>;
}
