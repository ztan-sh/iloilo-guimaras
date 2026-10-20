import React, { useEffect, useState } from "react";

const SecurePaymentProof = ({ url, className = "", alt = "Payment receipt" }) => {
    const [src, setSrc] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!url) return undefined;
        if (url.startsWith("data:image/")) {
            setSrc(url);
            setFailed(false);
            return undefined;
        }
        let objectUrl = "";
        let cancelled = false;
        const token = localStorage.getItem("adminToken") || "";
        fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
            .then(response => {
                if (!response.ok) throw new Error("Receipt unavailable");
                const contentType = response.headers.get("content-type") || "";
                if (!/^image\/(png|jpeg)$/i.test(contentType)) throw new Error("Invalid receipt image");
                return response.blob();
            })
            .then(blob => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
                setFailed(false);
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url]);

    if (failed) return <div className={`${className} no-proof`}>Receipt unavailable. Refresh and try again.</div>;
    return src ? <img src={src} alt={alt} className={className} /> : <div className={`${className} no-proof`}>Loading receipt…</div>;
};

export default SecurePaymentProof;
