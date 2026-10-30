
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { operationsStore, passengerIdentity } from '../../../components/operations/operationsStore';
import { useOperations } from '../../../components/operations/useOperations';
import {
    accountPerson,
    canonicalVesselName,
    clientEvents,
    normalizeSchedule,
    previewSchedules,
    sampleClientBookings,
    todayInManila
} from './mobileUtils';
import { createId } from '../../../utils/createId.js';
import { BottomNav } from './MobileNav';
import './Mobile.css';

const Context = createContext(null);

const passengerGuideSteps = [
    {
        title: 'Choose a ferry',
        detail: 'Browse the vessel cards on Home. Tap “Show more” to view that ferry’s trips and schedule.'
    },
    {
        title: 'Pick a departure',
        detail: 'Choose your travel date and route, then tap an available departure time to continue booking.'
    },
    {
        title: 'Finish your booking',
        detail: 'Enter passenger details, choose whether you are bringing a motorcycle, then follow the payment steps.'
    },
    {
        title: 'Find your tickets',
        detail: 'Open Tickets in the bottom menu to see confirmed bookings and boarding passes.'
    },
    {
        title: 'Check payments',
        detail: 'Open Payments to review whether a payment is processing, paid, or needs attention.'
    },
    {
        title: 'Manage your account',
        detail: 'Open Profile to update your details, notification preferences, language, and other settings.'
    },
    {
        title: 'See notifications',
        detail: 'Tap the bell near the top of the screen to read booking, payment, and account updates.'
    }
];

function PassengerGuide({ onClose }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const closeOnEscape = event => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    const current = passengerGuideSteps[step];
    const lastStep = step === passengerGuideSteps.length - 1;

    return (
        <div className="ggo-guide-overlay">
            <section className="ggo-guide-card" role="dialog" aria-modal="true" aria-labelledby="ggo-guide-title">
                <div className="ggo-guide-heading">
                    <span>QUICK GUIDE · {step + 1} OF {passengerGuideSteps.length}</span>
                    <button type="button" className="ggo-guide-close" onClick={onClose} aria-label="Close guide">×</button>
                </div>
                <div className="ggo-guide-message" key={step}>
                    <h2 id="ggo-guide-title">{current.title}</h2>
                    <p>{current.detail}</p>
                </div>
                <div className="ggo-guide-progress" aria-label={`Guide step ${step + 1} of ${passengerGuideSteps.length}`}>
                    {passengerGuideSteps.map((item, index) => (
                        <span key={item.title} className={index <= step ? 'active' : ''} />
                    ))}
                </div>
                <div className="ggo-guide-actions">
                    <button type="button" className="ggo-guide-skip" onClick={onClose}>Skip guide</button>
                    <div>
                        {step > 0 && <button type="button" className="ggo-guide-back" onClick={() => setStep(value => value - 1)}>Back</button>}
                        <button type="button" className="ggo-guide-next" onClick={() => lastStep ? onClose() : setStep(value => value + 1)}>
                            {lastStep ? 'Done' : 'Next'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export const useClient = () => useContext(Context);

// Use the local API while running Vite in development, even if a production
// VITE_API_BASE_URL is present in the environment. In production, use the
// configured API URL. Both values may be supplied with or without a trailing /api.
const normalizeApiBase = value => {
    const trimmed = String(value || '').trim().replace(/\/+$/, '');
    if (!trimmed) return 'http://localhost:5000/api';
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const configuredProductionApi = import.meta.env.VITE_API_BASE_URL || '';
const API = normalizeApiBase(import.meta.env.DEV
    ? (import.meta.env.VITE_LOCAL_API_BASE_URL || 'http://localhost:5000/api')
    : (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredProductionApi)
        ? 'https://iloilo-guimaras.onrender.com/api'
        : configuredProductionApi || 'https://iloilo-guimaras.onrender.com/api'));

const readJSON = (storage, key, fallback = null) => {
    try {
        return JSON.parse(storage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
};

const defaultUser = {
    id: 'sample-sarah',
    fullName: 'Sarah Fukiko',
    email: 'sarahfukiko@gmail.com',
    phoneNumber: '09123456789',
    age: 24,
    gender: 'Female',
    category: 'Student',
    notificationsEnabled: true
};

const testBuild =
    import.meta.env.VITE_TEST_APK === 'true'
        ? import.meta.env.VITE_TEST_BUILD
        : '';

const token = () =>
    sessionStorage.getItem('token') ||
    localStorage.getItem('token');
const hasPassengerSession = () => Boolean(token() || sessionStorage.getItem('ggo-cookie-session'));
const nativeClient = Capacitor.isNativePlatform();
const imageFields = ['profilePhoto', 'profilePicture', 'profileImage', 'discountIdPhoto', 'avatar', 'avatarUrl', 'photo', 'photoURL', 'imageUrl'];

export default function MobileApp({ preview = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const operations = useOperations(preview);

    const base = preview ? '/preview/client' : '';

    const path =
        location.pathname.slice(base.length).replace(/^\//, '') ||
        'dashboard';

    const [photoReturn, setPhotoReturn] = useState('book-trip');

    const confirmationReference =
        new URLSearchParams(location.search).get('reference');

    const publicPage = [
        'login',
        'register',
        'passenger-age',
        'passenger-gender',
        'reset-password',
        'reset-sent',
        'splash'
    ].includes(path) || (photoReturn === 'register' && ['id-photo', 'id-review'].includes(path));

    const navActive = {
        dashboard: 'dashboard',
        history: 'history',
        bookings: 'bookings',
        'boarding-pass': 'bookings',
        profile: 'profile'
    }[path];

    const [user, setUser] = useState(() =>
        preview
            ? operationsStore.getSnapshot().drafts['client-profile'] ||
              defaultUser
            : readJSON(
                  sessionStorage,
                  'user',
                  readJSON(localStorage, 'user', {})
              )
    );

    const [draftState, setDraftState] = useState(() =>
        preview
            ? operationsStore.getSnapshot().drafts['client-booking'] || null
            : readJSON(
                  sessionStorage,
                  `ggo-draft:${user.id || user._id}`
              )
    );

    const [bookings, setBookings] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [discountRequests, setDiscountRequests] = useState([]);
    const [serverNotifications, setServerNotifications] = useState([]);

    const [date, setDate] = useState(todayInManila);
    const [vessel, setVessel] = useState('MV Halili');
    const [reverse, setReverse] = useState(false);

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const guideUserKey = user.id || user._id || user.email?.toLowerCase();

    useEffect(() => {
        if (path !== 'dashboard' || !guideUserKey) return;

        const seenKey = `ggo-passenger-guide-seen:${guideUserKey}`;
        if (localStorage.getItem(seenKey) !== 'true') {
            setGuideOpen(true);
        }
    }, [path, guideUserKey]);

    const [photo, setPhoto] = useState(null);
    const [photoPerson, setPhotoPerson] = useState(null);
    const [registration, setRegistration] = useState(() => ({
        id: createId(),
        fullName: '',
        age: '',
        gender: '',
        category: 'Regular',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        idPhoto: ''
    }));

    const [dark, setDark] = useState(
        () => localStorage.getItem('ggo-dark') === 'true'
    );

    const [language, setLanguage] = useState(
        () => localStorage.getItem('ggo-language') || 'English'
    );

    const [read, setRead] = useState(() =>
        preview
            ? operationsStore.getSnapshot().drafts['client-read'] || []
            : readJSON(
                  localStorage,
                  `ggo-read:${user.id || user._id}`,
                  []
              )
    );

    const href = page => `${base}/${page}`;
    const go = page => navigate(href(page));

    const setDraft = value => {
        setDraftState(value);

        if (preview) {
            operationsStore.saveDraft('client-booking', value);
        } else if (user.id || user._id) {
            const key = `ggo-draft:${user.id || user._id}`;

            if (value) {
                sessionStorage.setItem(key, JSON.stringify(value));
            } else {
                sessionStorage.removeItem(key);
            }
        }
    };

    const saveUser = (value, authToken) => {
        const accountChanged =
            (value.id || value._id) !== (user.id || user._id);

        setUser(value);

        if (accountChanged) {
            setBookings([]);
            setDraftState(null);
            setPhoto(null);
            setPhotoPerson(null);

            setRead(
                preview
                    ? []
                    : readJSON(
                          localStorage,
                          `ggo-read:${value.id || value._id}`,
                          []
                      )
            );
        }

        if (preview) {
            operationsStore.saveDraft('client-profile', value);
        } else {
            const storage = sessionStorage.getItem('token')
                ? sessionStorage
                : localStorage;

            // Photos are already stored on the account. Keep them in React
            // state, but omit their large base64 payloads from browser storage
            // so a profile photo cannot exhaust the device's storage quota.
            const storedUser = { ...value };
            imageFields.forEach(field => delete storedUser[field]);
            const legacyPhotoKey = value.email
                ? `guimarasgo_profile_image_${value.email}`
                : '';
            if (legacyPhotoKey) {
                localStorage.removeItem(legacyPhotoKey);
                sessionStorage.removeItem(legacyPhotoKey);
            }
            storage.setItem('user', JSON.stringify(storedUser));

            if (authToken) {
                storage.setItem('token', authToken);
            }

            localStorage.setItem(
                `ggo-person:${value.id || value._id}`,
                JSON.stringify({
                    age: value.age,
                    gender: value.gender,
                    category: value.category
                })
            );
        }

        if (draftState && !accountChanged) {
            setDraft({
                ...draftState,
                people: [
                    accountPerson(value),
                    ...draftState.people.slice(1)
                ],
                regularFare: false
            });
        }
    };

    const request = async (
        endpoint,
        { body, method = 'GET', signal } = {}
    ) => {
        const response = await fetch(`${API}${endpoint}`, {
            method,
            signal,
            headers: {
                ...(body instanceof FormData
                    ? {}
                    : { 'Content-Type': 'application/json' }),
                ...(token()
                    ? { Authorization: `Bearer ${token()}` }
                    : {}),
                ...(nativeClient ? { 'X-Client-Platform': 'native' } : {})
            },
            credentials: 'include',
            ...(body
                ? {
                      body:
                          body instanceof FormData
                              ? body
                              : JSON.stringify(body)
                  }
                : {})
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message ||
                    `Unable to complete the request (${response.status}).`
            );
        }

        return data;
    };

    const run = async action => {
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await action();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        setError('');
        document
            .querySelector('.ggo-mobile-scroll')
            ?.scrollTo(0, 0);
    }, [path]);

    useEffect(() => {
        if (
            !preview ||
            operationsStore
                .getSnapshot()
                .bookings.some(b => b._id === 'client-paid')
        ) {
            return;
        }

        sampleClientBookings().forEach(b =>
            operationsStore.addBooking(b)
        );
    }, [preview]);

    useEffect(() => {
        if (preview || !hasPassengerSession() || publicPage) return;

        const controller = new AbortController();

        request('/auth/me', { signal: controller.signal })
            .then(data => {
                const value = data.user || data;

                const personal = readJSON(
                    localStorage,
                    `ggo-person:${value.id || value._id}`,
                    {}
                );

                // Keep the authenticated server copy (including the saved photo)
                // in both React state and browser storage after refresh.
                // The saved server profile is authoritative; device values only
                // fill fields that older accounts have not stored yet.
                saveUser({ ...personal, ...value });
            })
            .catch(e => {
                if (e.name !== 'AbortError') {
                    setError(e.message);
                }
            });

        return () => controller.abort();
    }, [preview, publicPage]);

    /*
     * Load passenger bookings and schedules.
     * Supports common API response formats:
     * - Array directly
     * - { bookings: [...] }
     * - { schedules: [...] }
     * - { capacities: [...] }
     * - { data: [...] }
     * - { data: { schedules: [...] } }
     */
    useEffect(() => {
        if (preview || publicPage || !hasPassengerSession()) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const shouldShowLoading = schedules.length === 0 && bookings.length === 0;
        setLoading(shouldShowLoading);
        const loadingTimer = shouldShowLoading
            ? window.setTimeout(() => {
                  setLoading(false);
                  setError(current => current || 'The ferry service is taking longer than usual to respond. You can keep using the app; crossing details will update when the connection is ready.');
              }, 10000)
            : null;

        const loadPassengerData = async () => {
            const bookingTask = request('/bookings/my', {
                signal: controller.signal
            }).then(bookingResponse => {
                if (controller.signal.aborted) return;
                const bookingData = Array.isArray(bookingResponse)
                    ? bookingResponse
                    : Array.isArray(bookingResponse.bookings)
                        ? bookingResponse.bookings
                        : Array.isArray(bookingResponse.data)
                            ? bookingResponse.data
                            : Array.isArray(bookingResponse.data?.bookings)
                                ? bookingResponse.data.bookings
                                : [];
                setBookings(bookingData.map(booking => {
                    const vesselName = canonicalVesselName(booking.vesselName || booking.ferryName);
                    return { ...booking, vesselName, ferryName: vesselName };
                }));
            });

            const scheduleTask = request(
                `/bookings/schedules/available?date=${encodeURIComponent(date)}`,
                { signal: controller.signal }
            ).then(scheduleResponse => {
                if (controller.signal.aborted) return;
                const scheduleData = Array.isArray(scheduleResponse)
                    ? scheduleResponse
                    : Array.isArray(scheduleResponse.schedules)
                        ? scheduleResponse.schedules
                        : Array.isArray(scheduleResponse.capacities)
                            ? scheduleResponse.capacities
                            : Array.isArray(scheduleResponse.data)
                                ? scheduleResponse.data
                                : Array.isArray(scheduleResponse.data?.schedules)
                                    ? scheduleResponse.data.schedules
                                    : Array.isArray(scheduleResponse.data?.capacities)
                                        ? scheduleResponse.data.capacities
                                        : [];
                const normalizedSchedules = scheduleData.map(normalizeSchedule);
                setSchedules(normalizedSchedules);
                setVessel(current => normalizedSchedules.some(item => item.vesselName === current)
                    ? current
                    : normalizedSchedules[0]?.vesselName || current);
                setLoading(false);
                if (loadingTimer) window.clearTimeout(loadingTimer);
                setError(current => current.startsWith('The ferry service is taking longer') ? '' : current);
            });

            const discountTask = request('/auth/discount-requests', { signal: controller.signal }).then(result => {
                if (controller.signal.aborted) return;
                setDiscountRequests((result.requests || []).map(item => {
                    const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
                    return { id: item._id, passenger, identity: passengerIdentity(passenger), photo: item.photo, status: item.status, reason: item.reason || '', source: item.source || '', requestId: item._id };
                }));
            });

            const results = await Promise.allSettled([bookingTask, scheduleTask, discountTask]);
            if (controller.signal.aborted) return;
            const failed = results.find(result => result.status === 'rejected');
            if (failed && failed.reason?.name !== 'AbortError') {
                setError(failed.reason?.message || 'Unable to refresh your crossings.');
            } else if (!failed) {
                setError('');
            }
            setLoading(false);
            if (loadingTimer) window.clearTimeout(loadingTimer);
        };

        loadPassengerData();

        return () => {
            if (loadingTimer) window.clearTimeout(loadingTimer);
            controller.abort();
        };
    }, [preview, date, publicPage, user.id, user._id]);

    useEffect(() => {
        if (preview || publicPage || !hasPassengerSession()) return;
        let active = true;
        const loadNotifications = async () => {
            try {
                const result = await request('/notifications');
                if (active) setServerNotifications((result.notifications || []).map(item => ({
                    id: String(item._id), bookingId: item.bookingId ? String(item.bookingId) : '',
                    bookingReference: item.bookingReference || '', type: item.type || 'booking_update',
                    title: item.title, detail: item.message, time: item.createdAt,
                    serverRead: Boolean(item.isRead), requestId: item.type === 'discount' ? item.bookingId : ''
                })));
            } catch {
                // Continue to show local booking status if notification loading is unavailable.
            }
        };
        loadNotifications();
        const timer = window.setInterval(loadNotifications, 20000);
        return () => { active = false; window.clearInterval(timer); };
    }, [preview, publicPage, user.id, user._id]);

    // A payment can be verified while the passenger app is already open.
    // Refresh the persisted ticket when its boarding pass is opened so the
    // queue number assigned by the server is not hidden by stale app state.
    useEffect(() => {
        const reference = new URLSearchParams(location.search).get('reference');
        if (preview || publicPage || !hasPassengerSession() || path !== 'boarding-pass' || !reference) return;

        const controller = new AbortController();
        let attempts = 0;
        let timer;
        const refreshTicket = async () => {
            try {
                const result = await request(`/bookings/reference/${encodeURIComponent(reference)}`, { signal: controller.signal });
                if (controller.signal.aborted || !result.booking) return;
                setBookings(current => current.map(booking => {
                    if (booking.bookingReference !== reference) return booking;
                    const latest = { ...booking, ...result.booking };
                    const vesselName = canonicalVesselName(latest.vesselName || latest.ferryName);
                    return { ...latest, vesselName, ferryName: vesselName };
                }));
                if (result.booking.queueNumber && timer) window.clearInterval(timer);
            } catch (refreshError) {
                if (refreshError.name !== 'AbortError') console.warn('Unable to refresh boarding pass details:', refreshError);
            }
        };

        refreshTicket();
        timer = window.setInterval(() => {
            attempts += 1;
            if (attempts >= 12) {
                window.clearInterval(timer);
                return;
            }
            refreshTicket();
        }, 5000);
        return () => {
            controller.abort();
            if (timer) window.clearInterval(timer);
        };
    }, [preview, publicPage, path, location.search]);

    useEffect(() => {
        if (preview || publicPage || !hasPassengerSession() || !['dashboard', 'schedule'].includes(path)) return;
        const refreshSchedules = async () => {
            try {
                const response = await request(`/bookings/schedules/available?date=${encodeURIComponent(date)}`);
                const rows = Array.isArray(response)
                    ? response
                    : response.schedules || response.capacities || response.data?.schedules || response.data?.capacities || [];
                if (Array.isArray(rows)) {
                    const normalizedSchedules = rows.map(normalizeSchedule);
                    setSchedules(normalizedSchedules);
                    setVessel(current => normalizedSchedules.some(item => item.vesselName === current)
                        ? current
                        : normalizedSchedules[0]?.vesselName || current);
                }
            } catch {
                // Keep the last good list visible if a background refresh is interrupted.
            }
        };
        const timer = setInterval(refreshSchedules, 30000);
        return () => clearInterval(timer);
    }, [preview, date, path, publicPage]);

    const ownBookings = preview
        ? operations.bookings.filter(b => b.userId === user.id)
        : bookings;

    const activeOperations = preview ? operations : { ...operations, requests: discountRequests };

    const events = preview
        ? clientEvents(
              operations.bookings,
              activeOperations.requests,
              operations.events,
              user.id
          )
        : [...serverNotifications, ...ownBookings.map(b => ({
              id: `${b._id}:${b.paymentStatus}`,
              bookingId: b._id,
              type: 'booking',
              title:
                  b.paymentStatus === 'VERIFIED'
                      ? 'Your ticket is ready'
                      : b.paymentStatus === 'REJECTED'
                          ? 'Payment needs attention'
                          : 'Payment verification underway',
              detail: `${b.origin} → ${b.destination} · ${b.bookingReference}`,
              time: b.updatedAt || b.createdAt
          }))].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    const markRead = ids => {
        const next = [...new Set([...read, ...ids])];

        setRead(next);

        if (preview) {
            operationsStore.saveDraft('client-read', next);
        } else {
            localStorage.setItem(
                `ggo-read:${user.id || user._id}`,
                JSON.stringify(next)
            );
            ids.filter(id => /^[a-f\d]{24}$/i.test(String(id))).forEach(id => {
                request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }).then(() => {
                    setServerNotifications(current => current.map(item => item.id === id ? { ...item, serverRead: true } : item));
                }).catch(() => {});
            });
        }
    };

    const refreshApp = async () => {
        if (preview || !hasPassengerSession()) return;
        setLoading(true);
        setError('');
        const tasks = await Promise.allSettled([
            request('/auth/me'),
            request('/bookings/my'),
            request(`/bookings/schedules/available?date=${encodeURIComponent(date)}`),
            request('/auth/discount-requests'),
            request('/notifications')
        ]);
        const [profile, bookingsResult, schedulesResult, discountsResult, notificationsResult] = tasks;
        if (profile.status === 'fulfilled') {
            const value = profile.value.user || profile.value;
            const personal = readJSON(localStorage, `ggo-person:${value.id || value._id}`, {});
            saveUser({ ...personal, ...value });
        }
        if (bookingsResult.status === 'fulfilled') {
            const value = bookingsResult.value;
            const rows = Array.isArray(value) ? value : value.bookings || value.data?.bookings || [];
            setBookings(rows.map(booking => {
                const vesselName = canonicalVesselName(booking.vesselName || booking.ferryName);
                return { ...booking, vesselName, ferryName: vesselName };
            }));
        }
        if (schedulesResult.status === 'fulfilled') {
            const value = schedulesResult.value;
            const rows = Array.isArray(value) ? value : value.schedules || value.capacities || value.data?.schedules || value.data?.capacities || [];
            const normalized = rows.map(normalizeSchedule);
            setSchedules(normalized);
            setVessel(current => normalized.some(item => item.vesselName === current) ? current : normalized[0]?.vesselName || current);
        }
        if (discountsResult.status === 'fulfilled') {
            setDiscountRequests((discountsResult.value.requests || []).map(item => {
                const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
                return { id: item._id, passenger, identity: passengerIdentity(passenger), photo: item.photo, status: item.status, reason: item.reason || '', source: item.source || '', requestId: item._id };
            }));
        }
        if (notificationsResult.status === 'fulfilled') {
            setServerNotifications((notificationsResult.value.notifications || []).map(item => ({
                id: String(item._id), bookingId: item.bookingId ? String(item.bookingId) : '', bookingReference: item.bookingReference || '',
                type: item.type || 'booking_update', title: item.title, detail: item.message, time: item.createdAt,
                serverRead: Boolean(item.isRead), requestId: item.type === 'discount' ? item.bookingId : ''
            })));
        }
        const failed = tasks.find(task => task.status === 'rejected');
        setError(failed?.reason?.message || '');
        setLoading(false);
    };

    const logout = () => {
        if (!preview) {
            request('/auth/logout', { method: 'POST' }).catch(() => {});
            for (const storage of [localStorage, sessionStorage]) {
                storage.removeItem('token');
                storage.removeItem('user');
            }
            sessionStorage.removeItem('ggo-cookie-session');

            setUser({});
            setBookings([]);
            setSchedules([]);
            setDraftState(null);
            setRead([]);
            setPhoto(null);
            setPhotoPerson(null);
        }

        go('login');
    };

    const closeGuide = () => {
        if (guideUserKey) {
            localStorage.setItem(
                `ggo-passenger-guide-seen:${guideUserKey}`,
                'true'
            );
        }
        setGuideOpen(false);
    };

    const reset = () => {
        operationsStore.reset();

        sampleClientBookings().forEach(b =>
            operationsStore.addBooking(b)
        );

        setUser(defaultUser);
        setDraftState(null);
        setRead([]);
        setPhoto(null);
        setError('');
        go('dashboard');
    };

    const context = {
        preview,
        base,
        path,
        user,
        saveUser,
        draft: draftState,
        setDraft,
        bookings: ownBookings,
        setBookings,
        schedules: preview
            ? previewSchedules(date, operations.bookings)
            : schedules,
        date,
        setDate,
        vessel,
        setVessel,
        reverse,
        setReverse,
        href,
        go,
        operations: activeOperations,
        setDiscountRequests,
        request,
        run,
        error,
        setError,
        busy,
        loading,
        refreshApp,
        photo,
        setPhoto,
        photoPerson,
        setPhotoPerson,
        photoReturn,
        setPhotoReturn,
        registration,
        setRegistration,
        dark,
        setDark: value => {
            setDark(value);
            localStorage.setItem('ggo-dark', String(value));
        },
        language,
        setLanguage: value => {
            setLanguage(value);
            localStorage.setItem('ggo-language', value);
        },
        events,
        read,
        markRead,
        logout,
        openGuide: () => setGuideOpen(true)
    };

    if (!preview && !publicPage && !hasPassengerSession()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Context.Provider value={context}>
            <div className="ggo-client-root">
                {preview && (
                    <aside
                        className="ggo-preview-bar"
                        aria-label="Client design preview"
                    >
                        <strong>
                            {testBuild
                                ? `GuimarasGo Test · Build ${testBuild}`
                                : 'Client frontend preview'}
                        </strong>

                        <span>Sample data · No real payments</span>

                        <nav>
                            <Link to="/preview/staff/discounts">
                                Staff review
                            </Link>
                            <Link to="/preview/admin/overview">
                                Admin
                            </Link>
                            <Link to={href('splash')}>
                                Replay splash
                            </Link>
                            <Link to={href('login')}>Login</Link>
                            <button onClick={reset}>Reset</button>
                        </nav>
                    </aside>
                )}

                {preview &&
                    path === 'confirmation' &&
                    ownBookings.some(
                        b => b.bookingReference === confirmationReference
                    ) && (
                        <aside
                            className="ggo-preview-controls"
                            aria-label="Simulate payment outcome"
                        >
                            <span>Preview payment outcome:</span>

                            {['Paid', 'Processing', 'Failed'].map(
                                outcome => (
                                    <button
                                        key={outcome}
                                        onClick={() => {
                                            const b = ownBookings.find(
                                                item =>
                                                    item.bookingReference ===
                                                    confirmationReference
                                            );

                                            if (!b) return;

                                            operationsStore.updateBooking(
                                                b._id,
                                                {
                                                    paymentStatus:
                                                        outcome === 'Paid'
                                                            ? 'VERIFIED'
                                                            : outcome === 'Failed'
                                                                ? 'REJECTED'
                                                                : 'PENDING VERIFICATION',
                                                    status:
                                                        outcome === 'Paid'
                                                            ? 'CONFIRMED'
                                                            : outcome === 'Failed'
                                                                ? 'REJECTED'
                                                                : 'PENDING PAYMENT VERIFICATION',
                                                    totalPaid:
                                                        outcome === 'Paid'
                                                            ? b.requiredAmount
                                                            : null,
                                                    ...(outcome === 'Paid'
                                                        ? {
                                                              paidAt: new Date().toISOString()
                                                          }
                                                        : {})
                                                }
                                            );
                                        }}
                                    >
                                        {outcome}
                                    </button>
                                )
                            )}
                        </aside>
                    )}

                <div
                    className={`ggo-mobile-stage ${
                        dark ? 'ggo-dark' : ''
                    }`}
                >
                    <div
                        className={`ggo-mobile-app ${
                            preview ? 'ggo-is-preview' : ''
                        }`}
                    >
                        <div
                            className="ggo-mobile-scroll"
                            key={path}
                        >
                            {error && (
                                <div className={`ggo-error ${path === 'schedule' ? 'ggo-error-centered' : ''}`} role="alert">
                                    {error}
                                    <button
                                        aria-label="Dismiss error"
                                        onClick={() => setError('')}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {loading && !publicPage && (
                                <div
                                    className="ggo-loading-overlay"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <div className="ggo-loading-dialog">
                                        <span className="ggo-loading-spinner" />
                                        <p>Loading your crossings...</p>
                                    </div>
                                </div>
                            )}

                            <Outlet />
                        </div>

                        {guideOpen && <PassengerGuide onClose={closeGuide} />}

                        {navActive && (
                            <BottomNav
                                active={navActive}
                                href={href}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Context.Provider>
    );
}
