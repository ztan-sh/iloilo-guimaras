import React, { useEffect, useState } from "react";
import { useAdminWorkspace } from "./AdminState";
import { AdminButton, AdminDialog, AdminField, AdminHeading, AdminNotice, AdminPanel, AdminStatus, AdminTable } from "../../components/admin/AdminUI";
import { formatTimestamp } from "./adminUtils";

const emptyForm = { name: "", email: "", password: "", confirmPassword: "", role: "STAFF" };

export default function AdminStaff() {
    const { api, preview, setNotice } = useAdminWorkspace();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState("");

    const loadStaff = async () => {
        if (preview) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/admin/accounts", { timeout: 5000 });
            setAccounts(data.accounts || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to load staff accounts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadStaff(); }, [api, preview]);

    const createStaff = async event => {
        event.preventDefault();
        if (saving) return;
        const adminAccount = form.role === "ADMIN";
        if (adminAccount && (form.password.length < 12 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password))) {
            setError("Admin passwords need at least 12 characters with uppercase, lowercase, number, and symbol.");
            return;
        }
        if (!adminAccount && form.password.length < 8) { setError("Staff passwords must be at least 8 characters."); return; }
        if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
        setSaving(true);
        setError("");
        try {
            const path = adminAccount ? "/admin/admins" : "/admin/staff";
            const payload = { ...form, name: form.name.trim(), fullName: form.name.trim(), email: form.email.trim().toLowerCase() };
            await api.post(path, payload);
            setFormOpen(false);
            setForm(emptyForm);
            setNotice(`${adminAccount ? "Administrator" : "Staff"} account created for ${form.email.trim()}.`);
            await loadStaff();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to create staff account.");
        } finally {
            setSaving(false);
        }
    };

    const setStaffActive = async person => {
        if (actionId) return;
        setActionId(String(person._id || person.id));
        setError("");
        try {
            const action = person.isActive ? "deactivate" : "activate";
            await api.put(`/admin/staff/${person._id || person.id}/${action}`);
            setNotice(`${person.name}'s account is now ${person.isActive ? "inactive" : "active"}.`);
            await loadStaff();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to update this staff account.");
        } finally {
            setActionId("");
        }
    };

    return <div className="admin-staff-page">
        <AdminPanel>
            <AdminHeading title="Staff & admin accounts" detail="Create staff or administrator credentials and manage staff access.">
                <AdminButton onClick={() => { setError(""); setForm(emptyForm); setFormOpen(true); }}>Add account</AdminButton>
            </AdminHeading>
            <AdminNotice error>{error}</AdminNotice>
            {preview ? <AdminNotice>Account management is available in the connected administrator workspace.</AdminNotice> : loading ? <div className="staff-loading" role="status">Loading accounts…</div> : <AdminTable label="Staff and administrator accounts" columns={[{ label: "Account", width: 20 }, { label: "Email", width: 28 }, { label: "Role", width: 14 }, { label: "Status", width: 14 }, { label: "Added", width: 14 }, { label: "Access", width: 10 }]} empty={!accounts.length && "No staff or administrator accounts have been added yet."}>
                {accounts.map(person => {
                    const id = String(person._id || person.id);
                    return <tr key={id}>
                        <td><strong>{person.name || person.fullName}</strong></td>
                        <td>{person.email}</td>
                        <td>{person.role === "ADMIN" ? "Admin" : "Staff"}</td>
                        <td><AdminStatus>{person.isActive ? "Active" : "Inactive"}</AdminStatus></td>
                        <td>{formatTimestamp(person.createdAt)}</td>
                        <td>{person.role === "ADMIN" ? <span>Administrator</span> : <AdminButton variant={person.isActive ? "danger" : "secondary"} disabled={actionId === id} onClick={() => setStaffActive(person)}>{actionId === id ? "Updating…" : person.isActive ? "Deactivate" : "Activate"}</AdminButton>}</td>
                    </tr>;
                })}
            </AdminTable>}
            <p className="admin-staff-note">Passwords are hashed before storage. New administrator accounts require a strong password and receive management access.</p>
        </AdminPanel>
        {formOpen && <AdminDialog title="Add account" onClose={() => { if (!saving) setFormOpen(false); }}>
            <form className="staff-form-stack" onSubmit={createStaff}>
                <p>Create sign-in credentials for a staff member or administrator.</p>
                <AdminNotice error>{error}</AdminNotice>
                <AdminField label="Account type" value={form.role} options={[{ value: "STAFF", label: "Staff" }, { value: "ADMIN", label: "Administrator" }]} onChange={event => setForm(current => ({ ...current, role: event.target.value }))} disabled={saving} />
                <AdminField label="Full name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} autoComplete="name" required maxLength={100} disabled={saving} />
                <AdminField label="Email address" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} autoComplete="email" required maxLength={254} disabled={saving} />
                <div className="staff-details-grid">
                    <AdminField label="Password" type="password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength={form.role === "ADMIN" ? 12 : 8} required disabled={saving} />
                    <AdminField label="Confirm password" type="password" value={form.confirmPassword} onChange={event => setForm(current => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength={form.role === "ADMIN" ? 12 : 8} required disabled={saving} />
                </div>
                {form.role === "ADMIN" && <small>Use at least 12 characters with uppercase, lowercase, a number, and a symbol.</small>}
                <div className="admin-desktop-editor-actions"><AdminButton type="submit" disabled={saving}>{saving ? "Creating…" : `Create ${form.role === "ADMIN" ? "admin" : "staff"} account`}</AdminButton><AdminButton type="button" variant="secondary" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</AdminButton></div>
            </form>
        </AdminDialog>}
    </div>;
}
