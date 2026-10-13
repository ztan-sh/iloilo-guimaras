import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StaffButton, StaffDialog, StaffNotice, StaffPanel } from "../../components/staff/StaffUI";
import { OperationsPanel, PencilField, VesselSelector } from "../../components/operations/OperationsUI";
import { DEFAULT_PRICES, VESSELS, operationsStore, pricingIssue } from "../../components/operations/operationsStore";
import { useOperations } from "../../components/operations/useOperations";
import { useAdminFlow } from "./AdminPreview";
import { money } from "../Staff/staffUtils";

const rides = [["solo", "Solo", "1 passenger · No motorcycle"], ["motorcycle", "With motorcycle", "1 passenger · 1 motorcycle"], ["companion", "With a companion", "2 passengers · No motorcycle"]];
const categories = ["Student", "PWD", "Senior"];
export default function AdminPricing() {
    const { preview } = useAdminFlow();
    const ops = useOperations(preview);
    const [params, setParams] = useSearchParams();
    const initialVessel = VESSELS.includes(params.get("vessel")) ? params.get("vessel") : "MV Halili";
    const [vessel, setVessel] = useState(initialVessel);
    const [draft, setDraft] = useState(() => ({ ...(ops.prices[initialVessel] || DEFAULT_PRICES) }));
    const [review, setReview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [switchTo, setSwitchTo] = useState("");
    const current = ops.prices[vessel] || DEFAULT_PRICES;
    const dirty = JSON.stringify(draft) !== JSON.stringify(current);
    const select = name => { setVessel(name); setParams({ vessel: name }, { replace: true }); setDraft({ ...(ops.prices[name] || DEFAULT_PRICES) }); setSaved(false); setError(""); setSwitchTo(""); };
    const change = (key, raw) => {
        const value = raw === "" ? "" : Number(raw);
        setSaved(false); setError("");
        setDraft(prices => {
            if (key === "solo" || key === "companion") {
                const solo = key === "companion" ? value / 2 : value;
                const surcharge = Number(prices.motorcycle) - Number(prices.solo);
                return { ...prices, solo, companion: solo * 2, motorcycle: solo + surcharge };
            }
            return { ...prices, [key]: value };
        });
    };
    const save = () => {
        try { operationsStore.savePrices(vessel, draft); setSaved(true); setReview(false); }
        catch (err) { setError(err.message); setReview(false); }
    };
    return <>
        {!preview && <StaffNotice>Vessel pricing is available for testing in the frontend preview. Saving to the live service needs a pricing API; these are the app’s current fare defaults.</StaffNotice>}
        <div className="operations-vessel-tray"><strong>Choose a vessel</strong><VesselSelector value={vessel} onChange={name => dirty ? setSwitchTo(name) : select(name)} /><small>{saved ? `${vessel} prices saved in this preview.` : "Changes remain a draft until you review and save."}</small></div>
        <StaffNotice error>{error}</StaffNotice>
        <div className="operations-pricing-grid">
            <div className="operations-stack">
                <StaffPanel><h2>{vessel} ride fares</h2><p>Set vessel fares. Additional passengers use the solo fare; maximum 3 with a motorcycle or 10 without.</p>
                    {rides.map(([key, title, detail]) => <div className="operations-price-row" key={key}><div><strong>{title}</strong><p>{detail}</p></div><PencilField label={`${title} fare (₱)`} type="number" step="0.01" min={key === "motorcycle" ? draft.solo : 0.01} value={draft[key]} onChange={e => change(key, e.target.value)} disabled={!preview} /></div>)}
                    <small>The companion fare follows two solo fares. Editing either passenger fare keeps both consistent; the motorcycle surcharge stays separate.</small>
                </StaffPanel>
                <StaffPanel><h2>Passenger discounts</h2><p>Apply one approved discount per passenger. Motorcycle charges and the PPA fee stay at their regular amount.</p><div className="operations-discount-fields">{categories.map(category => <PencilField key={category} label={`${category} (%)`} type="number" min="0" max="100" step="0.01" value={draft[category.toLowerCase()]} onChange={e => change(category.toLowerCase(), e.target.value)} disabled={!preview} />)}</div><p>Student, PWD and passengers aged 60+ require an individual ID photo and staff approval. Discounts never stack.</p></StaffPanel>
            </div>
            <OperationsPanel><h2>{vessel} preview</h2><p>Illustrates one approved Student passenger per ride. Senior eligibility begins at age 60.</p>
                <table className="staff-table operations-fare-table"><thead><tr><th>Ride</th><th>Regular</th><th>Discounted</th></tr></thead><tbody>{rides.map(([key, title]) => <tr key={key}><td>{title}</td><td>{money(draft[key])}</td><td>{money(Number(draft[key]) - Number(draft.solo) * Number(draft.student) / 100)}</td></tr>)}</tbody></table>
                <p>Discount = solo passenger fare × the approved category percentage. Each companion needs their own approval.</p><p>Maximum 3 passengers with a motorcycle or 10 without.</p>
                <div className="operations-inset"><strong>PPA fee · {money(draft.ppa)} per booking</strong><p>This configured fee is added at checkout and is excluded from discounts.</p></div>
                <StaffNotice><strong>New bookings only</strong><p>Saving affects new bookings for {vessel}. Other vessels and already paid tickets keep their prices.</p></StaffNotice>
            </OperationsPanel>
        </div>
        <div className="operations-footer"><p role="status">{saved ? `${vessel} prices saved` : dirty ? "Unsaved price changes" : "No unsaved changes"}</p><div className="staff-actions"><StaffButton variant="secondary" onClick={() => { setDraft({ ...current }); setSaved(false); setError(""); }}>Cancel</StaffButton><StaffButton disabled={!preview || !dirty} onClick={() => { const issue = pricingIssue(draft); if (issue) setError(issue); else setReview(true); }}>Review changes</StaffButton></div></div>
        {review && <StaffDialog title={`Save ${vessel} prices?`} onClose={() => setReview(false)}><p>Review the new ride fares and approved passenger discounts.</p><OperationsPanel>{rides.map(([key, title]) => <div className="operations-summary-line" key={key}><span>{title}</span><strong>{money(draft[key])}</strong></div>)}{categories.map(category => <div className="operations-summary-line" key={category}><span>{category}</span><strong>{draft[category.toLowerCase()]}%</strong></div>)}</OperationsPanel><p>Each eligible passenger needs a valid approved ID. Motorcycle charges and PPA fees are excluded.</p><StaffNotice>Applies to new {vessel} bookings only. Existing paid tickets retain their recorded amount.</StaffNotice><div className="staff-actions"><StaffButton variant="secondary" onClick={() => setReview(false)}>Keep editing</StaffButton><StaffButton onClick={save}>Save prices</StaffButton></div></StaffDialog>}
        {switchTo && <StaffDialog title="Discard unsaved price changes?" onClose={() => setSwitchTo("")}><p>Your current {vessel} changes have not been saved.</p><div className="staff-actions"><StaffButton variant="secondary" onClick={() => setSwitchTo("")}>Keep editing</StaffButton><StaffButton onClick={() => select(switchTo)}>Discard and switch</StaffButton></div></StaffDialog>}
    </>;
}
