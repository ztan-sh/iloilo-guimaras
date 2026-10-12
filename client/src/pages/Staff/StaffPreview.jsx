import React, { createContext, useContext, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import api from "../../services/api";
import { createStaffPreviewApi } from "./staffPreviewApi";
import { operationsStore } from "../../components/operations/operationsStore";
import "./Staff.css";

const StaffFlowContext = createContext({ api, basePath: "/staff", preview: false });
export const useStaffFlow = () => useContext(StaffFlowContext);

export default function StaffPreview() {
    const [state, setState] = useState(() => ({ api: createStaffPreviewApi(), version: 0 }));
    const reset = () => { operationsStore.reset(); setState(current => ({ api: createStaffPreviewApi(), version: current.version + 1 })); };
    return <StaffFlowContext.Provider value={{ api: state.api, basePath: "/preview/staff", preview: true }}>
        <div className="staff-preview-surface">
            <aside className="staff-preview-bar" aria-label="Design preview">
                <p><strong>Frontend preview</strong><span>Sample data · Changes stay in this preview</span></p>
                <div className="operations-preview-actions">{import.meta.env.VITE_CLIENT_PREVIEW === "true" && <Link to="/preview/client/dashboard">Client preview</Link>}<Link to="/preview/admin/overview">Admin preview</Link><button type="button" onClick={reset}>Reset sample data</button></div>
            </aside>
            <Outlet key={state.version} />
        </div>
    </StaffFlowContext.Provider>;
}
