import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function useTicketScanner(onDecoded) {
    const resource = useRef(null);
    const callback = useRef(onDecoded);
    const mounted = useRef(true);
    const [scanning, setScanning] = useState(false);
    const [starting, setStarting] = useState(false);
    const [cameraError, setCameraError] = useState("");
    callback.current = onDecoded;

    const release = async current => {
        if (!current) return;
        current.cancelled = true;
        try {
            await current.started;
            if (current.scanner.isScanning) await current.scanner.stop();
            current.scanner.clear();
        } catch { /* A failed camera start has no active stream to stop. */ }
    };

    const stop = async () => {
        const current = resource.current;
        resource.current = null;
        await release(current);
        if (mounted.current) { setScanning(false); setStarting(false); }
    };

    const start = async () => {
        if (resource.current) return;
        setCameraError("");
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera access requires a supported browser and HTTPS. You can look up the ticket ID instead.");
            return;
        }
        setStarting(true);
        const current = {
            scanner: new Html5Qrcode("staff-qr-reader", {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                useBarCodeDetectorIfSupported: true
            }),
            cancelled: false,
            decoded: false
        };
        resource.current = current;
        try {
            current.started = current.scanner.start({ facingMode: "environment" }, {
                fps: 30,
                videoConstraints: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                qrbox: (width, height) => {
                    // Leave room for the QR code quiet zone, even when it nearly fills the guide.
                    // Cropping that border can prevent decoding.
                    const size = Math.floor(Math.min(width, height) * 0.98);
                    return { width: size, height: size };
                }
            }, decoded => {
                if (current.cancelled || current.decoded) return;
                current.decoded = true;
                callback.current(decoded);
            }, () => {});
            await current.started;
            if (current.cancelled || !mounted.current) return;
            setScanning(true);
            setStarting(false);
            try {
                const capabilities = current.scanner.getRunningTrackCapabilities();
                if (capabilities?.focusMode?.includes("continuous")) await current.scanner.applyVideoConstraints({ focusMode: "continuous" });
            } catch { /* Continuous focus is optional on supported cameras. */ }
        } catch (error) {
            if (resource.current === current) resource.current = null;
            if (mounted.current && !current.cancelled) {
                setStarting(false); setScanning(false);
                setCameraError(error?.name === "NotAllowedError"
                    ? "Camera permission was denied. Allow camera access, or look up the ticket ID."
                    : "Unable to start the camera. Check your camera connection, or look up the ticket ID.");
            }
            try { current.scanner.clear(); } catch { /* No scanner surface was created. */ }
        }
    };

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; const current = resource.current; resource.current = null; void release(current); };
    }, []);

    return { start, stop, scanning, starting, cameraError };
}
