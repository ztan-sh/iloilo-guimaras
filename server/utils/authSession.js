const cookieNames = {
    user: "ggo_user_session",
    admin: "ggo_admin_session",
    staff: "ggo_staff_session"
};

const isNativeClient = req => String(req.get?.("x-client-platform") || "").toLowerCase() === "native";

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
});

const issueSession = (req, res, token, role) => {
    if (isNativeClient(req)) return { token };
    res.cookie(cookieNames[role], token, cookieOptions());
    return {};
};

const clearSession = (res, role) => {
    const { maxAge, ...options } = cookieOptions();
    res.clearCookie(cookieNames[role], options);
};

const readCookie = (req, name) => {
    const raw = req.headers.cookie || "";
    for (const item of raw.split(";")) {
        const separator = item.indexOf("=");
        if (separator < 0 || item.slice(0, separator).trim() !== name) continue;
        try { return decodeURIComponent(item.slice(separator + 1).trim()); } catch { return ""; }
    }
    return "";
};

const assertCookieMutationOrigin = req => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
    const origin = req.get?.("origin") || "";
    const allowed = new Set([
        "https://iloilo-guimaras.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost",
        "https://localhost",
        ...(process.env.WEB_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean)
    ]);
    return Boolean(origin && allowed.has(origin));
};

module.exports = { cookieNames, isNativeClient, issueSession, clearSession, readCookie, assertCookieMutationOrigin };
