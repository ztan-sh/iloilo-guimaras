const createRateLimiter = ({ windowMs, max, message = "Too many requests. Please try again later.", keyGenerator } = {}) => {
    const entries = new Map();
    let lastPrune = 0;

    return (req, res, next) => {
        const now = Date.now();
        if (now - lastPrune > Math.min(windowMs, 60_000)) {
            for (const [key, entry] of entries) {
                if (entry.resetAt <= now) entries.delete(key);
            }
            lastPrune = now;
        }

        const identity = keyGenerator
            ? keyGenerator(req)
            : req.ip || req.socket?.remoteAddress || "unknown";
        const key = String(identity || "unknown");
        let entry = entries.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            entries.set(key, entry);
        }

        entry.count += 1;
        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
        res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count > max) {
            res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
            return res.status(429).json({ success: false, message });
        }

        return next();
    };
};

module.exports = createRateLimiter;
