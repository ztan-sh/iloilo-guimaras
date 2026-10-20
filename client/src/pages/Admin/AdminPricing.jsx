
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    StaffButton,
    StaffDialog,
    StaffNotice,
    StaffPanel
} from "../../components/staff/StaffUI";
import {
    OperationsPanel,
    PencilField,
    VesselSelector
} from "../../components/operations/OperationsUI";
import {
    DEFAULT_PRICES,
    VESSELS,
    operationsStore,
    pricingIssue
} from "../../components/operations/operationsStore";
import { useOperations } from "../../components/operations/useOperations";
import { useAdminFlow } from "./AdminPreview";
import { money } from "../Staff/staffUtils";

const rides = [
    ["solo", "Solo", "1 passenger · No motorcycle"],
    ["motorcycle", "Small bike (250cc and below)", "Base fare ₱285 · stamp fee ₱5"],
    ["bigBike", "Big bike (above 250cc)", "Base fare ₱353 · stamp fee ₱7"],
    ["companion", "With a companion", "2 passengers · No motorcycle"]
];

const categories = ["Student", "PWD", "Senior"];

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const API_URL = (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredApiUrl)
    ? "https://iloilo-guimaras.onrender.com/api"
    : configuredApiUrl || "https://iloilo-guimaras.onrender.com/api").replace(/\/+$/, "");

async function pricingRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        signal: options.signal || controller.signal,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    }).finally(() => window.clearTimeout(timeoutId));

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : {};

    if (!response.ok) {
        throw new Error(
            data.message || `Pricing request failed (${response.status}).`
        );
    }

    return data;
}

export default function AdminPricing() {
    const { preview } = useAdminFlow();
    const ops = useOperations(preview);
    const [params, setParams] = useSearchParams();

    const initialVessel = VESSELS.includes(params.get("vessel"))
        ? params.get("vessel")
        : "MV Halili";

    const [vessel, setVessel] = useState(initialVessel);
    const [livePrices, setLivePrices] = useState({});
    const [liveLoaded, setLiveLoaded] = useState(false);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [savingPrices, setSavingPrices] = useState(false);
    const [draft, setDraft] = useState(() => ({
        ...(ops.prices[initialVessel] || DEFAULT_PRICES)
    }));
    const [review, setReview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [switchTo, setSwitchTo] = useState("");

    const current = preview
        ? ops.prices[vessel] || DEFAULT_PRICES
        : livePrices[vessel] || DEFAULT_PRICES;

    const dirty = JSON.stringify(draft) !== JSON.stringify(current);

    useEffect(() => {
        if (preview) {
            setLiveLoaded(false);
            return;
        }

        let cancelled = false;

        async function loadPrices() {
            setLoadingPrices(true);
            setLiveLoaded(false);
            setError("");

            try {
                const data = await pricingRequest("/pricing");

                if (cancelled) return;

                const prices = data.prices || {};

                const normalized = Object.fromEntries(
                    VESSELS.map(name => [
                        name,
                        { ...DEFAULT_PRICES, ...(prices[name] || {}) }
                    ])
                );

                setLivePrices(normalized);
                setDraft({ ...normalized[vessel] });
                setLiveLoaded(true);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load saved vessel prices.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingPrices(false);
                }
            }
        }

        loadPrices();

        return () => {
            cancelled = true;
        };
    }, [preview]);

    const select = name => {
        setVessel(name);
        setParams({ vessel: name }, { replace: true });

        const prices = preview
            ? ops.prices[name] || DEFAULT_PRICES
            : livePrices[name] || DEFAULT_PRICES;

        setDraft({ ...prices });
        setSaved(false);
        setError("");
        setSwitchTo("");
    };

    const change = (key, raw) => {
        const value = raw === "" ? "" : Number(raw);

        setSaved(false);
        setError("");

        setDraft(prices => {
            if (key === "solo" || key === "companion") {
                const solo = key === "companion" ? value / 2 : value;
                const surcharge =
                    Number(prices.motorcycle) - Number(prices.solo);

                return {
                    ...prices,
                    solo,
                    companion: solo * 2,
                    motorcycle: solo + surcharge
                };
            }

            return { ...prices, [key]: value };
        });
    };

    const save = async () => {
        const issue = pricingIssue(draft);

        if (issue) {
            setError(issue);
            setReview(false);
            return;
        }

        if (!preview && !liveLoaded) {
            setError("Saved prices must load successfully before updating them.");
            setReview(false);
            return;
        }

        setSavingPrices(true);
        setError("");

        try {
            if (preview) {
                operationsStore.savePrices(vessel, draft);
                setSaved(true);
                setReview(false);
                return;
            }

            const data = await pricingRequest(
                `/pricing/${encodeURIComponent(vessel)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(draft)
                }
            );

            const savedPrices = {
                ...DEFAULT_PRICES,
                ...(data.prices || draft)
            };

            setLivePrices(previous => ({
                ...previous,
                [vessel]: savedPrices
            }));

            setDraft({ ...savedPrices });
            setSaved(true);
            setReview(false);
        } catch (err) {
            setError(err.message || "Unable to save vessel pricing.");
            setReview(false);
        } finally {
            setSavingPrices(false);
        }
    };

    const cancelChanges = () => {
        setDraft({ ...current });
        setSaved(false);
        setError("");
    };

    return (
        <>
            {!preview && (
                <StaffNotice>
                    {loadingPrices
                        ? "Loading saved vessel prices..."
                        : liveLoaded
                            ? "Live pricing is connected. Saved prices are stored in the backend and fetched by passenger booking and checkout for new bookings."
                            : "Unable to confirm saved pricing. Check your server connection and administrator session."}
                </StaffNotice>
            )}

            <div className="operations-vessel-tray">
                <strong>Choose a vessel</strong>

                <VesselSelector
                    value={vessel}
                    onChange={name =>
                        dirty ? setSwitchTo(name) : select(name)
                    }
                />

                <small>
                    {saved
                        ? `${vessel} prices saved successfully.`
                        : "Changes remain a draft until you review and save."}
                </small>
            </div>

            {error && (
                <StaffNotice error>
                    {error}
                </StaffNotice>
            )}

            <div className="operations-pricing-grid">
                <div className="operations-stack">
                    <StaffPanel>
                        <h2>{vessel} ride fares</h2>

                        <p>
                            Set vessel fares. Additional passengers use the
                            solo fare; maximum 3 with a motorcycle or 10 without.
                        </p>

                        {rides.map(([key, title, detail]) => (
                            <div className="operations-price-row" key={key}>
                                <div>
                                    <strong>{title}</strong>
                                    <p>{detail}</p>
                                </div>

                                <PencilField
                                    label={`${title} fare (₱)`}
                                    type="number"
                                    step="0.01"
                                    min={key === "motorcycle"
                                        ? Number(draft.solo) || 0.01
                                        : 0.01}
                                    value={draft[key]}
                                    onChange={e =>
                                        change(key, e.target.value)
                                    }
                                    disabled={
                                        loadingPrices ||
                                        savingPrices ||
                                        (!preview && !liveLoaded)
                                    }
                                />
                            </div>
                        ))}

                        <div className="operations-price-row">
                            <div><strong>Small-bike stamp fee</strong><p>250cc and below · Added separately at checkout</p></div>
                            <PencilField label="Small-bike stamp fee (₱)" type="number" min="0" step="0.01" value={draft.smallBikeStamp} onChange={e => change("smallBikeStamp", e.target.value)} disabled={loadingPrices || savingPrices || (!preview && !liveLoaded)} />
                        </div>
                        <div className="operations-price-row">
                            <div><strong>Big-bike stamp fee</strong><p>Above 250cc · Added separately at checkout</p></div>
                            <PencilField label="Big-bike stamp fee (₱)" type="number" min="0" step="0.01" value={draft.bigBikeStamp} onChange={e => change("bigBikeStamp", e.target.value)} disabled={loadingPrices || savingPrices || (!preview && !liveLoaded)} />
                        </div>

                        <small>
                            The companion fare follows two solo fares.
                            Editing either passenger fare keeps both consistent;
                            the motorcycle surcharge stays separate.
                        </small>
                    </StaffPanel>

                    <StaffPanel>
                        <h2>Passenger discounts</h2>

                        <p>
                            Apply one approved discount per passenger.
                            Motorcycle base fares and stamp fees are charged separately; the PPA fee stays at its regular amount.
                        </p>

                        <div className="operations-discount-fields">
                            {categories.map(category => (
                                <PencilField
                                    key={category}
                                    label={`${category} (%)`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={draft[category.toLowerCase()]}
                                    onChange={e =>
                                        change(
                                            category.toLowerCase(),
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        loadingPrices ||
                                        savingPrices ||
                                        (!preview && !liveLoaded)
                                    }
                                />
                            ))}
                        </div>

                        <p>
                            Student, PWD and passengers aged 60+ require an
                            individual ID photo and staff approval.
                            Discounts never stack.
                        </p>
                    </StaffPanel>

                    <StaffPanel>
                        <h2>Port fee</h2>

                        <PencilField
                            label="PPA fee per booking (₱)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.ppa}
                            onChange={e => change("ppa", e.target.value)}
                            disabled={
                                loadingPrices ||
                                savingPrices ||
                                (!preview && !liveLoaded)
                            }
                        />

                        <small>
                            This fee is added at checkout and is excluded
                            from passenger discounts.
                        </small>
                    </StaffPanel>
                </div>

                <OperationsPanel>
                    <h2>{vessel} preview</h2>

                    <p>
                        Illustrates one approved Student passenger per ride.
                        Senior eligibility begins at age 60.
                    </p>

                    <table className="staff-table operations-fare-table">
                        <thead>
                            <tr>
                                <th>Ride</th>
                                <th>Regular</th>
                                <th>Discounted</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rides.map(([key, title]) => (
                                <tr key={key}>
                                    <td>{title}</td>
                                    <td>{money(draft[key])}</td>
                                    <td>
                                        {money(
                                            Number(draft[key]) -
                                            Number(draft.solo) *
                                            Number(draft.student) / 100
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p>
                        Discount = solo passenger fare × the approved
                        category percentage. Each companion needs their
                        own approval.
                    </p>

                    <p>
                        Maximum 3 passengers with a motorcycle or 10 without.
                    </p>

                    <div className="operations-inset">
                        <strong>
                            PPA fee · {money(draft.ppa)} per booking
                        </strong>
                        <p>
                            This configured fee is added at checkout and
                            is excluded from discounts.
                        </p>
                    </div>

                    <StaffNotice>
                        <strong>New bookings only</strong>
                        <p>
                            Saving affects new bookings for {vessel}.
                            Other vessels and already paid tickets keep
                            their recorded prices.
                        </p>
                    </StaffNotice>
                </OperationsPanel>
            </div>

            <div className="operations-footer">
                <p role="status">
                    {loadingPrices
                        ? "Loading saved prices..."
                        : saved
                            ? `${vessel} prices saved`
                            : dirty
                                ? "Unsaved price changes"
                                : "No unsaved changes"}
                </p>

                <div className="staff-actions">
                    <StaffButton
                        variant="secondary"
                        disabled={savingPrices || loadingPrices}
                        onClick={cancelChanges}
                    >
                        Cancel
                    </StaffButton>

                    <StaffButton
                        disabled={
                            !dirty ||
                            savingPrices ||
                            loadingPrices ||
                            (!preview && !liveLoaded)
                        }
                        onClick={() => {
                            const issue = pricingIssue(draft);

                            if (issue) {
                                setError(issue);
                            } else {
                                setError("");
                                setReview(true);
                            }
                        }}
                    >
                        Review changes
                    </StaffButton>
                </div>
            </div>

            {review && (
                <StaffDialog
                    title={`Save ${vessel} prices?`}
                    onClose={() => {
                        if (!savingPrices) setReview(false);
                    }}
                >
                    <p>
                        Review the new ride fares and approved passenger discounts.
                    </p>

                    <OperationsPanel>
                        {rides.map(([key, title]) => (
                            <div
                                className="operations-summary-line"
                                key={key}
                            >
                                <span>{title}</span>
                                <strong>{money(draft[key])}</strong>
                            </div>
                        ))}

                        <div className="operations-summary-line"><span>Small-bike stamp fee</span><strong>{money(draft.smallBikeStamp)}</strong></div>
                        <div className="operations-summary-line"><span>Big-bike stamp fee</span><strong>{money(draft.bigBikeStamp)}</strong></div>
                        {categories.map(category => (
                            <div
                                className="operations-summary-line"
                                key={category}
                            >
                                <span>{category}</span>
                                <strong>
                                    {draft[category.toLowerCase()]}%
                                </strong>
                            </div>
                        ))}

                        <div className="operations-summary-line">
                            <span>PPA fee</span>
                            <strong>{money(draft.ppa)}</strong>
                        </div>
                    </OperationsPanel>

                    <p>
                        Each eligible passenger needs a valid approved ID.
                        Motorcycle charges and PPA fees are excluded from discounts.
                    </p>

                    <StaffNotice>
                        Applies to new {vessel} bookings only. Existing paid
                        tickets retain their recorded amount.
                    </StaffNotice>

                    <div className="staff-actions">
                        <StaffButton
                            variant="secondary"
                            disabled={savingPrices}
                            onClick={() => setReview(false)}
                        >
                            Keep editing
                        </StaffButton>

                        <StaffButton
                            disabled={savingPrices}
                            onClick={save}
                        >
                            {savingPrices ? "Saving..." : "Save prices"}
                        </StaffButton>
                    </div>
                </StaffDialog>
            )}

            {switchTo && (
                <StaffDialog
                    title="Discard unsaved price changes?"
                    onClose={() => setSwitchTo("")}
                >
                    <p>
                        Your current {vessel} changes have not been saved.
                    </p>

                    <div className="staff-actions">
                        <StaffButton
                            variant="secondary"
                            onClick={() => setSwitchTo("")}
                        >
                            Keep editing
                        </StaffButton>

                        <StaffButton
                            onClick={() => select(switchTo)}
                        >
                            Discard and switch
                        </StaffButton>
                    </div>
                </StaffDialog>
            )}
        </>
    );
}
