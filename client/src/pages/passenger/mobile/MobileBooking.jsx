import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClient } from './MobileState';
import { Art, ArtworkStage, Button, Choices, Field, Footer, Gender, Header, MobileDialog, NotificationBell, Panel, Progress } from './MobileUI';
import { accountPerson, bookingIssue, bookingWindowIssue, canIssueTicket, departureCountdown, fareFor, money, normalizeSchedule, paymentState, photoIssue, requestFor, rideLabel, todayInManila } from './mobileUtils';
import { DEFAULT_PRICES, VESSELS, discountCategory, operationsStore, passengerIdentity, personIssue } from '../../../components/operations/operationsStore';
import { formatTime, matchesTrip, timeToMinutes } from '../../Staff/staffUtils';
import { createId } from '../../../utils/createId.js';

function VesselCard({ vessel, available, treatment, stackOrder, onSelect }) {
    const name = vessel;
    const lines = name.startsWith('MV ') ? ['MV', name.slice(3)] : [name];
    return <button type="button" className={`ggo-vessel ggo-vessel-${treatment}`} style={{ zIndex: stackOrder }} aria-label={`View ${vessel} schedules`} onClick={onSelect}>
        <ArtworkStage width={354} height={258} className="ggo-vessel-card">
            <Art className="ggo-vessel-shape" file={stackOrder === 1 ? `dashboard-card-first-${treatment}.svg` : `dashboard-card-${treatment}.svg`} />
            <span className="ggo-vessel-photo"><Art file="dashboard-ferry.png" width={310} height={170.441} /></span>
            <span className="ggo-vessel-meta"><span className="ggo-vessel-available">{available ? 'Available' : 'Full'}</span><span className="ggo-vessel-duration">25–35 min</span></span>
            <strong className="ggo-vessel-name">{lines.map((line, i) => <span key={i}>{line}</span>)}</strong>
            <span className="ggo-vessel-more">Show more<span className="ggo-vessel-chevron"><Art file="dashboard-chevron-white.svg" /></span></span>
        </ArtworkStage>
    </button>;
}

export function ClientDashboard() {
    const c = useClient();
    const vessels = [
        ...new Set(
            (c.schedules || [])
                .map(t => String(t.vesselName || "").trim())
                .filter(Boolean)
        ),
    ];

    const [vesselSearch, setVesselSearch] = useState("");
    const [fareListOpen, setFareListOpen] = useState(false);
    const [fareListLoading, setFareListLoading] = useState(false);
    const [fareListPrices, setFareListPrices] = useState(null);
    const [fareListError, setFareListError] = useState('');

    const openFareList = () => setFareListOpen(true);

    useEffect(() => {
        if (!fareListOpen) return undefined;
        if (c.preview) {
            setFareListPrices(Object.fromEntries(VESSELS.map(vessel => [vessel, { ...DEFAULT_PRICES, ...(c.operations.prices?.[vessel] || {}) }])));
            setFareListError('');
            return undefined;
        }

        let active = true;
        let loading = false;
        let initialLoad = true;
        const refreshPrices = async () => {
            if (!active || loading) return;
            loading = true;
            if (initialLoad) setFareListLoading(true);
            try {
                const results = await Promise.allSettled(VESSELS.map(vessel => c.request(`/pricing/public?vesselName=${encodeURIComponent(vessel)}&refresh=${Date.now()}`)));
                if (!active) return;
                const loaded = Object.fromEntries(results.flatMap((result, index) => result.status === 'fulfilled' ? [[VESSELS[index], result.value.prices]] : []));
                setFareListPrices(previous => ({ ...(previous || {}), ...loaded }));
                setFareListError(Object.keys(loaded).length === VESSELS.length ? '' : 'Some current fares could not be refreshed. Showing the last saved prices.');
            } catch {
                if (active) setFareListError('Unable to refresh current fares. Showing the last saved prices.');
            } finally {
                loading = false;
                if (initialLoad) {
                    initialLoad = false;
                    if (active) setFareListLoading(false);
                }
            }
        };
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') refreshPrices();
        };

        refreshPrices();
        const timer = window.setInterval(refreshPrices, 15000);
        window.addEventListener('focus', refreshPrices);
        document.addEventListener('visibilitychange', refreshWhenVisible);
        return () => {
            active = false;
            window.clearInterval(timer);
            window.removeEventListener('focus', refreshPrices);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
        };
    }, [fareListOpen, c.preview]);

    const filteredVessels = vessels.filter(vessel =>
        vessel.toLowerCase().includes(vesselSearch.trim().toLowerCase())
    );

    const [avatarFailed, setAvatarFailed] = useState(false);

    const savedPhoto =
        c.user?.profilePhoto ||
        c.user?.profilePicture ||
        c.user?.profileImage ||
        c.user?.avatarUrl ||
        c.user?.photoURL ||
        c.user?.imageUrl ||
        c.user?.avatar ||
        c.user?.photo ||
        "";

    const apiRoot = (
        import.meta.env.VITE_API_BASE_URL ||
        "https://iloilo-guimaras.onrender.com/api"
    ).replace(/\/api\/?$/, "");

    const profilePhoto = savedPhoto
        ? /^https?:\/\/|^data:image\//i.test(savedPhoto)
            ? savedPhoto
            : `${apiRoot}/${String(savedPhoto).replace(/^\/+/, "")}`
        : "";

    useEffect(() => {
        setAvatarFailed(false);
    }, [profilePhoto]);

    return (
        <main className="ggo-page ggo-has-nav ggo-dashboard">
            <header className="ggo-header ggo-dashboard-header">
                <div className="ggo-dashboard-toolbar">
                    <Link
                        aria-label="Open profile"
                        to={c.href("profile")}
                        className="ggo-dashboard-profile-link"
                    >
                        <span className="ggo-dashboard-avatar">
                            {profilePhoto && !avatarFailed ? (
                                <img
                                    src={profilePhoto}
                                    alt={`${c.user.fullName || "User"} profile`}
                                    onError={() => setAvatarFailed(true)}
                                />
                            ) : (
                                <Art
                                    file="dashboard-avatar.png"
                                    alt="Default profile avatar"
                                />
                            )}
                        </span>
                    </Link>

                    <NotificationBell compact />
                </div>

                <h1>
                    Hi, {c.user.fullName?.split(" ")[0] || "traveller"}!
                </h1>
                <p>Choose a vessel for your next crossing.</p>
                <div className="ggo-dashboard-actions">
                    <button
                        type="button"
                        className="ggo-guide-trigger"
                        onClick={c.openGuide}
                    >
                        How to use this app
                    </button>
                    <button type="button" className="ggo-fare-list-trigger" onClick={openFareList}>
                        Fare Pricing List
                    </button>
                </div>
            </header>

            {fareListOpen && <MobileDialog className="ggo-fare-pricing-dialog" title="Fare pricing list" onClose={() => setFareListOpen(false)}>
                <div className="ggo-fare-pricing-heading"><div><small>PASSENGER FARES</small><h2>Fare Pricing List</h2></div><button type="button" onClick={() => setFareListOpen(false)} aria-label="Close fare pricing list">×</button></div>
                {fareListLoading && <p>Loading current fares…</p>}
                {fareListError && <p className="ggo-fare-pricing-error" role="status">{fareListError}</p>}
                {fareListPrices && VESSELS.map(vessel => {
                    const prices = fareListPrices[vessel];
                    if (!prices) return null;
                    const price = key => Number(prices[key] ?? DEFAULT_PRICES[key] ?? 0);
                    const discount = key => (price('solo') * price(key) / 100).toFixed(2);
                    return <section className="ggo-fare-pricing-vessel" key={vessel}>
                        <h3>{vessel}</h3>
                        <dl>
                            <div><dt>Solo passenger</dt><dd>{money(price('solo'))}</dd></div>
                            <div><dt>Two passengers / companion fare</dt><dd>{money(price('companion'))}</dd></div>
                            <div><dt>Student discount per eligible passenger</dt><dd>{price('student')}% · {money(discount('student'))} off</dd></div>
                            <div><dt>PWD discount per eligible passenger</dt><dd>{price('pwd')}% · {money(discount('pwd'))} off</dd></div>
                            <div><dt>Senior discount per eligible passenger</dt><dd>{price('senior')}% · {money(discount('senior'))} off</dd></div>
                            <div><dt>Small motorcycle (250cc and below)</dt><dd>{money(price('motorcycle'))}</dd></div>
                            <div><dt>Small motorcycle stamp fee</dt><dd>{money(price('smallBikeStamp'))}</dd></div>
                            <div><dt>Big motorcycle (above 250cc)</dt><dd>{money(price('bigBike'))}</dd></div>
                            <div><dt>Big motorcycle stamp fee</dt><dd>{money(price('bigBikeStamp'))}</dd></div>
                            <div><dt>PPA fee</dt><dd>{money(price('ppa'))} per booking</dd></div>
                        </dl>
                    </section>;
                })}
                <p className="ggo-fare-pricing-note">Discounts require approval of a valid ID and apply to eligible passenger fares. Motorcycle fares, stamp fees, and PPA fees are separate. Final total depends on passengers, motorcycle type, and approved discounts.</p>
                <Button onClick={() => setFareListOpen(false)}>Done</Button>
            </MobileDialog>}

 <div className="ggo-vessel-search">
        <span className="ggo-vessel-search-icon" aria-hidden="true">
            <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
            </svg>
        </span>

        <input
            type="search"
            value={vesselSearch}
            onChange={e => setVesselSearch(e.target.value)}
            placeholder="Search available ferries..."
            aria-label="Search ferries by name"
            autoComplete="off"
        />

        {vesselSearch && (
            <button
                type="button"
                className="ggo-vessel-search-clear"
                onClick={() => setVesselSearch("")}
                aria-label="Clear ferry search"
            >
                ×
            </button>
        )}
    </div>

            <div
                className="ggo-vessels"
                role="region"
                aria-label="Available vessels"
                tabIndex={0}
            >
                 {filteredVessels.map((vessel, i) => (
                    <VesselCard
                        key={vessel}
                        vessel={vessel}
                        stackOrder={i + 1}
                        treatment={
                            /halili/i.test(vessel)
                                ? "orange"
                                : /felipe/i.test(vessel)
                                  ? "gold"
                                  : ["orange", "gold", "brown"][i % 3]
                        }
                        available={c.schedules.some(
                            t =>
                                t.vesselName === vessel &&
                                !t.bookingClosed &&
                                t.passengerRemaining > 0
                        )}
                        onSelect={() => {
                            c.setVessel(vessel);
                            c.go("schedule");
                        }}
                    />
                ))}

                 {!c.loading && vessels.length > 0 && filteredVessels.length === 0 && (
        <Panel>
            <h2>No matching ferries</h2>
            <p>
                No ferry matches "{vesselSearch}". Check the spelling
                or try another vessel name.
            </p>
            <Button secondary onClick={() => setVesselSearch("")}>
                Show all ferries
            </Button>
        </Panel>
    )}
                {!c.loading && !vessels.length && (
                    <Panel>
                        <h2>No departures available</h2>
                        <p>Choose another travel date to check schedules.</p>
                        <Field
                            label="Travel date"
                            type="date"
                            value={c.date}
                            onChange={e => c.setDate(e.target.value)}
                        />
                        <Button onClick={() => c.go("schedule")}>
                            View schedules
                        </Button>
                    </Panel>
                )}
            </div>
        </main>
    );
}


export function ClientSchedule() {
    const c = useClient();
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [now, setNow] = useState(Date.now);
    const [selectedRouteKey, setSelectedRouteKey] = useState('');
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
    const normalizePart = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const vesselTrips = c.schedules.map(normalizeSchedule).filter(t => normalizePart(t.vesselName) === normalizePart(c.vessel));
    const routeFor = trip => {
        const parts = String(trip.route || '').split(/\s*(?:→|->|↔)\s*/);
        const origin = String(trip.origin || parts[0] || '').trim();
        const destination = String(trip.destination || parts[1] || '').trim();
        return origin && destination ? { origin, destination, key: `${normalizePart(origin)}|${normalizePart(destination)}`, label: `${origin} → ${destination}` } : null;
    };
    const routeOptions = [...new Map(vesselTrips.map(routeFor).filter(Boolean).map(route => [route.key, route])).values()];
    const activeRoute = routeOptions.find(route => route.key === selectedRouteKey) || routeOptions[c.reverse ? 1 : 0] || routeOptions[0];
    useEffect(() => { if (activeRoute && activeRoute.key !== selectedRouteKey) setSelectedRouteKey(activeRoute.key); }, [activeRoute?.key, selectedRouteKey]);
    const trips = vesselTrips.filter(trip => routeFor(trip)?.key === activeRoute?.key).sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime));
    const next = trips.find(t => !t.bookingClosed && t.passengerRemaining > 0 && !bookingWindowIssue(t, false, now) && departureCountdown(t, now)?.minutes > 0);
    const shortTime = time => {
        const match = formatTime(time).match(/^(\d+):(\d+) (AM|PM)$/);
        if (!match) return formatTime(time);
        return `${Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0)}:${match[2]}`;
    };
    const select = trip => { const issue = bookingWindowIssue(trip, false, now); if (issue) { c.setError(issue); return; } c.setDraft({ trip, people: [accountPerson(c.user)], motorcycle: false, motorcycleType: '', plateNumber: '', regularFare: false }); c.go('book-trip'); };
    const changeRoute = () => {
        if (routeOptions.length < 2) return;
        const currentIndex = Math.max(0, routeOptions.findIndex(route => route.key === activeRoute?.key));
        const reverseKey = `${normalizePart(activeRoute.destination)}|${normalizePart(activeRoute.origin)}`;
        const reverseIndex = routeOptions.findIndex(route => route.key === reverseKey);
        const nextIndex = reverseIndex >= 0 ? reverseIndex : (currentIndex + 1) % routeOptions.length;
        setSelectedRouteKey(routeOptions[nextIndex].key);
        c.setReverse(nextIndex > 0);
    };
    return <main className="ggo-schedule">
        <header className="ggo-schedule-hero">
            <Art file="a2b02.png" width="428" height="228" />
            <Link className="ggo-schedule-back" aria-label="Back to vessels" to={c.href('dashboard')}><Art file="schedule-back.svg" /></Link>
            <NotificationBell compact />
            <div className="ggo-schedule-intro"><h1>Hello!</h1><p className="ggo-schedule-vessel-name">{c.vessel}</p></div>
            <div className="ggo-crossing"><strong>{activeRoute?.origin.toUpperCase() || '—'}</strong><div className="ggo-crossing-track"><Art file="7eaf1.svg" /><Art file="7f903.svg" /><Art file="3c859.svg" className="ggo-crossing-boat" /><small>25–35 min</small></div><strong>{activeRoute?.destination.toUpperCase() || '—'}</strong></div>
        </header>
        <div className="ggo-direction"><strong>{activeRoute?.origin.toUpperCase() || '—'}</strong><button type="button" aria-label="Change route" disabled={routeOptions.length < 2} onClick={changeRoute}><Art file="schedule-repeat.png" /></button><strong>{activeRoute?.destination.toUpperCase() || '—'}</strong></div>
        <div className="ggo-departures">{trips.map(t => {
            const soldOut = t.bookingClosed || t.passengerRemaining < 1;
            const departed = departureCountdown(t, now)?.minutes === 0;
            const windowIssue = bookingWindowIssue(t, false, now);
            const countdown = t.id === next?.id ? departureCountdown(t, now) : null;
            return <button type="button" key={t.id} className={`ggo-departure ${countdown ? 'ggo-departure-next' : ''}`} disabled={soldOut || departed} onClick={() => select(t)} aria-label={`${departed ? 'Departed' : 'Select'} ${formatTime(t.departureTime)} departure, ${t.passengerRemaining} passenger spaces`}>
                {countdown && <span className="ggo-leaving"><small>LEAVING IN</small><span><strong>{countdown.value}</strong><b>{countdown.unit}</b></span></span>}
                <span className="ggo-departure-details"><span className="ggo-departure-main">
                    <span><small>Departure on</small><strong title={formatTime(t.departureTime)}>{shortTime(t.departureTime)}</strong></span>
                    <span className="ggo-duration"><small>Travel time</small><b>25–35 MINS</b></span>
                    <span className="ggo-arrival"><small>Arrival</small><strong title={formatTime(t.arrivalTime)}>{shortTime(t.arrivalTime)}</strong></span>
                </span><span className="ggo-departure-meta">
                    {soldOut ? <span className="ggo-seats-left">{t.passengerRemaining} seats left</span> : <span className="ggo-capacity" aria-label={`${t.motorcycleRemaining} motorcycles available online of ${t.motorcycleCapacity} total`}><span><Art file="schedule-car.png" />{t.motorcycleRemaining}/{t.motorcycleCapacity}</span><span>available</span></span>}
                    <span className="ggo-tap" title={windowIssue || undefined}>{departed ? 'Departed' : soldOut ? 'Sold out' : windowIssue ? '3-hour cutoff' : 'Tap to select'}{!soldOut && !departed && !windowIssue && <b><Art file="79263.svg" /></b>}</span>
                </span></span>
            </button>;
        })}{!c.loading && !trips.length && <Panel>No departures for this date and direction.</Panel>}</div>
        <div className="ggo-schedule-book-action"><Button orange onClick={() => setOptionsOpen(true)}>Book a Trip</Button></div>
        {optionsOpen && <MobileDialog title="Travel options" onClose={() => setOptionsOpen(false)}><h2>Travel options</h2><div className="ggo-schedule-controls"><div><label htmlFor="ggo-schedule-date">Travel date</label><input id="ggo-schedule-date" type="date" value={c.date} min={todayInManila()} onChange={e => c.setDate(e.target.value)} /></div><div><label htmlFor="ggo-schedule-vessel">Vessel</label><select id="ggo-schedule-vessel" value={c.vessel} onChange={e => c.setVessel(e.target.value)}>{[...new Set(c.schedules.map(t => t.vesselName))].map(v => <option key={v}>{v}</option>)}{!c.schedules.some(t => t.vesselName === c.vessel) && <option>{c.vessel}</option>}</select></div><div><label htmlFor="ggo-schedule-route">Route</label><select id="ggo-schedule-route" value={activeRoute?.key || ''} onChange={e => { setSelectedRouteKey(e.target.value); c.setReverse(routeOptions.findIndex(route => route.key === e.target.value) > 0); }}>{routeOptions.map(route => <option key={route.key} value={route.key}>{route.label}</option>)}</select></div></div><p className="ggo-schedule-booking-rules">Passenger-only trips can be booked today up to 3 hours before departure. Trips with a motorcycle must be booked at least 24 hours ahead.</p><Button onClick={() => setOptionsOpen(false)}>Done</Button></MobileDialog>}
    </main>;
}
export function BookingTicket({ draft, fare }) {
    const [origin, destination] = draft.trip.route.split(' → ');
    return <section className="ggo-orange-ticket" aria-label="Fare preview">
        <Art file="4c605.svg" className="ggo-ticket-shape" />
        <div className="ggo-ticket-buyer"><span title={draft.people[0].name}>{draft.people[0].name}</span><small>Passenger 1 (Buyer)</small></div>
        <h2 className="ggo-ticket-vessel">{draft.trip.vesselName}</h2>
        <div className="ggo-ticket-route">
            <Art file="148be.svg" className="ggo-ticket-route-line" />
            <span className="ggo-ticket-origin"><small>{origin}</small><span>{formatTime(draft.trip.departureTime)}</span></span>
            <span className="ggo-ticket-transit"><small>Destination</small><small>25–35 min</small></span>
            <span className="ggo-ticket-destination"><small>{destination}</small><span>{formatTime(draft.trip.arrivalTime)}</span></span>
        </div>
        <h3 className="ggo-ticket-fare-heading">Fare Summary</h3>
        <small className="ggo-ticket-approval">{fare.discount ? 'ID approved by staff' : 'Staff approval required for discounts'}</small>
        <small className="ggo-ticket-passenger-fare">Passenger fare {money(fare.passengerFare)}</small>
        <Art file="b5b20.svg" className="ggo-ticket-fare-line" />
        <div className="ggo-ticket-total"><span>TOTAL FARE</span><strong>{money(fare.total)}</strong></div>
        <small className="ggo-ticket-fare-status">{fare.discount ? 'Discount applies to passenger fares only' : 'Regular fare · No discount requested'}</small>
    </section>;
}
export function FareSummary({ draft, fare }) {
    return <Panel className="ggo-fare"><h2>Your crossing</h2><div className="ggo-fare-meta"><small>{draft.trip.vesselName} · {formatTime(draft.trip.departureTime)}</small><small>{draft.people.length} passenger{draft.people.length === 1 ? '' : 's'}</small></div><dl><div><dt>Ride type</dt><dd>{rideLabel(draft)}</dd></div><div><dt>Passenger fare</dt><dd>{money(fare.passengerFare)}</dd></div>{draft.motorcycle && <div><dt>{draft.motorcycleType === 'big-bike' ? 'Big bike (above 250cc)' : 'Small bike (250cc and below)'}</dt><dd>{money(fare.motorcycleFare)}</dd></div>}{draft.motorcycle && <div><dt>Stamp fee</dt><dd>{money(fare.stampFee)}</dd></div>}<div><dt>Passenger discounts</dt><dd>−{money(fare.discount)}</dd></div><div><dt>PPA fee</dt><dd>{money(fare.ppa)}</dd></div><div className="ggo-total"><dt>Total to pay</dt><dd>{money(fare.total)}</dd></div></dl><small>{fare.discount ? 'Passenger discounts · ID approved by staff' : 'Regular fare · No discount applied'}</small></Panel>;
}
export function ClientBook() {
    const c = useClient(); const d = c.draft;
    const [livePrices, setLivePrices] = useState(null);
    useEffect(() => { let cancelled = false; if (!d?.trip?.vesselName || c.preview) { setLivePrices(null); return; } c.request(`/pricing/public?vesselName=${encodeURIComponent(d.trip.vesselName)}`).then(result => { if (!cancelled) setLivePrices(result.prices); }).catch(() => { if (!cancelled) setLivePrices(null); }); return () => { cancelled = true; }; }, [d?.trip?.vesselName, c.preview]);
    const [bikeQuestionOpen, setBikeQuestionOpen] = useState(false);
    const [motorcycleWarning, setMotorcycleWarning] = useState('');
    const change = patch => c.setDraft({ ...d, ...patch });
    const people = (index, patch) => change({ people: d.people.map((p, i) => i === index ? { ...p, ...patch } : p) });
    const count = number => { if (number < 1 || number > (d.motorcycle ? 3 : 10)) return; change({ people: number < d.people.length ? d.people.slice(0, number) : [...d.people, { id: createId(), name: '', age: '', gender: '', category: 'Regular' }] }); };
    const takeID = person => { const issue = personIssue(person); if (issue) return c.setError(issue); c.setPhoto(null); c.setPhotoPerson(person); c.setPhotoReturn('book-trip'); c.go('id-photo'); };
    const chooseMotorcycle = motorcycleType => {
        const issue = bookingWindowIssue(d.trip, true);
        if (issue) { setBikeQuestionOpen(false); c.setError(''); setMotorcycleWarning(issue); return; }
        change({ motorcycle: true, motorcycleType, people: d.people.slice(0, 3) });
        setBikeQuestionOpen(false);
    };
    const requestMotorcycle = () => {
        const issue = bookingWindowIssue(d.trip, true);
        if (issue) { c.setError(''); setMotorcycleWarning(issue); return; }
        setBikeQuestionOpen(true);
    };
    const submit = () => {
        if (d.motorcycle && !d.motorcycleType) { setBikeQuestionOpen(true); return; }
        const current = c.schedules.map(normalizeSchedule).find(t => t.id === d.trip.id && t.date === d.trip.date) || d.trip;
        const latest = { ...d, trip: current }; const issue = bookingIssue(latest, c.operations.requests, c.preview);
        if (issue) { c.setError(issue); document.getElementById('ggo-passenger-details')?.scrollIntoView({ behavior: 'smooth' }); return; }
        c.setDraft(latest); c.go('payment');
    };
    if (!d) return <main className="ggo-page"><Header title="Book ticket" description="Choose a departure to begin." /><Button onClick={() => c.go('schedule')}>View schedules</Button></main>;
    const fare = fareFor(d, c.operations, c.preview, livePrices); const eligible = d.people.filter(p => discountCategory(p) !== 'Regular');
    return <main className="ggo-page ggo-book-page">
        <header className="ggo-header ggo-book-header">
            <div className="ggo-book-toolbar"><Link aria-label="Back to departures" to={c.href('schedule')}><span className="ggo-book-back-art"><Art file="43307.svg" /></span></Link><NotificationBell compact /></div>
            <h1>Book ticket</h1><p>Review your crossing and passenger details.</p>
        </header>
        <Progress step={1} />
        <BookingTicket draft={d} fare={fare} />
        <div className="ggo-book-details" role="region" aria-label="Booking details" tabIndex={0}>
            <Panel className="ggo-book-vehicle"><h3>Vehicle</h3>
                <Choices label="Vehicle" options={['No motorcycle', 'Motorcycle']} value={d.motorcycle ? 'Motorcycle' : 'No motorcycle'} onChange={value => value === 'Motorcycle' ? requestMotorcycle() : change({ motorcycle: false, motorcycleType: '', plateNumber: '' })} />
                {d.motorcycle && <small>Motorcycle type: {d.motorcycleType === 'big-bike' ? 'Big bike' : d.motorcycleType === 'standard' ? 'Standard motorcycle' : 'Select motorcycle type'}</small>}
            </Panel>
            <Panel className="ggo-book-count"><div className="ggo-quantity"><span>How many are travelling?</span><div className="ggo-book-count-controls"><button type="button" aria-label="Remove passenger" disabled={d.people.length === 1} onClick={() => count(d.people.length - 1)}>−</button><strong aria-live="polite">{d.people.length}</strong><button type="button" aria-label="Add passenger" disabled={d.people.length === (d.motorcycle ? 3 : 10)} onClick={() => count(d.people.length + 1)}>+</button></div></div><small>{d.motorcycle ? `${d.motorcycleType === 'big-bike' ? 'Big bike' : 'Motorcycle'} · Maximum 3 passengers` : 'No motorcycle · Maximum 10 passengers'}</small></Panel>
            <div id="ggo-passenger-details" className="ggo-passenger-details">
                {d.people.map((p, i) => <Panel key={p.id} className={i === 0 ? 'ggo-book-buyer' : ''}>
                    <div className="ggo-panel-heading"><h3>Passenger {i + 1}</h3>{i === 0 && <Link to={c.href('edit-profile')}>Edit profile</Link>}</div>
                    {i === 0 ? <><strong className="ggo-book-identity">{p.name}</strong><p>{p.age === '' ? 'Age needed' : `Age ${p.age}`} · {p.gender || 'Gender needed'}</p><small>Age and category come from registration. Your ID approval is reused for discounts.</small><p>{discountCategory(p)} · Saved from registration</p></> : <>
                        <Field label={`Passenger ${i + 1} name`} value={p.name} onChange={e => people(i, { name: e.target.value })} required />
                        <div className="ggo-two"><Field label={`Passenger ${i + 1} age`} type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} min="0" max="120" value={p.age} onChange={e => people(i, { age: e.target.value.replace(/\D/g, '').slice(0, 3) })} required /><Gender value={p.gender} onChange={e => people(i, { gender: e.target.value })} /></div>
                        <h3>Passenger category</h3><Choices label={`Passenger ${i + 1} category`} options={['Regular', 'Student', 'PWD']} value={p.category} onChange={value => people(i, { category: value })} />
                    </>}
                    {Number(p.age) >= 60 && <small>Age 60+ · Senior eligibility requires staff approval.</small>}
                    {discountCategory(p) !== 'Regular' && <div className="ggo-id-request"><small>{requestFor(c.operations.requests, p)?.status === 'approved' ? 'ID approved · Passenger discount available' : requestFor(c.operations.requests, p)?.status === 'pending' ? 'ID submitted · Awaiting staff review' : requestFor(c.operations.requests, p)?.status === 'requested' ? 'Staff requested a clearer photo' : 'ID photo required before booking'}</small><Button secondary onClick={() => ['pending', 'approved'].includes(requestFor(c.operations.requests, p)?.status) ? c.go('id-status') : takeID(p)}>{['pending', 'approved'].includes(requestFor(c.operations.requests, p)?.status) ? 'Check review status' : 'Upload ID photo'}</Button></div>}
                </Panel>)}
            </div>
            {d.motorcycle && <Panel><h3>Motorcycle details</h3><Field label="Plate number" value={d.plateNumber} onChange={e => change({ plateNumber: e.target.value })} placeholder="ABC 1234" required /></Panel>}
            {eligible.length > 0 && <Panel><label className="ggo-check"><input type="checkbox" checked={d.regularFare} onChange={e => change({ regularFare: e.target.checked })} />Continue at regular fare</label><small>Choose this to travel while an ID review is pending.</small></Panel>}
            <p className="ggo-book-policy">Passenger 1 uses your profile. Ages 60+, Student and PWD need ID approval for a passenger discount. Your total includes the configured passenger fare{d.motorcycle ? ', motorcycle charge' : ''} and PPA fee.</p>
        </div>
        <Footer helper="Scroll for passenger details and discounts"><Button onClick={submit}>Continue · {money(fare.total)}</Button></Footer>
        {bikeQuestionOpen && <MobileDialog className="ggo-bike-dialog" title="What is your motorcycle engine capacity?" onClose={() => setBikeQuestionOpen(false)}>
            <div className="ggo-bike-question"><h2>What is your motorcycle engine capacity?</h2><p>Above 250cc is a big bike. 250cc and below is a small bike.</p></div>
            <div className="ggo-bike-answers"><Button onClick={() => chooseMotorcycle('big-bike')}>Big bike</Button><Button secondary onClick={() => chooseMotorcycle('standard')}>Small bike</Button></div>
            <small>Up to 3 passengers, including you.</small>
        </MobileDialog>}
        {motorcycleWarning && <MobileDialog className="ggo-bike-warning-dialog" title="Motorcycle booking notice" onClose={() => setMotorcycleWarning('')}>
            <div className="ggo-bike-warning" role="alert">
                <span className="ggo-bike-warning-icon" aria-hidden="true">!</span>
                <h2>Motorcycle booking notice</h2>
                <p>{motorcycleWarning}</p>
                <Button orange onClick={() => setMotorcycleWarning('')}>Got it</Button>
            </div>
        </MobileDialog>}
    </main>;
}
export function ClientPayment() {
    const c = useClient(); const d = c.draft; const [livePrices, setLivePrices] = useState(null); const [pricingLoading, setPricingLoading] = useState(false); const [method, setMethod] = useState(c.preview ? 'GCash' : 'Maya'); const [receipt, setReceipt] = useState(null); const [submitting, setSubmitting] = useState(false); const reference = useRef(`GG-${createId().slice(0, 12).toUpperCase()}`); const inFlight = useRef(false);
    useEffect(() => { let cancelled = false; if (!d?.trip?.vesselName || c.preview) { setLivePrices(null); return; } setPricingLoading(true); c.request(`/pricing/public?vesselName=${encodeURIComponent(d.trip.vesselName)}`).then(result => { if (!cancelled) setLivePrices(result.prices); }).catch(error => { if (!cancelled) c.setError(error.message || 'Unable to load current fares.'); }).finally(() => { if (!cancelled) setPricingLoading(false); }); return () => { cancelled = true; }; }, [d?.trip?.vesselName, c.preview]);
    if (!d) return <main className="ggo-page"><Header title="Payment" description="Choose a crossing before payment." /><Button onClick={() => c.go('schedule')}>View schedules</Button></main>;
    const fare = fareFor(d, c.operations, c.preview, livePrices);
    const pay = () => { if (inFlight.current) return; inFlight.current = true; setSubmitting(true); c.run(async () => {
        const current = c.schedules.map(normalizeSchedule).find(t => t.id === d.trip.id && t.date === d.trip.date) || d.trip;
        const issue = bookingIssue({ ...d, trip: current }, c.operations.requests, c.preview); if (issue) throw new Error(issue);
        const [origin, destination] = d.trip.route.split(' → ');
        const b = { bookingReference: reference.current, userId: c.user.id || c.user._id, origin, destination, date: d.trip.date, time: d.trip.departureTime, arrivalTime: d.trip.arrivalTime, ferryId: d.trip.id, ferryName: d.trip.vesselName, vesselName: d.trip.vesselName, passengerName: d.people[0].name, passengerAge: Number(d.people[0].age), passengerGender: d.people[0].gender, passengers: d.people.length, passengerDetails: d.people.map(p => ({ ...p, age: Number(p.age) })), accompanyingPassengers: d.people.slice(1).map(p => p.name), vehicleType: d.motorcycle ? 'Motorcycle' : 'No Motorcycle', motorcycleType: d.motorcycle ? d.motorcycleType || 'standard' : '', plateNumber: d.motorcycle ? d.plateNumber : '', passengerFare: fare.passengerFare, motorcycleFare: fare.motorcycleFare, stampFee: fare.stampFee, ppaFee: fare.ppa, requiredAmount: fare.total, fareSnapshot: fare, paymentMethod: method };
        let saved;
        if (c.preview) {
            await new Promise(resolve => setTimeout(resolve, 650));
            saved = operationsStore.addBooking({ ...b, _id: createId(), ticketSource: 'ONLINE', paymentStatus: 'PENDING VERIFICATION', status: 'PENDING PAYMENT VERIFICATION', boardingStatus: 'NOT BOARDED', totalPaid: null, createdAt: new Date().toISOString() });
        } else {
            if (!receipt) throw new Error('Upload your payment receipt before submitting.');
            if (!['image/jpeg', 'image/png'].includes(receipt.type) || receipt.size > 5 * 1024 * 1024) throw new Error('Use a JPG or PNG payment receipt smaller than 5 MB.');
            const form = new FormData(); form.append('paymentProof', receipt); const upload = await c.request('/payment/upload-proof', { method: 'POST', body: form });
            const result = await c.request('/payment/create-booking', { method: 'POST', body: { ...b, paymentMethod: 'Maya / QRPh', paymentProof: { fileName: upload.file.filename, originalName: upload.file.originalName, fileType: upload.file.mimetype, fileSize: upload.file.size, url: upload.file.url } } });
            saved = result.booking; c.setBookings(prev => [...prev, saved]);
        }
        c.setDraft(null); c.go(`confirmation?reference=${encodeURIComponent(saved.bookingReference)}`);
    }).finally(() => { inFlight.current = false; setSubmitting(false); }); };
    return <main className="ggo-page ggo-has-footer"><Header title="Payment" description="Review your fare and select a payment method." /><Progress step={2} /><FareSummary draft={d} fare={fare} /><h3 className="ggo-section-label">Payment method</h3><div className="ggo-payment-methods">{['GCash', 'Maya', 'Mastercard'].map(m => <button key={m} className={method === m ? 'selected' : ''} disabled={!c.preview && m !== 'Maya'} aria-pressed={method === m} onClick={() => setMethod(m)}><span className="ggo-payment-logo">{m === 'GCash' ? <Art file="a55ac.svg" /> : m === 'Mastercard' ? <Art file="45fd3.svg" /> : <Art file="aa4b9.svg" />}</span><span>{m}</span><span className="ggo-radio" /></button>)}</div>{!c.preview && <Panel><h3>Maya / QRPh payment</h3><p>Scan the merchant QR, pay {money(fare.total)}, then upload the receipt. Your ticket will be issued after payment verification.</p><img className="ggo-merchant-qr" src="/images/maya-qr.jpg" alt="Maya merchant payment QR" onError={e => { e.currentTarget.hidden = true; }} /><Field label="Payment receipt" type="file" accept="image/jpeg,image/png" onChange={e => setReceipt(e.target.files[0])} /></Panel>}{c.preview && <small className="ggo-payment-note">This preview creates a sample processing payment. Use the preview controls on the next screen to test its outcome.</small>}<Footer><Button disabled={c.busy || submitting || (!c.preview && (!livePrices || pricingLoading))} onClick={pay}>{c.busy ? 'Submitting…' : c.preview ? `Pay ${money(fare.total)}` : 'Submit payment for verification'}</Button><Link className="ggo-text-link" to={c.href('book-trip')}>Back to booking</Link></Footer></main>;
}
export function ClientID() {
    const c = useClient(); const f = useRef(); const person = c.photoPerson || c.draft?.people[0] || accountPerson(c.user); const path = c.path;
    const missing = path === 'id-required'; const review = path === 'id-review'; const status = ['id-status', 'id-approved', 'id-attention'].includes(path);
    const eligible = (c.draft?.people || [person]).filter(p => discountCategory(p) !== 'Regular'); const requests = eligible.map(p => requestFor(c.operations.requests, p));
    const allApproved = eligible.length > 0 && requests.every(r => r?.status === 'approved' && r.photo); const attention = requests.find(r => r?.status === 'requested');
    const title = missing ? 'ID photo required' : status ? allApproved ? 'Discount approved' : attention ? 'ID photo needs attention' : 'Awaiting staff review' : review ? 'Review ID photo' : 'Take ID photo';
    const upload = file => { const issue = photoIssue(file); if (issue) return c.setError(issue); const reader = new FileReader(); reader.onerror = () => c.setError('Unable to read this photo. Choose another file.'); reader.onload = () => { c.setPhoto(String(reader.result)); c.go('id-review'); }; reader.readAsDataURL(file); };
    const refreshReview = () => c.run(async () => {
        const result = await c.request('/auth/discount-requests');
        c.setDiscountRequests((result.requests || []).map(item => {
            const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
            return { id: item._id, passenger, identity: passengerIdentity(passenger), photo: item.photo, status: item.status, reason: item.reason || '', source: item.source || '', requestId: item._id };
        }));
    });
    const usePhoto = () => {
        if (!c.photo) return c.setError('Take an ID photo first.');
        if (c.photoReturn === 'register') { c.setRegistration({ ...c.registration, idPhoto: c.photo }); c.setPhoto(null); c.go('register'); }
        else if (c.preview) { operationsStore.requestID(person, c.photo, 'Client mobile booking'); c.setPhoto(null); c.go('id-status'); }
        else c.run(async () => {
            const result = await c.request('/auth/discount-requests', { method: 'POST', body: { passengerId: String(person.id), passengerName: person.name, age: Number(person.age), gender: person.gender, category: discountCategory(person), photo: c.photo, source: 'Passenger booking' } });
            const item = result.request;
            const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
            c.setDiscountRequests(previous => [...previous.filter(entry => entry.id !== item._id), { id: item._id, passenger, identity: passengerIdentity(passenger), photo: item.photo, status: item.status, reason: item.reason || '', source: item.source || '', requestId: item._id }]);
            c.setPhoto(null); c.go('book-trip');
        });
    };
    return <main className="ggo-page ggo-has-footer"><Header title={title} description={missing ? 'Add a photo for every passenger requesting a discount.' : status ? allApproved ? 'Staff have approved the required ID photos.' : attention ? 'Staff could not approve the submitted photo.' : 'Your ID photos have been submitted.' : review ? 'Check that the name and ID details are readable.' : 'Discount verification · Staff approval required'} /><input ref={f} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = ''; }} />{missing ? <p>You can submit the discount request once all required ID photos are attached.</p> : status ? <Panel><h2>{allApproved ? 'Your passenger discount is ready' : attention ? 'Take another ID photo' : 'Passenger discount · Pending approval'}</h2><p>{allApproved ? 'A discount is applied to each approved passenger fare. The motorcycle charge stays separate.' : attention ? attention.reason : 'Each ID is reviewed separately. Continue after all requested IDs are approved.'}</p>{allApproved && c.draft && <><p>{rideLabel(c.draft)}</p><small>Total to pay</small><strong className="ggo-large-amount">{money(fareFor(c.draft, c.operations, c.preview).total)}</strong></>}<small>A booking is confirmed after payment. ID approval does not issue a ticket.</small></Panel> : <Panel><h3>{person.name || 'Passenger ID'}</h3><small>{discountCategory(person)}</small><div className="ggo-photo-frame">{review && c.photo ? <img src={c.photo} alt="Captured passenger ID for review" /> : <><strong>Place your ID inside the frame</strong><small>Check that all ID details are readable.</small></>}</div><p>{review ? 'Staff will review this photo before applying your passenger discount.' : 'Photograph the original, valid ID. Make sure the name, photo and ID details are readable.'}</p></Panel>}
        <Footer>{missing ? <Button orange onClick={() => c.go(c.photoReturn)}>Back to {c.photoReturn === 'register' ? 'registration' : 'booking'}</Button> : status ? <><Button secondary onClick={() => { if (attention && c.draft) c.setDraft({ ...c.draft, regularFare: true }); c.go('book-trip'); }}>{attention ? 'Continue at regular fare' : 'Back to booking'}</Button><Button orange disabled={c.busy} onClick={() => { if (allApproved) c.go('payment'); else if (attention) { c.setPhotoPerson(attention.passenger); c.setPhoto(null); c.go('id-photo'); } else if (c.preview) { c.setError('Staff review is still pending. Check again after the staff review.'); } else refreshReview(); }}>{allApproved ? 'Continue to payment' : attention ? 'Take a new photo' : c.busy ? 'Checking…' : 'Check review status'}</Button></> : review ? <><Button secondary onClick={() => { c.setPhoto(null); c.go('id-photo'); }}>Retake photo</Button><Button orange disabled={!c.photo || c.busy} onClick={usePhoto}>{c.busy ? 'Submitting…' : 'Use photo'}</Button></> : <><Button secondary onClick={() => c.go(c.photoReturn)}>Back to {c.photoReturn === 'register' ? 'registration' : 'booking'}</Button><Button orange onClick={() => f.current.click()}>Choose ID photo</Button></>}</Footer></main>;
}
