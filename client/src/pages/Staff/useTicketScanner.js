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
                // Prefer the bundled decoder: native BarcodeDetector behavior
                // varies between browsers and can miss screen-displayed codes.
                useBarCodeDetectorIfSupported: false
            }),
            cancelled: false,
            decoded: false
        };
        resource.current = current;
        try {
            current.started = current.scanner.start({ facingMode: "environment" }, {
                fps: 20,
                videoConstraints: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                qrbox: (width, height) => {
                    // Use nearly the full camera frame so the code can be
                    // recognized even when staff cannot center it precisely.
                    // Retain a small border for the QR quiet zone.
                    return {
                        width: Math.floor(width * 0.96),
                        height: Math.floor(height * 0.96)
                    };
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
                const advanced = {};
                for (const mode of ["focusMode", "exposureMode", "whiteBalanceMode"]) {
                    if (capabilities?.[mode]?.includes("continuous")) advanced[mode] = "continuous";
                }
                // Modest optical zoom helps fill the frame with a ticket QR on
                // cameras that support it, without forcing unsupported settings.
                if (capabilities?.zoom && capabilities.zoom.max >= 1.25 && capabilities.zoom.min <= 1.25) advanced.zoom = 1.25;
                if (Object.keys(advanced).length) {
                    await current.scanner.applyVideoConstraints({ advanced: [advanced] });
                }
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
