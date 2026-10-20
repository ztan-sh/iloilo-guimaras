import React, { useId } from "react";
export { StaffButton as AdminButton, StaffPanel as AdminPanel, StaffMetric as AdminMetric, StaffCapacity as AdminCapacity,
    StaffDetail as AdminDetail, StaffNotice as AdminNotice, StaffDialog as AdminDialog, useStaffMotion as useAdminMotion } from "../staff/StaffUI";

const icons = { home: "0d547.svg", schedules: "71f63.svg", ticket: "0d048.svg", user: "be76c.svg", card: "49f6d.svg", check: "82bff.svg",
    lock: "6841d.svg", account: "4b05a.svg", connected: "7bcce.svg", mail: "1b8de.svg", password: "5e0ab.svg", eye: "b53dd.svg", routeInput: "9b21d.svg", ticketInput: "f79e9.svg" };
export function AdminIcon({ name }) { return <img className="staff-icon" src={name === "bell" ? "/images/operations/866ad.svg" : `/images/admin/${icons[name]}`} alt="" aria-hidden="true" />; }
export function AdminBrand({ large = false }) {
    return <div className={`staff-brand ${large ? "staff-brand-large" : ""}`}><span className="staff-brand-mark"><img src={`/images/admin/${large ? "59882.svg" : "c7507.svg"}`} alt="" /></span><span>GuimarasGo</span></div>;
}
export function AdminStatus({ children }) {
    const name = String(children || "").toLowerCase().replaceAll(" ", "-");
    return <span className={`staff-status admin-desktop-status-${name}`}>{children}</span>;
}
export function AdminField({ label, icon, children, options, id: suppliedId, ...props }) {
    const generatedId = useId();
    const id = suppliedId || generatedId;
    return <div className="staff-field"><label htmlFor={id}>{label}</label><div className="staff-input-wrap">
        {icon && <span className="staff-input-icon"><AdminIcon name={icon} /></span>}
        {options ? <select id={id} {...props}>{options.map(option => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return <option key={value} value={value}>{label}</option>;
        })}</select> : <input id={id} {...props} />}
        {children}
    </div></div>;
}
export function AdminHeading({ title, detail, children }) {
    return <div className="staff-section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{children}</div>;
}
export function AdminTable({ columns, children, className = "", label, empty }) {
    return <div className="staff-table-scroll"><table className={`staff-table admin-desktop-table ${className}`} aria-label={label}>
        <colgroup>{columns.map((col, i) => <col key={i} style={{ width: `${col.width}%` }} />)}</colgroup>
        <thead><tr>{columns.map(col => <th scope="col" key={col.label}>{col.label}</th>)}</tr></thead>
        <tbody>{empty ? <tr><td colSpan={columns.length}><p className="staff-empty">{empty}</p></td></tr> : children}</tbody>
    </table></div>;
}
export function AdminCell({ label, detail, children }) { return <td>{label && <strong>{label}</strong>}{detail && <small>{detail}</small>}{children}</td>; }
