import React, { createContext, useContext, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import api from "../../services/api";
import { createAdminPreviewApi } from "./adminPreviewApi";
import { operationsStore } from "../../components/operations/operationsStore";
import "../Staff/Staff.css";

const AdminFlowContext = createContext({ api, basePath: "/admin", preview: false });
export const useAdminFlow = () => useContext(AdminFlowContext);

export default function AdminPreview() {
    const [state, setState] = useState(() => ({ api: createAdminPreviewApi(), version: 0 }));
    return <AdminFlowContext.Provider value={{ api: state.api, basePath: "/preview/admin", preview: true }}>
        <div className="staff-preview-surface">
            <aside className="staff-preview-bar" aria-label="Design preview">
                <p><strong>Admin frontend preview</strong><span>Sample data · Changes stay in this preview</span></p>
                <div className="operations-preview-actions">{import.meta.env.VITE_CLIENT_PREVIEW === "true" && <Link to="/preview/client/dashboard">Client preview</Link>}<Link to="/preview/staff/overview">Staff preview</Link><button type="button" onClick={() => { operationsStore.reset(); setState(s => ({ api: createAdminPreviewApi(), version: s.version + 1 })); }}>Reset sample data</button></div>
            </aside>
            <Outlet key={state.version} />
        </div>
    </AdminFlowContext.Provider>;
}
