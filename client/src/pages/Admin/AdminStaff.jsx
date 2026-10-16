import React, { useEffect, useState } from "react";
import { useAdminWorkspace } from "./AdminState";
import { AdminButton, AdminDialog, AdminField, AdminHeading, AdminNotice, AdminPanel, AdminStatus, AdminTable } from "../../components/admin/AdminUI";
import { formatTimestamp } from "./adminUtils";

const emptyForm = { name: "", email: "", password: "", confirmPassword: "" };

export default function AdminStaff() {
    const { api, preview, setNotice } = useAdminWorkspace();
    const [staff, setStaff] = useState([]);
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
            const { data } = await api.get("/admin/staff");
            setStaff(data.staff || []);
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
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
        setSaving(true);
        setError("");
        try {
            await api.post("/admin/staff", { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
            setFormOpen(false);
            setForm(emptyForm);
            setNotice(`Staff account created for ${form.email.trim()}.`);
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
            <AdminHeading title="Staff accounts" detail="Create staff sign-in credentials and manage access for active or former staff.">
                <AdminButton onClick={() => { setError(""); setForm(emptyForm); setFormOpen(true); }}>Add staff</AdminButton>
            </AdminHeading>
            <AdminNotice error>{error}</AdminNotice>
            {preview ? <AdminNotice>Staff account management is available in the connected administrator workspace.</AdminNotice> : loading ? <div className="staff-loading" role="status">Loading staff accounts…</div> : <AdminTable label="Staff accounts" columns={[{ label: "Staff member", width: 24 }, { label: "Email", width: 30 }, { label: "Status", width: 14 }, { label: "Added", width: 16 }, { label: "Access", width: 16 }]} empty={!staff.length && "No staff accounts have been added yet."}>
                {staff.map(person => {
                    const id = String(person._id || person.id);
                    return <tr key={id}>
                        <td><strong>{person.name}</strong></td>
                        <td>{person.email}</td>
                        <td><AdminStatus>{person.isActive ? "Active" : "Inactive"}</AdminStatus></td>
                        <td>{formatTimestamp(person.createdAt)}</td>
                        <td><AdminButton variant={person.isActive ? "danger" : "secondary"} disabled={actionId === id} onClick={() => setStaffActive(person)}>{actionId === id ? "Updating…" : person.isActive ? "Deactivate" : "Activate"}</AdminButton></td>
                    </tr>;
                })}
            </AdminTable>}
            <p className="admin-staff-note">Passwords are hashed before they are stored. Deactivated staff cannot sign in or continue using an existing staff session.</p>
        </AdminPanel>
        {formOpen && <AdminDialog title="Add staff account" onClose={() => { if (!saving) setFormOpen(false); }}>
            <form className="staff-form-stack" onSubmit={createStaff}>
                <p>Create credentials for the staff member. They can sign in at the Staff / Admin sign-in page.</p>
                <AdminNotice error>{error}</AdminNotice>
                <AdminField label="Full name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} autoComplete="name" required maxLength={100} disabled={saving} />
                <AdminField label="Email address" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} autoComplete="email" required maxLength={254} disabled={saving} />
                <div className="staff-details-grid">
                    <AdminField label="Password" type="password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength={6} required disabled={saving} />
                    <AdminField label="Confirm password" type="password" value={form.confirmPassword} onChange={event => setForm(current => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength={6} required disabled={saving} />
                </div>
                <div className="admin-desktop-editor-actions"><AdminButton type="submit" disabled={saving}>{saving ? "Creating…" : "Create staff account"}</AdminButton><AdminButton type="button" variant="secondary" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</AdminButton></div>
            </form>
        </AdminDialog>}
    </div>;
}
