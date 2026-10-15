const sendCancellationEmail = async ({
    to,
    passengerName,
    bookingReference,
    cancellationReason
}) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        console.warn(
            "Cancellation email skipped: RESEND_API_KEY or EMAIL_FROM is not configured."
        );

        return {
            sent: false,
            reason: "EMAIL_NOT_CONFIGURED"
        };
    }

    if (!to) {
        console.warn(
            "Cancellation email skipped: passenger email is unavailable."
        );

        return {
            sent: false,
            reason: "EMAIL_ADDRESS_MISSING"
        };
    }

    try {
        const response = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from,
                    to: [to],
                    subject: `GuimarasGo booking ${bookingReference} cancelled`,
                    text: [
                        `Hello ${passengerName || "Passenger"},`,
                        "",
                        "We regret to inform you that your GuimarasGo booking has been cancelled by the administrator.",
                        "",
                        `Booking reference: ${bookingReference || "Unavailable"}`,
                        `Cancellation reason: ${cancellationReason}`,
                        "",
                        "Please contact GuimarasGo support if you need further assistance."
                    ].join("\n")
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "Cancellation email provider error:",
                response.status,
                errorText
            );

            return {
                sent: false,
                reason: "EMAIL_PROVIDER_ERROR"
            };
        }

        return {
            sent: true
        };
    } catch (error) {
        console.error(
            "Cancellation email error:",
            error.message
        );

        return {
            sent: false,
            reason: "EMAIL_SEND_FAILED"
        };
    }
};

const sendPasswordResetEmail = async ({ to, passengerName, resetUrl }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
    }

    const safeName = String(passengerName || "Passenger").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject: "Reset your GuimarasGo password",
                text: [
                    `Hello ${passengerName || "Passenger"},`,
                    "",
                    "We received a request to reset your GuimarasGo password.",
                    "Use this secure link within 30 minutes to choose a new password:",
                    resetUrl,
                    "",
                    "If you did not request a password reset, you can ignore this email."
                ].join("\n"),
                html: `<p>Hello ${safeName},</p><p>We received a request to reset your GuimarasGo password.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`
            })
        });

        if (!response.ok) {
            console.error("Password reset email provider error:", response.status, await response.text());
            return { sent: false, reason: "EMAIL_PROVIDER_ERROR" };
        }

        return { sent: true };
    } catch (error) {
        console.error("Password reset email error:", error.message);
        return { sent: false, reason: "EMAIL_SEND_FAILED" };
    }
};

module.exports = {
    sendCancellationEmail,
    sendPasswordResetEmail
};
