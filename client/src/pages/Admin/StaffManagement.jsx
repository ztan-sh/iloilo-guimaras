import React, { useEffect, useState } from "react";
import "./StaffManagement.css";

const API_URL = "https://iloilo-guimaras.onrender.com/api";

const StaffManagement = () => {

    // =========================================================
    // STAFF DATA
    // =========================================================

    const [staffList, setStaffList] = useState([]);

    const [loading, setLoading] = useState(true);

    // =========================================================
    // FORM
    // =========================================================

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [formLoading, setFormLoading] = useState(false);

    // =========================================================
    // NOTIFICATION
    // =========================================================

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: ""
    });

    // =========================================================
    // ACTION LOADING
    // =========================================================

    const [actionLoading, setActionLoading] = useState(null);

    // =========================================================
    // SHOW NOTIFICATION
    // =========================================================

    const showNotification = (
        message,
        type = "error"
    ) => {

        setNotification({
            show: true,
            type,
            message
        });

        setTimeout(() => {

            setNotification({
                show: false,
                type: "",
                message: ""
            });

        }, 4000);
    };

    // =========================================================
    // LOAD STAFF
    // =========================================================

    const loadStaff = async () => {

        const token = localStorage.getItem("adminToken") || localStorage.getItem("adminData") || "cookie-session";

        if (!token) {
            return;
        }

        setLoading(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/admin/staff`,
                    {
                        method: "GET",
                        credentials: "include",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load staff accounts."
                );
            }

            setStaffList(
                data.staff || []
            );

        } catch (error) {

            console.error(
                "Load staff error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to load staff accounts."
            );

        } finally {

            setLoading(false);

        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadStaff();

    }, []);

    // =========================================================
    // HANDLE FORM CHANGE
    // =========================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setFormData(
            previous => ({
                ...previous,
                [name]: value
            })
        );
    };

    // =========================================================
    // CREATE STAFF
    // =========================================================

    const handleCreateStaff = async (event) => {

        event.preventDefault();

        const token = localStorage.getItem("adminToken") || localStorage.getItem("adminData") || "cookie-session";

        if (!token) {
            showNotification(
                "Administrator session has expired."
            );
            return;
        }

        // -----------------------------------------------------
        // FRONTEND VALIDATION
        // -----------------------------------------------------

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password ||
            !formData.confirmPassword
        ) {

            showNotification(
                "Please complete all required fields."
            );

            return;
        }

        if (
            formData.password !==
            formData.confirmPassword
        ) {

            showNotification(
                "Passwords do not match."
            );

            return;
        }

        if (
            formData.password.length < 6
        ) {

            showNotification(
                "Password must be at least 6 characters."
            );

            return;
        }

        setFormLoading(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/admin/staff`,
                    {
                        method: "POST",
                        credentials: "include",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body: JSON.stringify({

                            name:
                                formData.name.trim(),

                            email:
                                formData.email.trim(),

                            password:
                                formData.password,

                            confirmPassword:
                                formData.confirmPassword

                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to create staff account."
                );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            showNotification(
                "Staff account created successfully.",
                "success"
            );

            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
            });

            setShowForm(false);

            await loadStaff();

        } catch (error) {

            console.error(
                "Create staff error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to create staff account."
            );

        } finally {

            setFormLoading(false);

        }
    };

    // =========================================================
    // ACTIVATE STAFF
    // =========================================================

    const handleActivate = async (staffId) => {

        const token = localStorage.getItem("adminToken") || localStorage.getItem("adminData") || "cookie-session";

        if (!token) {
            return;
        }

        setActionLoading(staffId);

        try {

            const response =
                await fetch(
                    `${API_URL}/admin/staff/${staffId}/activate`,
                    {
                        method: "PUT",
                        credentials: "include",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to activate staff account."
                );
            }

            showNotification(
                "Staff account activated successfully.",
                "success"
            );

            await loadStaff();

        } catch (error) {

            console.error(
                "Activate staff error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to activate staff account."
            );

        } finally {

            setActionLoading(null);

        }
    };

    // =========================================================
    // DEACTIVATE STAFF
    // =========================================================

    const handleDeactivate = async (staffId) => {

        const token = localStorage.getItem("adminToken") || localStorage.getItem("adminData") || "cookie-session";

        if (!token) {
            return;
        }

        setActionLoading(staffId);

        try {

            const response =
                await fetch(
                    `${API_URL}/admin/staff/${staffId}/deactivate`,
                    {
                        method: "PUT",
                        credentials: "include",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to deactivate staff account."
                );
            }

            showNotification(
                "Staff account deactivated successfully.",
                "success"
            );

            await loadStaff();

        } catch (error) {

            console.error(
                "Deactivate staff error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to deactivate staff account."
            );

        } finally {

            setActionLoading(null);

        }
    };

    // =========================================================
    // DELETE STAFF
    // =========================================================

    const handleDelete = async (staffId) => {

        const token = localStorage.getItem("adminToken") || localStorage.getItem("adminData") || "cookie-session";

        if (!token) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this staff account?"
            );

        if (!confirmed) {
            return;
        }

        setActionLoading(staffId);

        try {

            const response =
                await fetch(
                    `${API_URL}/admin/staff/${staffId}`,
                    {
                        method: "DELETE",
                        credentials: "include",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete staff account."
                );
            }

            showNotification(
                "Staff account deleted successfully.",
                "success"
            );

            await loadStaff();

        } catch (error) {

            console.error(
                "Delete staff error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to delete staff account."
            );

        } finally {

            setActionLoading(null);

        }
    };

    // =========================================================
    // CLOSE FORM
    // =========================================================

    const closeForm = () => {

        if (formLoading) {
            return;
        }

        setShowForm(false);

        setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        });
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        try {

            return new Date(
                date
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

        } catch {

            return "—";

        }
    };

    // =========================================================
    // UI
    // =========================================================

    return (

        <section className="staff-management">

            {/* =================================================
                NOTIFICATION
            ================================================= */}

            {notification.show && (

                <div
                    className={
                        `staff-notification ${
                            notification.type
                        }`
                    }
                >

                    <span>
                        {notification.message}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setNotification({
                                show: false,
                                type: "",
                                message: ""
                            })
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="staff-management-header">

                <div>

                    <h1>
                        Staff Management
                    </h1>

                    <p>
                        Manage staff accounts and
                        access to the GuimarasGo
                        staff system.
                    </p>

                </div>

                <button
                    className="add-staff-button"
                    onClick={() =>
                        setShowForm(true)
                    }
                >
                    + Add Staff
                </button>

            </div>


            {/* =================================================
                STAFF SUMMARY
            ================================================= */}

            <div className="staff-summary">

                <div className="staff-summary-card">

                    <div className="staff-summary-icon">
                        #
                    </div>

                    <div>

                        <span>
                            Total Staff
                        </span>

                        <strong>
                            {staffList.length}
                        </strong>

                    </div>

                </div>


                <div className="staff-summary-card">

                    <div className="staff-summary-icon active-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Active Staff
                        </span>

                        <strong>
                            {
                                staffList.filter(
                                    staff =>
                                        staff.isActive
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                <div className="staff-summary-card">

                    <div className="staff-summary-icon inactive-icon">
                        !
                    </div>

                    <div>

                        <span>
                            Inactive Staff
                        </span>

                        <strong>
                            {
                                staffList.filter(
                                    staff =>
                                        !staff.isActive
                                ).length
                            }
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                ADD STAFF FORM
            ================================================= */}

            {showForm && (

                <div className="staff-form-card">

                    <div className="staff-form-header">

                        <div>

                            <h2>
                                Add Staff Account
                            </h2>

                            <p>
                                Create a new account
                                for ferry staff.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="close-form-button"
                            onClick={closeForm}
                            disabled={formLoading}
                        >
                            ×
                        </button>

                    </div>


                    <form
                        onSubmit={handleCreateStaff}
                    >

                        <div className="staff-form-grid">

                            {/* NAME */}

                            <div className="staff-form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter staff full name"
                                    disabled={formLoading}
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="staff-form-group">

                                <label>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter staff email"
                                    disabled={formLoading}
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="staff-form-group">

                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Minimum 6 characters"
                                    disabled={formLoading}
                                />

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="staff-form-group">

                                <label>
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={
                                        formData.confirmPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Confirm password"
                                    disabled={formLoading}
                                />

                            </div>

                        </div>


                        <div className="staff-form-actions">

                            <button
                                type="button"
                                className="cancel-staff-button"
                                onClick={closeForm}
                                disabled={formLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="create-staff-button"
                                disabled={formLoading}
                            >

                                {formLoading
                                    ? "Creating..."
                                    : "Create Staff"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* =================================================
                STAFF LIST
            ================================================= */}

            <div className="staff-list-card">

                <div className="staff-list-header">

                    <div>

                        <h2>
                            Staff Accounts
                        </h2>

                        <p>
                            View and manage registered
                            staff members.
                        </p>

                    </div>

                    <button
                        className="refresh-staff-button"
                        onClick={loadStaff}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh"
                        }
                    </button>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="staff-loading">

                        <div className="staff-loading-spinner">
                        </div>

                        <p>
                            Loading staff accounts...
                        </p>

                    </div>

                ) : staffList.length === 0 ? (

                    /* =================================================
                        EMPTY
                    ================================================= */

                    <div className="staff-empty">

                        <div className="staff-empty-icon">
                            +
                        </div>

                        <h3>
                            No Staff Accounts
                        </h3>

                        <p>
                            There are currently no
                            staff accounts registered.
                        </p>

                        <button
                            onClick={() =>
                                setShowForm(true)
                            }
                        >
                            Add Your First Staff
                        </button>

                    </div>

                ) : (

                    /* =================================================
                        TABLE
                    ================================================= */

                    <div className="staff-table-wrapper">

                        <table className="staff-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Created
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {staffList.map(
                                    staff => (

                                        <tr
                                            key={
                                                staff._id ||
                                                staff.id
                                            }
                                        >

                                            <td>

                                                <div className="staff-name-cell">

                                                    <div className="staff-avatar">

                                                        {
                                                            staff.name
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase()
                                                        }

                                                    </div>

                                                    <strong>
                                                        {
                                                            staff.name
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>
                                                {
                                                    staff.email
                                                }
                                            </td>


                                            <td>

                                                <span className="staff-role">

                                                    {
                                                        (
                                                            staff.role ||
                                                            "staff"
                                                        ).toUpperCase()
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        `staff-status ${
                                                            staff.isActive
                                                                ? "active"
                                                                : "inactive"
                                                        }`
                                                    }
                                                >

                                                    <span className="status-dot">
                                                    </span>

                                                    {
                                                        staff.isActive
                                                            ? "ACTIVE"
                                                            : "INACTIVE"
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    formatDate(
                                                        staff.createdAt
                                                    )
                                                }

                                            </td>


                                            <td>

                                                <div className="staff-actions">

                                                    {staff.isActive ? (

                                                        <button
                                                            className="staff-action deactivate"
                                                            onClick={() =>
                                                                handleDeactivate(
                                                                    staff._id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                staff._id
                                                            }
                                                        >

                                                            {actionLoading ===
                                                            staff._id
                                                                ? "..."
                                                                : "Deactivate"
                                                            }

                                                        </button>

                                                    ) : (

                                                        <button
                                                            className="staff-action activate"
                                                            onClick={() =>
                                                                handleActivate(
                                                                    staff._id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                staff._id
                                                            }
                                                        >

                                                            {actionLoading ===
                                                            staff._id
                                                                ? "..."
                                                                : "Activate"
                                                            }

                                                        </button>

                                                    )}


                                                    <button
                                                        className="staff-action delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                staff._id
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading ===
                                                            staff._id
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </section>

    );
};

export default StaffManagement;
