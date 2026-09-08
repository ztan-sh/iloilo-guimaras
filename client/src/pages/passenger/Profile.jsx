import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const Profile = () => {
    const navigate = useNavigate();

    // =========================================================
    // USER INFORMATION
    // =========================================================

    const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
});

    // =========================================================
    // MODAL STATE
    // =========================================================

    const [activeModal, setActiveModal] = useState(null);

    // =========================================================
    // NOTIFICATION STATE
    // =========================================================

    const [notifications, setNotifications] = useState(false);

    // =========================================================
    // EDIT PROFILE FORM
    // =========================================================

    const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
});
// =========================================================
// LOAD LOGGED-IN USER
// =========================================================

useEffect(() => {

    try {

        const savedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!savedUser) {
            return;
        }

        const parsedUser =
            JSON.parse(savedUser);

        setUser({
            name:
                parsedUser.fullName || "",

            email:
                parsedUser.email || "",

            phone:
                parsedUser.phoneNumber || ""
        });

    } catch (error) {

        console.error(
            "Unable to load logged-in user:",
            error
        );

    }

}, []);

    // =========================================================
    // PAYMENT STATE
    // =========================================================

    const [paymentMethod, setPaymentMethod] = useState("GCash");

    // =========================================================
    // PASSWORD STATE
    // =========================================================

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // =========================================================
    // MESSAGE STATE
    // =========================================================

    const [modalMessage, setModalMessage] = useState("");

    // =========================================================
    // CHECK NOTIFICATION PERMISSION
    // =========================================================

    useEffect(() => {
        if ("Notification" in window) {
            if (Notification.permission === "granted") {
                setNotifications(true);
            } else {
                setNotifications(false);
            }
        }
    }, []);

    // =========================================================
    // CLOSE MODAL
    // =========================================================

    const closeModal = () => {
        setActiveModal(null);
        setModalMessage("");
    };

    // =========================================================
    // ESC KEY
    // =========================================================

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    // =========================================================
    // EDIT PROFILE
    // =========================================================

    const handleEditProfile = () => {
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone,
        });

        setActiveModal("edit");
    };

   const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (
        !editForm.name.trim() ||
        !editForm.email.trim() ||
        !editForm.phone.trim()
    ) {
        setModalMessage(
            "Please complete all profile information."
        );

        return;
    }

    try {

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) {
            setModalMessage(
                "Your session has expired. Please log in again."
            );

            return;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/auth/profile`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        fullName:
                            editForm.name.trim(),

                        email:
                            editForm.email.trim(),

                        phoneNumber:
                            editForm.phone.trim()
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            setModalMessage(
                data.message ||
                "Unable to update your profile."
            );

            return;
        }

        // =====================================
        // UPDATE REACT STATE
        // =====================================

        setUser({
            name:
                data.user.fullName,

            email:
                data.user.email,

            phone:
                data.user.phoneNumber
        });

        // =====================================
        // UPDATE SAVED USER
        // =====================================

        const updatedUser = {
            id:
                data.user.id,

            fullName:
                data.user.fullName,

            email:
                data.user.email,

            phoneNumber:
                data.user.phoneNumber
        };

        if (
            localStorage.getItem("token")
        ) {
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );
        }

        if (
            sessionStorage.getItem("token")
        ) {
            sessionStorage.setItem(
                "token",
                data.token
            );

            sessionStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );
        }

        // =====================================
        // SUCCESS
        // =====================================

        setActiveModal("success");

        setModalMessage(
            "Your profile information has been successfully updated in your account."
        );

    } catch (error) {

        console.error(
            "Profile Update Error:",
            error
        );

        setModalMessage(
            "Unable to connect to the server. Please check your internet connection and try again."
        );
    }
};

    // =========================================================
    // PAYMENT METHODS
    // =========================================================

    const handlePaymentMethods = () => {
        setActiveModal("payment");
    };

    const handleSavePayment = () => {
        setActiveModal("success");

        setModalMessage(
            `${paymentMethod} has been selected as your preferred payment method.`
        );
    };

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    const handleNotificationToggle = async () => {
        if (!("Notification" in window)) {
            setActiveModal("notificationUnavailable");

            setModalMessage(
                "Your current browser does not support web notifications."
            );

            return;
        }

        // TURN OFF
        if (notifications) {
            setNotifications(false);

            return;
        }

        // ALREADY ALLOWED
        if (Notification.permission === "granted") {
            setNotifications(true);

            setActiveModal("notificationEnabled");

            setModalMessage(
                "Notifications are already allowed on this device."
            );

            return;
        }

        // BLOCKED
        if (Notification.permission === "denied") {
            setActiveModal("notificationBlocked");

            setModalMessage(
                "Notifications are currently blocked. Please allow notifications from your browser or device settings."
            );

            return;
        }

        // REQUEST DEVICE / BROWSER PERMISSION
        try {
            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {
                setNotifications(true);

                setActiveModal("notificationEnabled");

                setModalMessage(
                    "Notifications have been successfully enabled."
                );

                // Optional test notification
                new Notification("GuimarasGo", {
                    body:
                        "Notifications are now enabled. You can receive booking updates and alerts.",
                });
            } else {
                setNotifications(false);

                setActiveModal("notificationDenied");

                setModalMessage(
                    "Notifications were not enabled. You can change this later in your browser or device settings."
                );
            }
        } catch (error) {
            console.error(
                "Notification permission error:",
                error
            );

            setNotifications(false);

            setActiveModal("notificationUnavailable");

            setModalMessage(
                "We could not request notification permission from this device."
            );
        }
    };

    // =========================================================
    // SETTINGS
    // =========================================================

    const handleSettings = () => {
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setActiveModal("settings");
    };

    const handleChangePassword = async (event) => {
    event.preventDefault();

    if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
    ) {
        setModalMessage(
            "Please complete all password fields."
        );

        return;
    }

    if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
    ) {
        setModalMessage(
            "The new password and confirmation password do not match."
        );

        return;
    }

    if (
        passwordForm.newPassword.length < 8
    ) {
        setModalMessage(
            "Your new password must contain at least 8 characters."
        );

        return;
    }

    try {

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) {

            setModalMessage(
                "Your session has expired. Please log in again."
            );

            return;
        }

        // =====================================
        // SEND PASSWORD CHANGE TO BACKEND
        // =====================================

        const response =
            await fetch(
                `${API_BASE_URL}/auth/password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        currentPassword:
                            passwordForm.currentPassword,

                        newPassword:
                            passwordForm.newPassword
                    })
                }
            );

        const data =
            await response.json();

        // =====================================
        // BACKEND ERROR
        // =====================================

        if (!response.ok) {

            setModalMessage(
                data.message ||
                "Unable to update your password."
            );

            return;
        }

        // =====================================
        // SUCCESS
        // =====================================

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });

        setActiveModal("success");

        setModalMessage(
            "Your password has been successfully updated. Your old password can no longer be used."
        );

    } catch (error) {

        console.error(
            "Password Update Error:",
            error
        );

        setModalMessage(
            "Unable to connect to the server. Please check your internet connection and try again."
        );
    }
};

    // =========================================================
    // HELP & SUPPORT
    // =========================================================

    const handleHelpSupport = () => {
        setActiveModal("help");
    };

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {
        setActiveModal("logout");
    };

    const confirmLogout = () => {

    // =====================================
    // CLEAR SESSION STORAGE
    // =====================================

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("currentUser");

    // =====================================
    // CLEAR LOCAL STORAGE
    // =====================================

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");

    // =====================================
    // GO BACK TO LANDING PAGE
    // =====================================

    navigate("/");
};

    // =========================================================
    // MODAL BACKDROP CLICK
    // =========================================================

    const handleBackdropClick = (event) => {
        if (
            event.target === event.currentTarget
        ) {
            closeModal();
        }
    };

    return (
        <>
            <style>{`

/* =========================================================
   GUIMARASGO PROFILE UI
   UI ONLY — DO NOT CHANGE FUNCTIONALITY
========================================================= */

@import url(
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
);


/* =========================================================
   GLOBAL
========================================================= */

* {
    box-sizing: border-box;
}

html,
body,
#root {
    margin: 0;
    padding: 0;

    width: 100%;
    min-height: 100%;
}

body {
    font-family:
        "Poppins",
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Arial,
        sans-serif;

    background:
        #fff7ef;

    color:
        #171717;
}

button,
input,
select,
textarea {
    font-family: inherit;
}


/* =========================================================
   PAGE
========================================================= */

.profile-page {
    min-height: 100vh;
    min-height: 100dvh;

    display: flex;
    justify-content: center;

    padding: 18px;

    background:
        linear-gradient(
            135deg,
            #fffaf5 0%,
            #fff1e3 48%,
            #ffe5cc 100%
        );
}


/* =========================================================
   MAIN CONTAINER
========================================================= */

.profile-container {
    width: 100%;
    max-width: 900px;

    min-height:
        calc(100vh - 36px);

    min-height:
        calc(100dvh - 36px);

    position: relative;

    overflow: hidden;

    background:
        #fffaf6;

    border:
        1px solid
        rgba(255, 120, 24, 0.12);

    border-radius:
        24px;

    box-shadow:
        0 18px 55px
        rgba(80, 45, 20, 0.12);
}


/* =========================================================
   HEADER
========================================================= */

.profile-header {
    height: 78px;

    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;

    background:
        rgba(255, 255, 255, 0.92);

    border-bottom:
        1px solid
        rgba(255, 120, 24, 0.12);

    backdrop-filter:
        blur(12px);

    -webkit-backdrop-filter:
        blur(12px);
}

.profile-header h1 {
    margin: 0;

    color:
        #151515;

    font-size:
        20px;

    font-weight:
        700;

    letter-spacing:
        -0.3px;
}


/* =========================================================
   BACK BUTTON
========================================================= */

.profile-back-button {
    position: absolute;

    left: 20px;

    width: 40px;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: none;

    border-radius:
        12px;

    background:
        #fff4e9;

    color:
        #171717;

    font-size:
        20px;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.profile-back-button:hover {
    background:
        #ffe5d0;

    color:
        #ff7417;

    transform:
        translateX(-2px);
}

.profile-back-button:active {
    transform:
        translateX(0)
        scale(0.96);
}


/* =========================================================
   CONTENT
========================================================= */

.profile-content {
    width: 100%;
    max-width: 590px;

    margin:
        0 auto;

    padding:
        30px 24px 42px;
}


/* =========================================================
   USER CARD
========================================================= */

.profile-user-card {
    width: 100%;

    padding:
        24px;

    margin-bottom:
        22px;

    background:
        #ffffff;

    border:
        1px solid
        rgba(255, 120, 24, 0.10);

    border-radius:
        18px;

    box-shadow:
        0 8px 25px
        rgba(71, 42, 20, 0.07);
}


/* =========================================================
   USER INFO
========================================================= */

.profile-user-info {
    display:
        flex;

    align-items:
        center;

    gap:
        16px;

    margin-bottom:
        20px;
}


/* =========================================================
   PROFILE AVATAR
========================================================= */

.profile-avatar {
    width:
        66px;

    height:
        66px;

    flex-shrink:
        0;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        50%;

    background:
        linear-gradient(
            135deg,
            #fff0e1,
            #ffe0c2
        );

    border:
        3px solid
        #ffffff;

    box-shadow:
        0 5px 16px
        rgba(255, 116, 23, 0.16);

    font-size:
        39px;

    overflow:
        hidden;
}

.profile-avatar img {
    width:
        100%;

    height:
        100%;

    object-fit:
        cover;
}


/* =========================================================
   USER DETAILS
========================================================= */

.profile-user-details {
    min-width:
        0;

    flex:
        1;
}

.profile-user-details h2 {
    margin:
        0 0 5px;

    color:
        #161616;

    font-size:
        17px;

    font-weight:
        700;

    line-height:
        1.25;
}

.profile-user-details p {
    margin:
        2px 0;

    color:
        #8a8a8a;

    font-size:
        11px;

    font-weight:
        400;

    line-height:
        1.5;

    overflow:
        hidden;

    text-overflow:
        ellipsis;

    white-space:
        nowrap;
}


/* =========================================================
   EDIT PROFILE BUTTON
========================================================= */

.edit-profile-button {
    width:
        100%;

    height:
        46px;

    border:
        none;

    border-radius:
        11px;

    background:
        linear-gradient(
            135deg,
            #ff841f,
            #ff7014
        );

    color:
        #ffffff;

    font-size:
        13px;

    font-weight:
        700;

    cursor:
        pointer;

    box-shadow:
        0 6px 18px
        rgba(255, 116, 23, 0.22);

    transition:
        all 0.2s ease;
}

.edit-profile-button:hover {
    transform:
        translateY(-2px);

    box-shadow:
        0 9px 22px
        rgba(255, 116, 23, 0.30);
}

.edit-profile-button:active {
    transform:
        translateY(0)
        scale(0.99);
}


/* =========================================================
   MENU
========================================================= */

.profile-menu {
    width:
        100%;

    display:
        flex;

    flex-direction:
        column;

    gap:
        10px;

    margin-bottom:
        18px;
}


/* =========================================================
   MENU ITEM
========================================================= */

.profile-menu-item {
    width:
        100%;

    min-height:
        70px;

    padding:
        12px 15px;

    display:
        flex;

    align-items:
        center;

    gap:
        13px;

    text-align:
        left;

    background:
        #ffffff;

    border:
        1px solid
        rgba(255, 120, 24, 0.12);

    border-radius:
        15px;

    color:
        #171717;

    cursor:
        pointer;

    transition:
        transform 0.2s ease,
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.profile-menu-item:hover {
    transform:
        translateY(-1px);

    background:
        #fffaf5;

    border-color:
        rgba(255, 120, 24, 0.30);

    box-shadow:
        0 6px 18px
        rgba(71, 42, 20, 0.06);
}

.profile-menu-item:active {
    transform:
        translateY(0)
        scale(0.995);
}


/* =========================================================
   MENU ICON
========================================================= */

.profile-menu-icon {
    width:
        42px;

    height:
        42px;

    flex-shrink:
        0;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        12px;

    background:
        #fff1e4;

    font-size:
        19px;

    color:
        #ff7417;
}


/* =========================================================
   MENU TEXT
========================================================= */

.profile-menu-text {
    min-width:
        0;

    flex:
        1;

    display:
        flex;

    flex-direction:
        column;

    gap:
        2px;
}

.profile-menu-text strong {
    color:
        #171717;

    font-size:
        13px;

    font-weight:
        600;

    line-height:
        1.3;
}

.profile-menu-text span {
    color:
        #999999;

    font-size:
        10px;

    font-weight:
        400;

    line-height:
        1.4;
}


/* =========================================================
   ARROW
========================================================= */

.profile-arrow {
    flex-shrink:
        0;

    color:
        #b0b0b0;

    font-size:
        22px;

    font-weight:
        400;

    transition:
        all 0.2s ease;
}

.profile-menu-item:hover .profile-arrow {
    color:
        #ff7417;

    transform:
        translateX(2px);
}


/* =========================================================
   NOTIFICATION TOGGLE
========================================================= */

.notification-toggle {
    position:
        relative;

    width:
        46px;

    height:
        26px;

    flex-shrink:
        0;

    padding:
        3px;

    border:
        none;

    border-radius:
        30px;

    background:
        #d5d5d5;

    cursor:
        pointer;

    transition:
        background 0.25s ease,
        box-shadow 0.25s ease;
}

.notification-toggle.active {
    background:
        #ff7417;

    box-shadow:
        0 3px 10px
        rgba(255, 116, 23, 0.25);
}

.notification-knob {
    position:
        absolute;

    top:
        3px;

    left:
        3px;

    width:
        20px;

    height:
        20px;

    border-radius:
        50%;

    background:
        #ffffff;

    box-shadow:
        0 2px 5px
        rgba(0,0,0,0.18);

    transition:
        transform 0.25s ease;
}

.notification-toggle.active
.notification-knob {
    transform:
        translateX(20px);
}


/* =========================================================
   LOGOUT
========================================================= */

.logout-button {
    width:
        100%;

    height:
        48px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    gap:
        8px;

    border:
        1.5px solid
        #202020;

    border-radius:
        12px;

    background:
        rgba(255,255,255,0.75);

    color:
        #202020;

    font-size:
        13px;

    font-weight:
        600;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.logout-button:hover {
    background:
        #fff0e5;

    border-color:
        #ff7417;

    color:
        #ff7417;

    transform:
        translateY(-1px);
}

.logout-button:active {
    transform:
        translateY(0)
        scale(0.99);
}

.logout-icon {
    font-size:
        17px;
}


/* =========================================================
   MODAL OVERLAY
========================================================= */

.profile-modal-overlay {
    position:
        fixed;

    inset:
        0;

    z-index:
        9999;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    padding:
        20px;

    background:
        rgba(25, 18, 12, 0.48);

    backdrop-filter:
        blur(7px);

    -webkit-backdrop-filter:
        blur(7px);

    animation:
        profileFadeIn
        0.2s ease;
}


/* =========================================================
   MODAL
========================================================= */

.profile-modal {
    width:
        100%;

    max-width:
        450px;

    max-height:
        90vh;

    overflow-y:
        auto;

    background:
        #ffffff;

    border:
        1px solid
        rgba(255, 120, 24, 0.13);

    border-radius:
        20px;

    box-shadow:
        0 25px 70px
        rgba(0, 0, 0, 0.20);

    animation:
        profileModalIn
        0.25s ease;
}


/* =========================================================
   MODAL HEADER
========================================================= */

.profile-modal-header {
    min-height:
        68px;

    padding:
        0 20px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    border-bottom:
        1px solid
        #f0f0f0;
}

.profile-modal-header h2 {
    margin:
        0;

    color:
        #171717;

    font-size:
        17px;

    font-weight:
        700;
}

.profile-modal-close {
    width:
        34px;

    height:
        34px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border:
        none;

    border-radius:
        10px;

    background:
        #f5f5f5;

    color:
        #777777;

    font-size:
        20px;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.profile-modal-close:hover {
    background:
        #fff0e4;

    color:
        #ff7417;
}


/* =========================================================
   MODAL BODY
========================================================= */

.profile-modal-body {
    padding:
        22px;
}

.profile-modal-description {
    margin:
        0 0 20px;

    color:
        #8b8b8b;

    font-size:
        11px;

    line-height:
        1.6;
}


/* =========================================================
   FORM
========================================================= */

.form-group {
    margin-bottom:
        16px;
}

.form-group label {
    display:
        block;

    margin-bottom:
        7px;

    color:
        #343434;

    font-size:
        11px;

    font-weight:
        600;
}

.form-group input,
.profile-modal-body input,
.profile-modal-body select {
    width:
        100%;

    height:
        45px;

    padding:
        0 13px;

    border:
        1px solid
        #dedede;

    border-radius:
        10px;

    background:
        #ffffff;

    color:
        #222222;

    outline:
        none;

    font-size:
        12px;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.form-group input:focus,
.profile-modal-body input:focus,
.profile-modal-body select:focus {
    border-color:
        #ff8a36;

    box-shadow:
        0 0 0 3px
        rgba(255, 116, 23, 0.10);
}


/* =========================================================
   MODAL BUTTONS
========================================================= */

.modal-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
}

.modal-button {
    flex:
        1;

    min-height:
        44px;

    border:
        none;

    border-radius:
        10px;

    font-size:
        12px;

    font-weight:
        700;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.modal-button {
    border: none;
    border-radius: 10px;
    padding: 11px 18px;
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modal-button.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 7px 18px rgba(255, 116, 23, 0.28);
}

.modal-button.secondary {
    background:
        #f3f3f3;

    color:
        #555555;
}

.modal-button.secondary:hover {
    background:
        #e9e9e9;
}


/* =========================================================
   CONFIRMATION MODAL
========================================================= */

.confirmation-content {
    padding:
        32px 26px 26px;

    text-align:
        center;
}

.confirmation-icon {
    width:
        62px;

    height:
        62px;

    margin:
        0 auto 16px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        50%;

    background:
        #fff1e5;

    color:
        #ff7417;

    font-size:
        28px;

    font-weight:
        700;

    box-shadow:
        0 7px 20px
        rgba(255, 116, 23, 0.13);
}

.confirmation-content h2 {
    margin:
        0 0 8px;

    color:
        #171717;

    font-size:
        19px;

    font-weight:
        700;
}

.confirmation-content p {
    margin:
        0 auto 22px;

    max-width:
        340px;

    color:
        #858585;

    font-size:
        11px;

    line-height:
        1.7;
}


/* =========================================================
   LOGOUT CONFIRMATION
========================================================= */

.logout-modal {
    padding:
        30px 26px 25px;

    text-align:
        center;
}

.logout-modal-icon {
    width:
        58px;

    height:
        58px;

    margin:
        0 auto 15px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        50%;

    background:
        #fff0e4;

    color:
        #ff7417;

    font-size:
        25px;
}

.logout-modal h2 {
    margin:
        0 0 8px;

    color:
        #171717;

    font-size:
        19px;

    font-weight:
        700;
}

.logout-modal p {
    margin:
        0 auto 22px;

    max-width:
        320px;

    color:
        #858585;

    font-size:
        11px;

    line-height:
        1.7;
}

.logout-actions {
    display:
        flex;

    gap:
        10px;
}

.logout-cancel-button,
.logout-confirm-button {
    flex:
        1;

    height:
        44px;

    border:
        none;

    border-radius:
        10px;

    font-size:
        12px;

    font-weight:
        700;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.logout-cancel-button {
    background:
        #f3f3f3;

    color:
        #555555;
}

.logout-cancel-button:hover {
    background:
        #e8e8e8;
}

.logout-confirm-button {
    background:
        #ff7417;

    color:
        #ffffff;

    box-shadow:
        0 5px 14px
        rgba(255, 116, 23, 0.20);
}

.logout-confirm-button:hover {
    background:
        #eb650d;

    transform:
        translateY(-1px);
}


/* =========================================================
   PAYMENT OPTIONS
========================================================= */

.payment-options {
    display:
        flex;

    flex-direction:
        column;

    gap:
        10px;
}

.payment-option {
    width:
        100%;

    padding:
        14px;

    display:
        flex;

    align-items:
        center;

    gap:
        12px;

    border:
        1px solid
        #e5e5e5;

    border-radius:
        12px;

    background:
        #ffffff;

    cursor:
        pointer;

    transition:
        all 0.2s ease;
}

.payment-option:hover {
    border-color:
        #ff9b56;

    background:
        #fff8f2;
}

.payment-option.active {
    border-color:
        #ff7417;

    background:
        #fff4ea;

    box-shadow:
        0 4px 12px
        rgba(255, 116, 23, 0.10);
}


/* =========================================================
   ANIMATIONS
========================================================= */

@keyframes profileFadeIn {

    from {
        opacity:
            0;
    }

    to {
        opacity:
            1;
    }
}

@keyframes profileModalIn {

    from {
        opacity:
            0;

        transform:
            translateY(12px)
            scale(0.96);
    }

    to {
        opacity:
            1;

        transform:
            translateY(0)
            scale(1);
    }
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 768px) {

    .profile-page {
        padding:
            12px;
    }

    .profile-container {
        min-height:
            calc(100vh - 24px);

        min-height:
            calc(100dvh - 24px);

        border-radius:
            20px;
    }

    .profile-content {
        max-width:
            560px;

        padding:
            26px 20px 35px;
    }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

    .profile-page {
        padding:
            0;
    }

    .profile-container {
        min-height:
            100vh;

        min-height:
            100dvh;

        max-width:
            100%;

        border-radius:
            0;

        border:
            none;
    }

    .profile-header {
        height:
            72px;
    }

    .profile-header h1 {
        font-size:
            18px;
    }

    .profile-back-button {
        left:
            14px;

        width:
            38px;

        height:
            38px;
    }

    .profile-content {
        padding:
            22px
            16px
            30px;
    }

    .profile-user-card {
        padding:
            18px;
    }

    .profile-avatar {
        width:
            58px;

        height:
            58px;

        font-size:
            34px;
    }

    .profile-user-details h2 {
        font-size:
            16px;
    }

    .profile-user-details p {
        font-size:
            10px;
    }

    .profile-menu-item {
        min-height:
            68px;
    }

    .profile-menu-icon {
        width:
            40px;

        height:
            40px;
    }

    .profile-modal-overlay {
        padding:
            14px;
    }

    .profile-modal {
        max-height:
            92vh;

        border-radius:
            18px;
    }
}


/* =========================================================
   SMALL PHONES
========================================================= */

@media (max-width: 380px) {

    .profile-content {
        padding:
            20px
            12px
            25px;
    }

    .profile-user-info {
        gap:
            11px;
    }

    .profile-user-card {
        padding:
            16px;
    }

    .profile-menu-text strong {
        font-size:
            12px;
    }

    .profile-menu-text span {
        font-size:
            9px;
    }

    .profile-menu-icon {
        width:
            38px;

        height:
            38px;

        font-size:
            17px;
    }

    .profile-modal-body {
        padding:
            18px;
    }

    .confirmation-content {
        padding:
            27px 20px 22px;
    }
}

/* =========================================================
   FINAL PROFILE MODAL UI FIX
   UI ONLY — DO NOT CHANGE FUNCTIONALITY
========================================================= */

.profile-modal-overlay {
    position: fixed;
    inset: 0;

    z-index: 9999;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background: rgba(20, 20, 20, 0.48);

    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);

    animation: modalOverlayIn 0.2s ease;
}


/* =========================================================
   MODAL CONTAINER
========================================================= */

.profile-modal {
    width: min(520px, 100%);

    max-height: min(720px, 90vh);
    max-height: min(720px, 90dvh);

    overflow-y: auto;

    background: #ffffff;

    border-radius: 20px;

    border: 1px solid rgba(255, 120, 24, 0.10);

    box-shadow:
        0 25px 70px rgba(0, 0, 0, 0.22),
        0 8px 25px rgba(255, 120, 24, 0.08);

    animation: modalIn 0.25s ease;

    scrollbar-width: thin;
    scrollbar-color: #ff7818 transparent;
}


/* =========================================================
   MODAL HEADER
========================================================= */

.profile-modal-header {
    min-height: 72px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 22px;

    border-bottom: 1px solid #eeeeee;

    background: #ffffff;
}


.profile-modal-header h2 {
    margin: 0;

    color: #171717;

    font-family: "Poppins", sans-serif;

    font-size: 18px;

    font-weight: 700;

    line-height: 1.2;
}


/* =========================================================
   CLOSE BUTTON
========================================================= */

.profile-modal-close {
    flex: 0 0 auto;

    width: 38px;
    height: 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    border: none;
    border-radius: 11px;

    background: #f7f7f7;

    color: #777777;

    font-family: Arial, sans-serif;

    font-size: 20px;
    font-weight: 400;

    line-height: 1;

    cursor: pointer;

    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

.profile-modal-close:hover {
    background: #fff0e5;

    color: #ff7818;

    transform: rotate(4deg);
}

.profile-modal-close:active {
    transform: scale(0.94);
}


/* =========================================================
   MODAL BODY
========================================================= */

.profile-modal-body {
    padding: 24px;
}


.profile-modal-description {
    margin: 0 0 20px;

    color: #858585;

    font-family: "Poppins", sans-serif;

    font-size: 12px;

    font-weight: 400;

    line-height: 1.65;
}


/* =========================================================
   PASSWORD INPUT + SHOW BUTTON
========================================================= */

.password-input-wrap {

    position: relative;

    width: 100%;
}

.password-input-wrap input {

    padding-right: 62px;
}

.password-visibility-button {

    position: absolute;

    top: 50%;
    right: 10px;

    transform: translateY(-50%);

    border: none;
    background: transparent;

    padding: 5px 4px;

    color: #ff7417;

    font-size: 10px;
    font-weight: 600;

    cursor: pointer;

    transition: color 0.2s ease, opacity 0.2s ease;
}

.password-visibility-button:hover {

    color: #e85f08;
}

.password-visibility-button:focus-visible {

    outline: 2px solid rgba(255, 116, 23, 0.35);
    outline-offset: 2px;
    border-radius: 5px;
}


/* =========================================================
   FORM GROUP
========================================================= */

.profile-form-group {
    width: 100%;

    margin-bottom: 16px;
}


.profile-form-group label {
    display: block;

    margin: 0 0 7px;

    color: #292929;

    font-family: "Poppins", sans-serif;

    font-size: 12px;

    font-weight: 600;

    line-height: 1.4;
}


.profile-form-group input,
.profile-form-group select {
    width: 100%;
    height: 46px;

    display: block;

    padding: 0 14px;

    border: 1px solid #dddddd;

    border-radius: 10px;

    outline: none;

    background: #ffffff;

    color: #222222;

    font-family: "Poppins", sans-serif;

    font-size: 13px;

    font-weight: 400;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
}

.profile-form-group input:hover,
.profile-form-group select:hover {
    border-color: #cfcfcf;
}

.profile-form-group input:focus,
.profile-form-group select:focus {
    border-color: #ff7818;

    background: #fffdfb;

    box-shadow:
        0 0 0 4px rgba(255, 120, 24, 0.10);
}


/* =========================================================
   MODAL ACTION BUTTONS
   THIS FIXES:
   "CancelSave Changes"
   "CancelLogout"
   "CancelUpdate Password"
========================================================= */

.profile-modal-actions {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    gap: 10px;

    margin-top: 24px;

    padding-top: 4px;
}


/* IMPORTANT:
   Prevent flex buttons from collapsing together.
*/

.profile-modal-actions .modal-button {
    flex: 0 0 auto;

    width: auto;
    min-width: 110px;

    height: 44px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 0 18px;

    border: none;
    border-radius: 10px;

    font-family: "Poppins", sans-serif;

    font-size: 12px;

    font-weight: 600;

    line-height: 1;

    white-space: nowrap;

    cursor: pointer;

    transition:
        transform 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}


/* =========================================================
   SECONDARY BUTTON
========================================================= */

.profile-modal-actions .modal-button.secondary {
    background: #f4f4f4;

    color: #555555;
}

.profile-modal-actions .modal-button.secondary:hover {
    background: #eaeaea;

    color: #333333;

    transform: translateY(-1px);
}


/* =========================================================
   PRIMARY BUTTON
========================================================= */

.profile-modal-actions .modal-button.primary {
    background: #ff7417;

    color: #ffffff;

    box-shadow:
        0 5px 14px rgba(255, 116, 23, 0.18);
}

.profile-modal-actions .modal-button.primary:hover {
    background: #f5660b;

    transform: translateY(-1px);

    box-shadow:
        0 8px 20px rgba(255, 116, 23, 0.25);
}


/* =========================================================
   DANGER BUTTON
========================================================= */

.profile-modal-actions .modal-button.danger {
    background: #171717;

    color: #ffffff;

    box-shadow:
        0 5px 14px rgba(0, 0, 0, 0.12);
}

.profile-modal-actions .modal-button.danger:hover {
    background: #000000;

    transform: translateY(-1px);

    box-shadow:
        0 8px 20px rgba(0, 0, 0, 0.18);
}


/* =========================================================
   PAYMENT OPTIONS
========================================================= */

.payment-option {
    width: 100%;

    min-height: 64px;

    display: flex;
    align-items: center;

    gap: 13px;

    margin-bottom: 10px;

    padding: 13px 15px;

    border: 1px solid #e4e4e4;

    border-radius: 12px;

    background: #ffffff;

    text-align: left;

    cursor: pointer;

    transition:
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
}

.payment-option:hover {
    border-color: #ffb27c;

    background: #fffaf6;

    transform: translateY(-1px);
}

.payment-option.selected {
    border-color: #ff7818;

    background: #fff8f2;

    box-shadow:
        0 0 0 3px rgba(255, 120, 24, 0.08);
}


/* radio */

.payment-radio {
    flex: 0 0 auto;

    width: 19px;
    height: 19px;

    border: 2px solid #d0d0d0;

    border-radius: 50%;

    position: relative;
}

.payment-option.selected .payment-radio {
    border-color: #ff7818;
}

.payment-option.selected .payment-radio::after {
    content: "";

    position: absolute;

    top: 50%;
    left: 50%;

    width: 9px;
    height: 9px;

    border-radius: 50%;

    background: #ff7818;

    transform: translate(-50%, -50%);
}


/* payment text */

.payment-option-text {
    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 3px;
}

.payment-option-text strong {
    color: #222222;

    font-family: "Poppins", sans-serif;

    font-size: 13px;

    font-weight: 700;

    line-height: 1.3;
}

.payment-option-text span {
    color: #888888;

    font-family: "Poppins", sans-serif;

    font-size: 11px;

    font-weight: 400;

    line-height: 1.4;
}


/* =========================================================
   HELP & SUPPORT
========================================================= */

.help-option {
    width: 100%;

    display: flex;
    align-items: flex-start;

    gap: 13px;

    padding: 13px 0;

    border-bottom: 1px solid #f0f0f0;
}

.help-option:last-of-type {
    border-bottom: none;
}


.help-option-icon {
    flex: 0 0 auto;

    width: 40px;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: #fff1e6;

    color: #ff7818;

    font-size: 16px;

    line-height: 1;
}


.help-option-text {
    min-width: 0;

    flex: 1;

    display: flex;

    flex-direction: column;

    align-items: flex-start;

    gap: 3px;
}

.help-option-text strong {
    display: block;

    margin: 0;

    color: #222222;

    font-family: "Poppins", sans-serif;

    font-size: 13px;

    font-weight: 700;

    line-height: 1.4;
}

.help-option-text span {
    display: block;

    color: #888888;

    font-family: "Poppins", sans-serif;

    font-size: 11px;

    font-weight: 400;

    line-height: 1.5;
}


/* =========================================================
   CONFIRMATION MODALS
   SUCCESS / NOTIFICATION / LOGOUT
========================================================= */

.confirmation-content {
    width: 100%;

    display: flex;

    flex-direction: column;

    align-items: center;

    text-align: center;

    padding: 34px 30px 30px;
}


.confirmation-icon {
    width: 68px;
    height: 68px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 18px;

    border-radius: 50%;

    background:
        linear-gradient(
            145deg,
            #fff3e8,
            #ffe5d1
        );

    color: #ff7417;

    font-size: 30px;
    font-weight: 700;

    box-shadow:
        0 10px 25px rgba(255, 116, 23, 0.12);
}


.logout-confirmation-icon {
    background: #fff1e6;

    color: #ff7417;
}


.confirmation-content h2 {
    margin: 0 0 9px;

    color: #171717;

    font-family: "Poppins", sans-serif;

    font-size: 20px;

    font-weight: 700;

    line-height: 1.3;
}


.confirmation-content > p {
    max-width: 380px;

    margin: 0 auto;

    color: #777777;

    font-family: "Poppins", sans-serif;

    font-size: 12px;

    font-weight: 400;

    line-height: 1.65;
}


/* =========================================================
   WARNING MESSAGE
========================================================= */

.logout-warning {
    width: 100%;

    margin-top: 16px;

    padding: 12px 14px;

    border: 1px solid #ffe0c8;

    border-radius: 10px;

    background: #fff8f2;

    color: #777777;

    font-family: "Poppins", sans-serif;

    font-size: 11px;

    font-weight: 400;

    line-height: 1.55;

    text-align: center;
}


/* =========================================================
   CONFIRMATION BUTTONS
========================================================= */

.confirmation-content .modal-button {
    width: auto;

    min-width: 115px;

    height: 44px;

    margin-top: 20px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 0 20px;

    border: none;

    border-radius: 10px;

    font-family: "Poppins", sans-serif;

    font-size: 12px;

    font-weight: 600;

    white-space: nowrap;

    cursor: pointer;
}


/* When confirmation has two buttons */

.confirmation-content .profile-modal-actions {
    width: 100%;

    display: flex;

    justify-content: center;

    gap: 10px;

    margin-top: 20px;
}

.confirmation-content .profile-modal-actions .modal-button {
    margin-top: 0;
}


/* =========================================================
   MODAL ANIMATIONS
========================================================= */

@keyframes modalOverlayIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}


/* =========================================================
   MOBILE MODALS
========================================================= */

@media (max-width: 600px) {

    .profile-modal-overlay {
        padding: 14px;
    }

    .profile-modal {
        width: 100%;

        max-height: 92vh;
        max-height: 92dvh;

        border-radius: 18px;
    }

    .profile-modal-header {
        min-height: 66px;

        padding: 0 18px;
    }

    .profile-modal-header h2 {
        font-size: 17px;
    }

    .profile-modal-body {
        padding: 20px 18px 22px;
    }

    .profile-modal-description {
        font-size: 11px;

        margin-bottom: 17px;
    }

    .profile-modal-actions {
        gap: 8px;
    }

    .profile-modal-actions .modal-button {
        min-width: 0;

        flex: 1;

        padding: 0 12px;

        font-size: 11px;
    }

    .confirmation-content {
        padding: 30px 20px 24px;
    }

    .confirmation-content h2 {
        font-size: 18px;
    }

    .confirmation-content > p {
        font-size: 11px;
    }

    .confirmation-content .profile-modal-actions {
        width: 100%;
    }

    .confirmation-content .profile-modal-actions .modal-button {
        flex: 1;

        min-width: 0;
    }
}


@media (max-width: 380px) {

    .profile-modal-overlay {
        padding: 10px;
    }

    .profile-modal-header {
        padding: 0 15px;
    }

    .profile-modal-body {
        padding: 18px 15px 20px;
    }

    .profile-modal-actions {
        flex-direction: column-reverse;

        width: 100%;
    }

    .profile-modal-actions .modal-button {
        width: 100%;

        flex: none;
    }

    .confirmation-content .profile-modal-actions {
        flex-direction: column-reverse;
    }

    .confirmation-content .profile-modal-actions .modal-button {
        width: 100%;
    }
}

/* =========================================================
   CHANGE PASSWORD MODAL
   UI ONLY
========================================================= */

.password-change-overlay {
    background:
        rgba(25, 23, 21, 0.52);

    backdrop-filter:
        blur(7px);

    -webkit-backdrop-filter:
        blur(7px);

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;
}


/* =========================================================
   MAIN PASSWORD MODAL
========================================================= */

.password-change-modal {

    width: 100%;

    max-width: 420px;

    max-height: 92vh;

    overflow-y: auto;

    background:
        linear-gradient(
            180deg,
            #fff8f0 0%,
            #fff0df 100%
        );

    border-radius: 16px;

    box-shadow:
        0 25px 70px
        rgba(0, 0, 0, 0.25);

    overflow: hidden;

    animation:
        passwordModalIn
        0.22s ease-out;
}


@keyframes passwordModalIn {

    from {
        opacity: 0;

        transform:
            translateY(15px)
            scale(0.98);
    }

    to {
        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }

}


/* =========================================================
   HEADER
========================================================= */

.password-change-header {

    position: relative;

    height: 58px;

    display: flex;

    align-items: center;

    justify-content: center;

    background:
        linear-gradient(
            180deg,
            #fffaf5,
            #fff3e7
        );

    border-bottom:
        1px solid
        rgba(255, 160, 95, 0.15);
}


.password-change-header h2 {

    margin: 0;

    color: #171717;

    font-size: 16px;

    font-weight: 500;

    line-height: 1;
}


.password-back-button {

    position: absolute;

    left: 15px;

    top: 50%;

    transform:
        translateY(-50%);

    width: 34px;

    height: 34px;

    display: flex;

    align-items: center;

    justify-content: center;

    border: none;

    background: transparent;

    color: #333;

    font-size: 22px;

    font-weight: 400;

    cursor: pointer;

    border-radius: 50%;

    transition:
        background 0.2s ease,
        color 0.2s ease;
}


.password-back-button:hover {

    background:
        rgba(255, 120, 24, 0.10);

    color:
        #ff7417;
}


/* =========================================================
   BODY
========================================================= */

.password-change-body {

    padding:
        20px 22px 22px;

}


/* =========================================================
   FORM GROUP
========================================================= */

.password-field-group {

    margin-bottom: 17px;

}


.password-field-group label {

    display: block;

    margin-bottom: 7px;

    color: #444;

    font-size: 11px;

    font-weight: 400;

}


.password-field-group input {

    width: 100%;

    height: 43px;

    padding:
        0 12px;

    border:
        1px solid
        #d9d9d9;

    border-radius: 7px;

    outline: none;

    background:
        #ffffff;

    color: #222;

    font-size: 12px;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}


.password-field-group input::placeholder {

    color:
        #888;
}


.password-field-group input:focus {

    border-color:
        #ff8a3d;

    box-shadow:
        0 0 0 3px
        rgba(255, 116, 23, 0.10);
}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

.password-strength {

    margin-top: -7px;

    margin-bottom: 20px;

}


.strength-bars {

    display: flex;

    gap: 4px;

    width: 100%;

    margin-bottom: 5px;
}


.strength-bars span {

    flex: 1;

    height: 3px;

    border-radius: 5px;

    background:
        #dedede;

    transition:
        background 0.2s ease;
}


.strength-bars span.strength-active {

    background:
        #ff7417;
}


.strength-label {

    display: block;

    margin-bottom: 6px;

    color:
        #858585;

    font-size: 9px;

}


/* =========================================================
   PASSWORD REQUIREMENTS
========================================================= */

.password-requirements {

    display: flex;

    flex-direction: column;

    gap: 3px;

}


.password-requirements div {

    display: flex;

    align-items: center;

    gap: 6px;

    color:
        #777;

    font-size: 9px;

    line-height: 1.35;
}


.password-requirements div span:first-child {

    color:
        #999;

    font-size: 9px;

}


/* =========================================================
   CONFIRM PASSWORD
========================================================= */

.confirm-password-group {

    margin-top: 2px;

    margin-bottom: 17px;

}


/* =========================================================
   ERROR / INFORMATION MESSAGE
========================================================= */

.password-modal-message {

    width: 100%;

    padding:
        9px 11px;

    margin-bottom: 12px;

    border-radius: 7px;

    background:
        #fff1eb;

    border:
        1px solid
        #ffd3c2;

    color:
        #c94e19;

    font-size: 10px;

    line-height: 1.4;
}


/* =========================================================
   UPDATE PASSWORD BUTTON
========================================================= */

.password-update-button {

    width: 100%;

    height: 43px;

    border: none;

    border-radius: 7px;

    background:
        linear-gradient(135deg, #ff7417, #ff8a3d);

    color:
        #ffffff;

    font-size: 12px;

    font-weight: 500;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}


.password-update-button:hover {

    background:
        linear-gradient(135deg, #e8660c, #ff7417);

    transform:
        translateY(-1px);

    box-shadow:
        0 7px 15px
        rgba(0, 0, 0, 0.15);
}


.password-update-button:active {

    transform:
        translateY(0);

}


/* =========================================================
   SECURITY TIPS
========================================================= */

.security-tips {

    margin-top: 20px;

    padding:
        13px 14px;

    background:
        #ffffff;

    border-radius: 7px;

    box-shadow:
        0 2px 8px
        rgba(0, 0, 0, 0.04);
}


.security-tips-title {

    display: flex;

    align-items: center;

    gap: 8px;

    margin-bottom: 8px;

    color:
        #444;

    font-size: 10px;

    font-weight: 500;
}


.security-shield {

    display: flex;

    align-items: center;

    justify-content: center;

    width: 15px;

    height: 15px;

    color:
        #555;

    font-size: 13px;
}


.security-tips ul {

    margin:
        0;

    padding-left:
        18px;
}


.security-tips li {

    margin-bottom: 4px;

    color:
        #666;

    font-size: 9px;

    line-height: 1.4;
}


.security-tips li:last-child {

    margin-bottom: 0;

}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 480px) {

    .password-change-overlay {

        padding: 0;

        align-items: center;

    }


    .password-change-modal {

        width: calc(100vw - 30px);

        max-width: 340px;

        max-height: 94vh;

        border-radius: 0;

    }


    .password-change-header {

        height: 55px;

    }


    .password-change-header h2 {

        font-size: 15px;

    }


    .password-change-body {

        padding:
            19px 12px 20px;

    }


    .password-field-group {

        margin-bottom: 15px;

    }


    .password-field-group input {

        height: 40px;

        font-size: 11px;

    }


    .password-update-button {

        height: 40px;

        font-size: 11px;

    }


    .security-tips {

        margin-top: 18px;

        padding:
            12px;

    }

}


/* =========================================================
   VERY SMALL MOBILE
========================================================= */

@media (max-width: 360px) {

    .password-change-modal {

        width: calc(100vw - 28px);

    }


    .password-change-body {

        padding:
            17px 11px 18px;

    }


    .password-field-group label {

        font-size: 10px;

    }


    .password-field-group input {

        height: 39px;

    }


    .password-requirements div {

        font-size: 8px;

    }


    .security-tips li {

        font-size: 8px;

    }

}
    
`}</style>
            <main className="profile-page">

                <div className="profile-container">
                    <header className="profile-header">

                        <button
                            type="button"
                            className="profile-back-button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            aria-label="Go back"
                        >
                            ←
                        </button>

                        <h1>
                            Profile
                        </h1>

                    </header>
                    <section className="profile-content">
                        <div className="profile-user-card">

                            <div className="profile-user-info">

                                <div className="profile-avatar">

                                    <span>
                                        👨🏻
                                    </span>

                                </div>

                                <div className="profile-user-details">

                                    <h2>
                                        {user.name}
                                    </h2>

                                    <p>
                                        {user.email}
                                    </p>

                                    <p>
                                        {user.phone}
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="edit-profile-button"
                                onClick={handleEditProfile}
                            >
                                Edit Profile
                            </button>

                        </div>
                        <div className="profile-menu">
                            <button
                                type="button"
                                className="profile-menu-item"
                                onClick={
                                    handlePaymentMethods
                                }
                            >

                                <div className="profile-menu-icon">
                                    💳
                                </div>

                                <div className="profile-menu-text">

                                    <strong>
                                        Payment Methods
                                    </strong>

                                    <span>
                                        Saved GCash / Maya
                                    </span>

                                </div>

                                <span className="profile-arrow">
                                    ›
                                </span>

                            </button>
                            <div
                                className="profile-menu-item"
                                role="button"
                                tabIndex={0}
                                onClick={
                                    handleNotificationToggle
                                }
                                onKeyDown={(event) => {

                                    if (
                                        event.key ===
                                        "Enter" ||
                                        event.key ===
                                        " "
                                    ) {

                                        event.preventDefault();

                                        handleNotificationToggle();

                                    }

                                }}
                            >

                                <div className="profile-menu-icon">
                                    🔔
                                </div>

                                <div className="profile-menu-text">

                                    <strong>
                                        Notifications
                                    </strong>

                                    <span>
                                        {notifications
                                            ? "Notifications enabled"
                                            : "Tap to allow alerts"}
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className={`notification-toggle ${
                                        notifications
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={(event) => {

                                        event.stopPropagation();

                                        handleNotificationToggle();

                                    }}
                                    aria-label={
                                        notifications
                                            ? "Disable notifications"
                                            : "Enable notifications"
                                    }
                                >

                                    <span className="notification-knob" />

                                </button>

                            </div>
                            <button
                                type="button"
                                className="profile-menu-item"
                                onClick={
                                    handleSettings
                                }
                            >

                                <div className="profile-menu-icon">
                                    ⚙️
                                </div>

                                <div className="profile-menu-text">

                                    <strong>
                                        Settings
                                    </strong>

                                    <span>
                                        Change password, preferences
                                    </span>

                                </div>

                                <span className="profile-arrow">
                                    ›
                                </span>

                            </button>
                            <button
                                type="button"
                                className="profile-menu-item"
                                onClick={
                                    handleHelpSupport
                                }
                            >

                                <div className="profile-menu-icon">
                                    ?
                                </div>

                                <div className="profile-menu-text">

                                    <strong>
                                        Help & Support
                                    </strong>

                                    <span>
                                        FAQs, Contact support
                                    </span>

                                </div>

                                <span className="profile-arrow">
                                    ›
                                </span>

                            </button>

                        </div>
                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >

                            <span className="logout-icon">
                                ↪
                            </span>

                            Logout

                        </button>

                    </section>

                </div>

            </main>
            {activeModal === "edit" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="profile-modal-header">

                            <h2>
                                Edit Profile
                            </h2>

                            <button
                                type="button"
                                className="profile-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="profile-modal-body"
                            onSubmit={
                                handleSaveProfile
                            }
                        >

                            <p className="profile-modal-description">
                                Update your personal information
                                below. Make sure your information
                                is accurate before saving.
                            </p>


                            <div className="profile-form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(event) =>
                                        setEditForm({
                                            ...editForm,
                                            name:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="Enter your name"
                                />

                            </div>


                            <div className="profile-form-group">

                                <label>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(event) =>
                                        setEditForm({
                                            ...editForm,
                                            email:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="Enter your email"
                                />

                            </div>


                            <div className="profile-form-group">

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(event) =>
                                        setEditForm({
                                            ...editForm,
                                            phone:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="+63 912 345 6789"
                                />

                            </div>


                            {modalMessage && (

                                <div className="logout-warning">
                                    {modalMessage}
                                </div>

                            )}


                            <div className="profile-modal-actions">

                                <button
                                    type="button"
                                    className="modal-button secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-button primary"
                                >
                                    Save Changes
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}
            {activeModal === "payment" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="profile-modal-header">

                            <h2>
                                Payment Methods
                            </h2>

                            <button
                                type="button"
                                className="profile-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        <div className="profile-modal-body">

                            <p className="profile-modal-description">
                                Choose your preferred payment
                                method for your GuimarasGo bookings.
                            </p>


                            <button
                                type="button"
                                className={`payment-option ${
                                    paymentMethod === "GCash"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(
                                        "GCash"
                                    )
                                }
                            >

                                <div className="payment-radio" />

                                <div className="payment-option-text">

                                    <strong>
                                        GCash
                                    </strong>

                                    <span>
                                        Fast and convenient mobile
                                        payment.
                                    </span>

                                </div>

                            </button>


                            <button
                                type="button"
                                className={`payment-option ${
                                    paymentMethod === "Maya"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(
                                        "Maya"
                                    )
                                }
                            >

                                <div className="payment-radio" />

                                <div className="payment-option-text">

                                    <strong>
                                        Maya
                                    </strong>

                                    <span>
                                        Pay securely using Maya.
                                    </span>

                                </div>

                            </button>


                            <div className="profile-modal-actions">

                                <button
                                    type="button"
                                    className="modal-button secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="modal-button primary"
                                    onClick={
                                        handleSavePayment
                                    }
                                >
                                    Save Method
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}
{activeModal === "settings" && (

    <div
        className="profile-modal-overlay password-change-overlay"
        onMouseDown={handleBackdropClick}
    >

        <div className="password-change-modal">
            <div className="password-change-header">

                <button
                    type="button"
                    className="password-back-button"
                    onClick={closeModal}
                    aria-label="Back"
                >
                    ←
                </button>

                <h2>
                    Change Password
                </h2>

            </div>
            <form
                className="password-change-body"
                onSubmit={handleChangePassword}
            >

                {/* CURRENT PASSWORD */}

                <div className="password-field-group">

                    <label>
                        Current Password
                    </label>

                    <div className="password-input-wrap">
                        <input
                            type={
                                showCurrentPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                passwordForm.currentPassword
                            }
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    currentPassword:
                                        event.target.value,
                                })
                            }
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            className="password-visibility-button"
                            onClick={() =>
                                setShowCurrentPassword(
                                    !showCurrentPassword
                                )
                            }
                            aria-label={
                                showCurrentPassword
                                    ? "Hide current password"
                                    : "Show current password"
                            }
                        >
                            {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                </div>


                {/* NEW PASSWORD */}

                <div className="password-field-group">

                    <label>
                        New Password
                    </label>

                    <div className="password-input-wrap">
                        <input
                            type={
                                showNewPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                passwordForm.newPassword
                            }
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    newPassword:
                                        event.target.value,
                                })
                            }
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            className="password-visibility-button"
                            onClick={() =>
                                setShowNewPassword(
                                    !showNewPassword
                                )
                            }
                            aria-label={
                                showNewPassword
                                    ? "Hide new password"
                                    : "Show new password"
                            }
                        >
                            {showNewPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                </div>


                {/* PASSWORD STRENGTH */}

                <div className="password-strength">

                    <div className="strength-bars">

                        <span
                            className={
                                passwordForm.newPassword.length >= 1
                                    ? "strength-active"
                                    : ""
                            }
                        />

                        <span
                            className={
                                passwordForm.newPassword.length >= 4
                                    ? "strength-active"
                                    : ""
                            }
                        />

                        <span
                            className={
                                passwordForm.newPassword.length >= 8
                                    ? "strength-active"
                                    : ""
                            }
                        />

                        <span
                            className={
                                passwordForm.newPassword.length >= 12
                                    ? "strength-active"
                                    : ""
                            }
                        />

                    </div>


                    <span className="strength-label">
                        Password strength:{" "}

                        {passwordForm.newPassword.length === 0
                            ? "Weak"
                            : passwordForm.newPassword.length < 8
                            ? "Weak"
                            : passwordForm.newPassword.length < 12
                            ? "Medium"
                            : "Strong"
                        }
                    </span>


                    {/* PASSWORD REQUIREMENTS */}

                    <div className="password-requirements">

                        <div>
                            <span>
                                ●
                            </span>

                            <span>
                                At least 8 characters
                            </span>
                        </div>

                        <div>
                            <span>
                                ●
                            </span>

                            <span>
                                One uppercase letter
                            </span>
                        </div>

                        <div>
                            <span>
                                ●
                            </span>

                            <span>
                                One number
                            </span>
                        </div>

                        <div>
                            <span>
                                ●
                            </span>

                            <span>
                                One special character
                            </span>
                        </div>

                    </div>

                </div>


                {/* CONFIRM PASSWORD */}

                <div className="password-field-group confirm-password-group">

                    <label>
                        Confirm New Password
                    </label>

                    <div className="password-input-wrap">
                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                passwordForm.confirmPassword
                            }
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    confirmPassword:
                                        event.target.value,
                                })
                            }
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            className="password-visibility-button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                            }
                        >
                            {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                </div>


                {/* EXISTING MESSAGE */}

                {modalMessage && (

                    <div className="password-modal-message">
                        {modalMessage}
                    </div>

                )}


                {/* UPDATE BUTTON */}

                <button
                    type="submit"
                    className="password-update-button"
                >
                    Update Password
                </button>


                {/* SECURITY TIPS */}

                <div className="security-tips">

                    <div className="security-tips-title">

                        <span className="security-shield">
                            ◐
                        </span>

                        <span>
                            Security Tips
                        </span>

                    </div>


                    <ul>

                        <li>
                            Use a unique password you haven't used before
                        </li>

                        <li>
                            Avoid common words or personal information
                        </li>

                        <li>
                            Consider using a password manager
                        </li>

                    </ul>

                </div>

            </form>

        </div>

    </div>

)}
            {activeModal === "help" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="profile-modal-header">

                            <h2>
                                Help & Support
                            </h2>

                            <button
                                type="button"
                                className="profile-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        <div className="profile-modal-body">

                            <p className="profile-modal-description">
                                Need help with your GuimarasGo
                                account or booking?
                            </p>


                            <div className="help-option">

                                <div className="help-option-icon">
                                    ?
                                </div>

                                <div className="help-option-text">

                                    <strong>
                                        Frequently Asked Questions
                                    </strong>

                                    <span>
                                        Find answers to common questions.
                                    </span>

                                </div>

                            </div>


                            <div className="help-option">

                                <div className="help-option-icon">
                                    🎫
                                </div>

                                <div className="help-option-text">

                                    <strong>
                                        Booking Assistance
                                    </strong>

                                    <span>
                                        Get help with your ferry booking.
                                    </span>

                                </div>

                            </div>


                            <div className="help-option">

                                <div className="help-option-icon">
                                    ✉
                                </div>

                                <div className="help-option-text">

                                    <strong>
                                        Contact Support
                                    </strong>

                                    <span>
                                        Contact the GuimarasGo support team.
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}
            {activeModal === "logout" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon logout-confirmation-icon">
                                ↪
                            </div>

                            <h2>
                                Logout?
                            </h2>

                            <p>
                                Are you sure you want to logout
                                from your GuimarasGo account?
                            </p>

                            <div className="logout-warning">
                                You will need to sign in again
                                to access your account.
                            </div>


                            <div className="profile-modal-actions">

                                <button
                                    type="button"
                                    className="modal-button secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="modal-button danger"
                                    onClick={
                                        confirmLogout
                                    }
                                >
                                    Logout
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}
            {activeModal === "success" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon">
                                ✓
                            </div>

                            <h2>
                                Successfully Updated
                            </h2>

                            <p>
                                {modalMessage}
                            </p>

                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Done
                            </button>

                        </div>

                    </div>

                </div>

            )}
            {activeModal === "notificationEnabled" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon">
                                🔔
                            </div>

                            <h2>
                                Notifications Enabled
                            </h2>

                            <p>
                                {modalMessage}
                            </p>

                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Continue
                            </button>

                        </div>

                    </div>

                </div>

            )}
            {activeModal === "notificationDenied" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon logout-confirmation-icon">
                                🔕
                            </div>

                            <h2>
                                Notifications Not Enabled
                            </h2>

                            <p>
                                {modalMessage}
                            </p>

                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Got It
                            </button>

                        </div>

                    </div>

                </div>

            )}
            {activeModal === "notificationBlocked" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon logout-confirmation-icon">
                                🔕
                            </div>
                            <h2>
                                Notifications Blocked
                            </h2>
                            <p>
                                {modalMessage}
                            </p>

                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Got It
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================================================
               NOTIFICATION UNAVAILABLE
            ========================================================= */}

            {activeModal === "notificationUnavailable" && (

                <div
                    className="profile-modal-overlay"
                    onMouseDown={handleBackdropClick}
                >

                    <div className="profile-modal">

                        <div className="confirmation-content">

                            <div className="confirmation-icon logout-confirmation-icon">
                                !
                            </div>

                            <h2>
                                Notification Unavailable
                            </h2>

                            <p>
                                {modalMessage}
                            </p>

                            <button
                                type="button"
                                className="modal-button primary"
                                onClick={closeModal}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
};

export default Profile; 