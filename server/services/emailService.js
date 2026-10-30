const gmailOAuthService = require("./gmailOAuthService");

const sendEmail = async ({ to, subject, text, html }) => {
    if (await gmailOAuthService.isConfigured()) {
        try {
            return await gmailOAuthService.sendEmail({ to, subject, text, html });
        } catch (error) {
            console.error("Gmail email delivery failed:", error.message);
            return { sent: false, reason: "EMAIL_SEND_FAILED" };
        }
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: [to], subject, text, html })
        });
        if (!response.ok) {
            console.error("Resend email provider error:", response.status, await response.text());
            return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
        }
        return { sent: true };
    } catch (error) {
        console.error("Email delivery error:", error.message);
        return { sent: false, reason: "EMAIL_SEND_FAILED" };
    }
};

const isEmailConfigured = async () =>
    (await gmailOAuthService.isConfigured()) || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const sendCancellationEmail = async ({
    to,
    passengerName,
    bookingReference,
    cancellationReason
}) => {
    if (!to) {
        console.warn(
            "Cancellation email skipped: passenger email is unavailable."
        );

        return {
            sent: false,
            reason: "EMAIL_ADDRESS_MISSING"
        };
    }

    const greeting = `Hello ${passengerName || "Passenger"},`;
    const text = [
        greeting, "", "We regret to inform you that your GuimarasGo booking has been cancelled by the administrator.",
        "", `Booking reference: ${bookingReference || "Unavailable"}`,
        `Cancellation reason: ${cancellationReason}`, "",
        "Please contact GuimarasGo support if you need further assistance."
    ].join("\n");
    return sendEmail({
        to,
        subject: `GuimarasGo booking ${bookingReference} cancelled`,
        text
    });
};

const sendPasswordResetEmail = async ({ to, passengerName, resetUrl }) => {
    const safeName = String(passengerName || "Passenger").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);

    const text = [
        `Hello ${passengerName || "Passenger"},`, "",
        "We received a request to reset your GuimarasGo password.",
        "Use this secure link within 30 minutes to choose a new password:",
        resetUrl, "", "If you did not request a password reset, you can ignore this email."
    ].join("\n");
    const safeUrl = String(resetUrl).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return sendEmail({
        to,
        subject: "Reset your GuimarasGo password",
        text,
        html: `<p>Hello ${safeName},</p><p>We received a request to reset your GuimarasGo password.</p><p><a href="${safeUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`
    });
};

module.exports = {
    sendCancellationEmail,
    sendPasswordResetEmail,
    isEmailConfigured
};
