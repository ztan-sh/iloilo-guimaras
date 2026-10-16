const AuditLog = require("../models/AuditLog");

const recordActivity = async ({ req, actorRole, actorId = "", actorName, actorEmail = "", action, summary, entityType = "system", entityId = "", subject = "", details = {} }) => {
    try {
        await AuditLog.create({
            actorRole,
            actorId: String(actorId || ""),
            actorName: String(actorName || (actorRole === "admin" ? "Administrator" : "Staff member")).slice(0, 120),
            actorEmail: String(actorEmail || "").slice(0, 254),
            action: String(action || "Activity").slice(0, 100),
            summary: String(summary || action || "Activity").slice(0, 500),
            entityType: String(entityType || "system").slice(0, 80),
            entityId: String(entityId || "").slice(0, 160),
            subject: String(subject || "").slice(0, 240),
            ipAddress: String(req?.ip || req?.socket?.remoteAddress || "").slice(0, 100),
            userAgent: String(req?.headers?.["user-agent"] || "").slice(0, 500),
            details
        });
    } catch (error) {
        // Audit failures must not prevent the user action from completing.
        console.error("Activity audit write error:", error.message);
    }
};

const safeRequestDetails = req => {
    const body = req.body || {};
    const source = {
        date: body.date || req.query?.date,
        travelDate: body.travelDate,
        vesselName: body.vesselName,
        ferryName: body.ferryName,
        route: body.route,
        departureTime: body.departureTime,
        bookingReference: body.bookingReference,
        tripId: body.tripId,
        email: body.email,
        name: body.name || body.fullName
    };
    return Object.fromEntries(Object.entries(source).filter(([, value]) => typeof value === "string" && value.length).map(([key, value]) => [key, value.slice(0, 160)]));
};

const describeRequest = (req, actorRole) => {
    const method = String(req.method || "").toUpperCase();
    const path = String(req.originalUrl || req.path || "").split("?")[0].toLowerCase();
    if (actorRole === "staff") {
        if (path.includes("/walk-in")) return { action: "Created walk-in ticket", entityType: "ticket" };
        if (path.endsWith("/board")) return { action: "Updated ticket boarding", entityType: "ticket" };
        if (path.endsWith("/timeout")) return { action: "Confirmed passenger arrival", entityType: "ticket" };
        if (path.endsWith("/reject")) return { action: "Rejected ticket for boarding", entityType: "ticket" };
    }
    if (path.includes("/schedules/bulk")) return { action: "Generated ferry schedules", entityType: "ferry schedule" };
    if (path.includes("/schedules")) {
        if (method === "POST") return { action: "Added ferry trip", entityType: "ferry schedule" };
        if (method === "PUT") return { action: "Updated ferry trip", entityType: "ferry schedule" };
        if (method === "DELETE" && /\/schedules(?:\?|$)/.test(path)) return { action: "Reset ferry schedules", entityType: "ferry schedule" };
        if (method === "DELETE") return { action: "Removed ferry trip", entityType: "ferry schedule" };
    }
    if (path.includes("/staff")) {
        if (path.endsWith("/deactivate")) return { action: "Deactivated staff account", entityType: "staff account" };
        if (path.endsWith("/activate")) return { action: "Activated staff account", entityType: "staff account" };
        if (method === "POST") return { action: "Created staff account", entityType: "staff account" };
        if (method === "DELETE") return { action: "Deleted staff account", entityType: "staff account" };
        if (method === "PUT") return { action: "Updated staff account", entityType: "staff account" };
    }
    if (path.includes("/pricing")) return { action: "Updated vessel pricing", entityType: "vessel pricing" };
    if (path.includes("/ferry-closures")) return { action: "Changed ferry availability", entityType: "ferry availability" };
    if (path.endsWith("/cancel")) return { action: "Cancelled booking", entityType: "booking" };
    if (path.includes("/booking") || path.includes("/payment")) return { action: "Updated booking or payment", entityType: "booking/payment" };
    return { action: `${method || "Updated"} ${path.split("/").filter(Boolean).slice(-2).join(" ") || "system record"}`.slice(0, 100), entityType: "system" };
};

const attachMutationAudit = (req, res, actorRole, actor) => {
    if (["GET", "HEAD", "OPTIONS"].includes(String(req.method).toUpperCase())) return;
    res.once("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300 || req.auditLogged) return;
        const { action, entityType } = describeRequest(req, actorRole);
        const details = safeRequestDetails(req);
        const entityId = String(req.params?.id || details.tripId || "");
        const entityName = details.bookingReference || details.vesselName || details.ferryName || details.name || details.email || entityId;
        void recordActivity({
            req, actorRole, actorId: actor?.id || actor?.staffId || actor?._id,
            actorName: actor?.fullName || actor?.name, actorEmail: actor?.email,
            action,
            summary: entityName ? `${action}: ${entityName}` : action,
            entityType, entityId, subject: entityName, details
        });
    });
};

module.exports = { recordActivity, safeRequestDetails, attachMutationAudit };
