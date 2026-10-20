import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Trips from "./pages/Trips";

import MobileApp from "./pages/passenger/mobile/MobileState";
import { ClientLogin, ClientRegister, ClientReset } from "./pages/passenger/mobile/MobileAuth";
import { ClientDashboard, ClientSchedule, ClientBook, ClientPayment, ClientID } from "./pages/passenger/mobile/MobileBooking";
import { ClientHistory, ClientConfirmation, ClientPass, ClientProfile, ClientEditProfile, ClientLanguage, ClientNotifications, ClientAge, ClientGender } from "./pages/passenger/mobile/MobileAccount";
import ClientSplash from "./pages/passenger/mobile/MobileSplash";

import LandingPage from "./pages/public/LandingPage";
import GetApp from "./pages/public/GetApp";

import AdminRegister from "./pages/Admin/AdminRegister";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminWorkspace from "./pages/Admin/AdminWorkspace";
import AdminPreview from "./pages/Admin/AdminPreview";

import StaffLogin from "./pages/Staff/StaffLogin";
import StaffWorkspace from "./pages/Staff/StaffWorkspace";
import StaffPreview from "./pages/Staff/StaffPreview";

const testingAPK = import.meta.env.VITE_TEST_APK === "true";
const previewHost = import.meta.env.DEV || testingAPK
    || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
const localPreview = import.meta.env.VITE_STAFF_PREVIEW === "true" && previewHost;
const localAdminPreview = import.meta.env.VITE_ADMIN_PREVIEW === "true"
    && previewHost;
const localClientPreview = import.meta.env.VITE_CLIENT_PREVIEW === "true"
    && previewHost;
const mobilePages = {
login: <ClientLoginEntry />, register: <ClientRegister />, dashboard: <ClientDashboard />, schedule: <ClientSchedule />,
    'book-trip': <ClientBook />, payment: <ClientPayment />, 'maya-payment': <ClientPayment />, confirmation: <ClientConfirmation />,
    bookings: <ClientHistory tickets />, history: <ClientHistory />, 'boarding-pass': <ClientPass />, profile: <ClientProfile />,
    'edit-profile': <ClientEditProfile />, language: <ClientLanguage />, notifications: <ClientNotifications />,
    'reset-password': <ClientReset />, 'reset-sent': <ClientReset />, 'passenger-age': <ClientAge />, 'passenger-gender': <ClientGender />, splash: <ClientSplash />,
    'id-photo': <ClientID />, 'id-review': <ClientID />, 'id-required': <ClientID />, 'id-status': <ClientID />,
    'id-approved': <ClientID />, 'id-attention': <ClientID />
};

function ClientLoginEntry() {
    return <ClientLogin />;
}

function App() {
    return (
        <Routes>

            {/* =========================================
                PUBLIC LANDING PAGE
            ========================================= */}
            <Route
                path="/"
                element={testingAPK && localClientPreview ? <Navigate to="/preview/client/dashboard" replace /> : <LandingPage />}
            />

            {/* GET THE APP */}
            <Route
                path="/get-app"
                element={<GetApp />}
            />

            {/* =========================================
                PASSENGER / TOURIST
            ========================================= */}

            <Route element={<MobileApp />}>
                {Object.entries(mobilePages).map(([path, element]) => <Route key={path} path={`/${path}`} element={element} />)}
            </Route>
            {localClientPreview && <Route path="/preview/client" element={<MobileApp preview />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                {Object.entries(mobilePages).map(([path, element]) => <Route key={path} path={path} element={element} />)}
            </Route>}

            {/* TRIPS */}
            <Route
                path="/trips"
                element={<Trips />}
            />

            {/* =========================================
                ADMIN
            ========================================= */}

            {/* ADMIN REGISTER */}
            <Route
                path="/admin-register"
                element={<AdminRegister />}
            />

            {/* ADMIN LOGIN */}
            <Route
                path="/admin-login"
                element={<AdminLogin />}
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminWorkspace />} />
            {localAdminPreview && <Route path="/preview/admin" element={<AdminPreview />}>
                <Route path="login" element={<AdminLogin />} />
                <Route path="*" element={<AdminWorkspace />} />
            </Route>}

            {/* ADMIN DASHBOARD */}
            <Route
                path="/admin-dashboard"
                element={<Navigate to="/admin/overview" replace />}
            />

            {/* =========================================
                STAFF
            ========================================= */}

            {/* STAFF LOGIN */}
            <Route
                path="/staff/login"
                element={<StaffLogin />}
            />

            {/* STAFF QR SCANNER */}
            <Route
                path="/staff/*"
                element={<StaffWorkspace />}
            />

            {localPreview && <Route path="/preview/staff" element={<StaffPreview />}>
                <Route path="login" element={<StaffLogin />} />
                <Route path="*" element={<StaffWorkspace />} />
            </Route>}

        </Routes>
    );
}

export default App;
