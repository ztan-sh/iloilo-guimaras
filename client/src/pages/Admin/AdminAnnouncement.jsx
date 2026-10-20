import React, { useState } from "react";
import { AdminButton, AdminField, AdminHeading, AdminNotice, AdminPanel } from "../../components/admin/AdminUI";

export default function AdminAnnouncement({ api, preview = false }) {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState(false);

    const send = async event => {
        event.preventDefault();
        if (sending || preview) return;
        setSending(true);
        setNotice("");
        setError(false);
        try {
            const result = await api.post("/admin/notifications/announcements", { title: title.trim(), message: message.trim() });
            setNotice(result.data?.message || "Announcement delivered.");
            setTitle("");
            setMessage("");
        } catch (requestError) {
            setError(true);
            setNotice(requestError.response?.data?.message || "Unable to send the announcement.");
        } finally {
            setSending(false);
        }
    };

    return <AdminPanel>
        <AdminHeading title="Send a passenger announcement" detail="Write an in-app message and send it to all registered passenger accounts." />
        {notice && <AdminNotice error={error}>{notice}</AdminNotice>}
        {preview ? <AdminNotice>Announcements are disabled in the sample workspace.</AdminNotice> : <form className="staff-form-stack" onSubmit={send}>
            <AdminField label="Title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required disabled={sending} />
            <label className="staff-field"><span>Message</span><textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={1200} rows={4} required disabled={sending} /></label>
            <AdminButton type="submit" disabled={sending}>{sending ? "Sending to passengers…" : "Send announcement"}</AdminButton>
        </form>}
    </AdminPanel>;
}
