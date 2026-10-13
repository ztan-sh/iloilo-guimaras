
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

module.exports = {
    sendCancellationEmail
};
