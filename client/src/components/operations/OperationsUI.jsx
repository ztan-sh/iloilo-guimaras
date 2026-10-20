import React, { useId } from "react";
import { StaffButton, StaffField } from "../staff/StaffUI";
import { VESSELS } from "./operationsStore";
export function OperationsPanel({ children, className = "" }) { return <section className={`operations-panel ${className}`}>{children}</section>; }
export function VesselSelector({ value, onChange, disabled = false, available = VESSELS }) {
    return <label className="operations-vessel-select">Choose a vessel<select aria-label="Choose a vessel" value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>{VESSELS.map(vessel => <option key={vessel} value={vessel} disabled={!available.includes(vessel)}>{vessel}</option>)}</select></label>;
}
export function PencilField(props) { return <StaffField {...props}><img src="/images/operations/04e4f.svg" width="24" height="24" alt="" aria-hidden="true" /></StaffField>; }
export function PassengerFields({ person, onChange, prefix }) {
    const id = useId();
    return <div className="staff-details-grid">
        <PencilField label={`${prefix} name`} value={person.name} onChange={e => onChange({ ...person, name: e.target.value })} maxLength={150} required />
        <PencilField label={`${prefix} age`} type="number" min="0" max="120" step="1" value={person.age} onChange={e => onChange({ ...person, age: e.target.value })} required />
        <div className="staff-field"><label htmlFor={`${id}-gender`}>{prefix} gender</label><select id={`${id}-gender`} value={person.gender} required onChange={e => onChange({ ...person, gender: e.target.value })}><option value="">Select gender</option>{["Female", "Male", "Other", "Prefer not to say"].map(value => <option key={value}>{value}</option>)}</select></div>
        <div className="staff-field"><label htmlFor={`${id}-category`}>{prefix} category</label><select id={`${id}-category`} value={person.category} onChange={e => onChange({ ...person, category: e.target.value })}>{["Regular", "Student", "PWD", "Senior"].map(value => <option key={value}>{value}</option>)}</select></div>
    </div>;
}
