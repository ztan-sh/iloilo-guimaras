const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const EmailProviderConfig = require("../models/EmailProviderConfig");

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

const requiredOAuthEnvironment = () => ({
    clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_OAUTH_REDIRECT_URI,
    senderEmail: process.env.GMAIL_SENDER_EMAIL?.trim().toLowerCase(),
    stateSecret: process.env.GMAIL_OAUTH_STATE_SECRET,
    encryptionKey: process.env.GMAIL_TOKEN_ENCRYPTION_KEY
});

const validateOAuthEnvironment = () => {
    const env = requiredOAuthEnvironment();
    const missing = Object.entries(env)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length) {
        const error = new Error(`Missing Gmail OAuth server settings: ${missing.join(", ")}`);
        error.code = "GMAIL_OAUTH_NOT_CONFIGURED";
        throw error;
    }

    const key = Buffer.from(env.encryptionKey, "base64");
    if (key.length !== 32) {
        const error = new Error("GMAIL_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
        error.code = "GMAIL_OAUTH_NOT_CONFIGURED";
        throw error;
    }

    let redirect;
    try {
        redirect = new URL(env.redirectUri);
    } catch {
        throw new Error("GMAIL_OAUTH_REDIRECT_URI must be a valid HTTPS URL.");
    }
    if (redirect.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(redirect.hostname)) {
        throw new Error("GMAIL_OAUTH_REDIRECT_URI must use HTTPS outside local development.");
    }

    return { ...env, key };
};

const encryptRefreshToken = (refreshToken, key) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map(part => part.toString("base64url")).join(".");
};

const decryptRefreshToken = (value, key) => {
    const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");
    if (!ivValue || !tagValue || !encryptedValue) throw new Error("Stored Gmail token is malformed.");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, "base64url")),
        decipher.final()
    ]).toString("utf8");
};

const createAuthorizationUrl = (adminId) => {
    const env = validateOAuthEnvironment();
    const state = jwt.sign(
        { purpose: "gmail-mailbox-connection", adminId: String(adminId) },
        env.stateSecret,
        { expiresIn: "10m", audience: "gmail-oauth-callback" }
    );
    const url = new URL(GOOGLE_OAUTH_BASE);
    url.search = new URLSearchParams({
        client_id: env.clientId,
        redirect_uri: env.redirectUri,
        response_type: "code",
        scope: `openid email ${GMAIL_SEND_SCOPE}`,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        login_hint: env.senderEmail,
        state
    }).toString();
    return url.toString();
};

const exchangeCodeAndConnect = async (code, state) => {
    const env = validateOAuthEnvironment();
    const claims = jwt.verify(state, env.stateSecret, { audience: "gmail-oauth-callback" });
    if (claims.purpose !== "gmail-mailbox-connection" || !claims.adminId) {
        throw new Error("Invalid Gmail connection state.");
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: env.clientId,
            client_secret: env.clientSecret,
            redirect_uri: env.redirectUri,
            grant_type: "authorization_code"
        })
    });
    const tokenBody = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenBody.refresh_token || !tokenBody.id_token) {
        console.error("Google OAuth code exchange failed:", tokenBody.error || tokenResponse.status);
        throw new Error("Google did not return a refresh token. Reconnect and approve the requested access.");
    }

    const identityResponse = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(tokenBody.id_token)}`);
    const identity = await identityResponse.json().catch(() => ({}));
    if (!identityResponse.ok || identity.aud !== env.clientId || identity.email_verified !== "true" ||
        String(identity.email || "").toLowerCase() !== env.senderEmail) {
        throw new Error(`Authorize the Google account configured as GMAIL_SENDER_EMAIL (${env.senderEmail}).`);
    }

    const encryptedRefreshToken = encryptRefreshToken(tokenBody.refresh_token, env.key);
    await EmailProviderConfig.findOneAndUpdate(
        { provider: "gmail-oauth" },
        {
            $set: {
                senderEmail: env.senderEmail,
                encryptedRefreshToken,
                connectedAt: new Date(),
                connectedBy: String(claims.adminId)
            }
        },
        { upsert: true, new: true, runValidators: true }
    );
    return env.senderEmail;
};

const getConnectedConfig = async () => {
    const env = validateOAuthEnvironment();
    const config = await EmailProviderConfig.findOne({ provider: "gmail-oauth" })
        .select("+encryptedRefreshToken");
    if (!config || config.senderEmail !== env.senderEmail) return null;
    return { config, env };
};

const isConfigured = async () => {
    try {
        return Boolean(await getConnectedConfig());
    } catch {
        return false;
    }
};

const getStatus = async () => {
    const env = requiredOAuthEnvironment();
    let configured = false;
    try {
        validateOAuthEnvironment();
        configured = true;
    } catch {
        configured = false;
    }
    const connected = await isConfigured();
    return {
        configured,
        connected,
        senderEmail: env.senderEmail || null
    };
};

const getAccessToken = async (env, refreshToken) => {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env.clientId,
            client_secret: env.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token"
        })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
        console.error("Gmail access-token refresh failed:", body.error || response.status);
        throw new Error("Gmail authorization expired or was revoked. Reconnect the sender account.");
    }
    return body.access_token;
};

const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;

const sendEmail = async ({ to, subject, text, html }) => {
    const connected = await getConnectedConfig();
    if (!connected) {
        const error = new Error("Gmail sender is not connected.");
        error.code = "GMAIL_NOT_CONNECTED";
        throw error;
    }

    const { config, env } = connected;
    const refreshToken = decryptRefreshToken(config.encryptedRefreshToken, env.key);
    const accessToken = await getAccessToken(env, refreshToken);
    const boundary = `gg-${crypto.randomBytes(12).toString("hex")}`;
    const safeTo = String(to || "").replace(/[\r\n]/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTo)) throw new Error("Recipient email is invalid.");
    const rawMessage = [
        `From: GuimarasGo <${env.senderEmail}>`,
        `To: ${safeTo}`,
        `Subject: ${encodeHeader(subject)}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(String(text || ""), "utf8").toString("base64"),
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(String(html || text || ""), "utf8").toString("base64"),
        `--${boundary}--`,
        ""
    ].join("\r\n");
    const raw = Buffer.from(rawMessage, "utf8").toString("base64url");
    const response = await fetch(GMAIL_SEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw })
    });
    if (!response.ok) {
        const details = await response.text();
        console.error("Gmail send error:", response.status, details);
        throw new Error("Gmail could not send the email. Check sender authorization and Gmail API status.");
    }
    return { sent: true };
};

module.exports = {
    createAuthorizationUrl,
    exchangeCodeAndConnect,
    getStatus,
    isConfigured,
    sendEmail
};
