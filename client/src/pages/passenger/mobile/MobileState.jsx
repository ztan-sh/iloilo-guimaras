
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { operationsStore } from '../../../components/operations/operationsStore';
import { useOperations } from '../../../components/operations/useOperations';
import {
    accountPerson,
    clientEvents,
    previewSchedules,
    sampleClientBookings,
    todayInManila
} from './mobileUtils';
import { createId } from '../../../utils/createId.js';
import { BottomNav } from './MobileNav';
import './Mobile.css';

const Context = createContext(null);

export const useClient = () => useContext(Context);

// Use the local API while running Vite in development, even if a production
// VITE_API_BASE_URL is present in the environment. In production, use the
// configured API URL. Both values may be supplied with or without a trailing /api.
const normalizeApiBase = value => {
    const trimmed = String(value || '').trim().replace(/\/+$/, '');
    if (!trimmed) return 'http://localhost:5000/api';
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const API = normalizeApiBase(
    import.meta.env.DEV
        ? (import.meta.env.VITE_LOCAL_API_BASE_URL || 'http://localhost:5000/api')
        : (import.meta.env.VITE_API_BASE_URL || 'https://iloilo-guimaras.onrender.com/api')
);

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

export default function MobileApp({ preview = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const operations = useOperations(preview);

    const base = preview ? '/preview/client' : '';

    const path =
        location.pathname.slice(base.length).replace(/^\//, '') ||
        'dashboard';

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
    ].includes(path);

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

    const [date, setDate] = useState(todayInManila);
    const [vessel, setVessel] = useState('MV Halili');
    const [reverse, setReverse] = useState(false);

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);

    const [photo, setPhoto] = useState(null);
    const [photoPerson, setPhotoPerson] = useState(null);
    const [photoReturn, setPhotoReturn] = useState('book-trip');

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

            storage.setItem('user', JSON.stringify(value));

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
                    : {})
            },
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
        if (preview || !token() || publicPage) return;

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
                saveUser({ ...value, ...personal });
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
        if (preview || publicPage || !token()) return;

        const controller = new AbortController();

        setLoading(true);

        const loadPassengerData = async () => {
            try {
                const [bookingResponse, scheduleResponse] =
                    await Promise.all([
                        request('/bookings/my', {
                            signal: controller.signal
                        }),
                        request(
                            `/bookings/schedules/available?date=${encodeURIComponent(date)}`,
                            { signal: controller.signal }
                        )
                    ]);

                if (controller.signal.aborted) return;

                const bookingData = Array.isArray(bookingResponse)
                    ? bookingResponse
                    : Array.isArray(bookingResponse.bookings)
                        ? bookingResponse.bookings
                        : Array.isArray(bookingResponse.data)
                            ? bookingResponse.data
                            : Array.isArray(
                                  bookingResponse.data?.bookings
                              )
                                ? bookingResponse.data.bookings
                                : [];

                const scheduleData = Array.isArray(scheduleResponse)
                    ? scheduleResponse
                    : Array.isArray(scheduleResponse.schedules)
                        ? scheduleResponse.schedules
                        : Array.isArray(scheduleResponse.capacities)
                            ? scheduleResponse.capacities
                            : Array.isArray(scheduleResponse.data)
                                ? scheduleResponse.data
                                : Array.isArray(
                                      scheduleResponse.data?.schedules
                                  )
                                    ? scheduleResponse.data.schedules
                                    : Array.isArray(
                                          scheduleResponse.data?.capacities
                                      )
                                        ? scheduleResponse.data.capacities
                                        : [];

                setBookings(bookingData);
                setSchedules(scheduleData);
            } catch (e) {
                if (
                    !controller.signal.aborted &&
                    e.name !== 'AbortError'
                ) {
                    setError(e.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadPassengerData();

        return () => controller.abort();
    }, [preview, date, path, publicPage]);

    useEffect(() => {
        if (preview || publicPage || !token() || !['dashboard', 'schedule'].includes(path)) return;
        const refreshSchedules = async () => {
            try {
                const response = await request(`/bookings/schedules/available?date=${encodeURIComponent(date)}`);
                const rows = Array.isArray(response)
                    ? response
                    : response.schedules || response.capacities || response.data?.schedules || response.data?.capacities || [];
                if (Array.isArray(rows)) setSchedules(rows);
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

    const events = preview
        ? clientEvents(
              operations.bookings,
              operations.requests,
              operations.events,
              user.id
          )
        : ownBookings.map(b => ({
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
          }));

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
        }
    };

    const logout = () => {
        if (!preview) {
            for (const storage of [localStorage, sessionStorage]) {
                storage.removeItem('token');
                storage.removeItem('user');
            }

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
        operations,
        request,
        run,
        error,
        setError,
        busy,
        loading,
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
        logout
    };

    if (!preview && !publicPage && !token()) {
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
                                <div className="ggo-error" role="alert">
                                    {error}
                                    <button
                                        aria-label="Dismiss error"
                                        onClick={() => setError('')}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {loading && (
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
