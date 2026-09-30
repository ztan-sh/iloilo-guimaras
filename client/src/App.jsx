import React from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import Trips from "./pages/Trips";

import Dashboard from "./pages/passenger/Dashboard";
import BookTrip from "./pages/passenger/BookTrip";
import Payment from "./pages/passenger/Payment";
import MayaPayment from "./pages/passenger/MayaPayment";
import Confirmation from "./pages/passenger/confirmation";

import Bookings from "./pages/Bookings";
import Profile from "./pages/passenger/Profile";
import Login from "./pages/passenger/Login";
import Register from "./pages/passenger/Register";

import LandingPage from "./pages/public/LandingPage";
import GetApp from "./pages/public/GetApp";

import AdminRegister from "./pages/Admin/AdminRegister";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import StaffLogin from "./pages/Staff/StaffLogin";
import StaffScanner from "./pages/Staff/StaffScanner";

function App() {
    // Capacitor returns true when the application is running
    // inside the installed Android/iOS native shell.
    //
    // Normal browser/Vercel visitors remain on the public
    // GuimarasGo landing page.
    const isNativeApp = Capacitor.isNativePlatform();

    return (
        <Routes>

            {/* =========================================
                PUBLIC LANDING PAGE
            ========================================= */}
            <Route
                path="/"
                element={
                    isNativeApp
                        ? <Navigate to="/login" replace />
                        : <LandingPage />
                }
            />

            {/* GET THE APP */}
            <Route
                path="/get-app"
                element={<GetApp />}
            />

            {/* =========================================
                PASSENGER / TOURIST
            ========================================= */}

            {/* LOGIN */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* REGISTER */}
            <Route
                path="/register"
                element={<Register />}
            />

            {/* DASHBOARD */}
            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            {/* PROFILE */}
            <Route
                path="/profile"
                element={<Profile />}
            />

            {/* BOOKINGS */}
            <Route
                path="/bookings"
                element={<Bookings />}
            />

            {/* BOOK TRIP */}
            <Route
                path="/book-trip"
                element={<BookTrip />}
            />

            {/* PAYMENT */}
            <Route
                path="/payment"
                element={<Payment />}
            />

            {/* MAYA PAYMENT */}
            <Route
                path="/maya-payment"
                element={<MayaPayment />}
            />

            {/* CONFIRMATION */}
            <Route
                path="/confirmation"
                element={<Confirmation />}
            />

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

            {/* ADMIN DASHBOARD */}
            <Route
                path="/admin-dashboard"
                element={<AdminDashboard />}
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
                path="/staff/scanner"
                element={<StaffScanner />}
            />

        </Routes>
    );
}

export default App;