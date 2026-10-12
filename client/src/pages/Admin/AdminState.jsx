import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAdminFlow } from "./AdminPreview";
import { deriveEvents, normalizeTrip, timestampDate, todayInManila, tripStatistics } from "./adminUtils";
import { useOperations } from "../../components/operations/useOperations";

const AdminWorkspaceContext = createContext(null);
export const useAdminWorkspace = () => useContext(AdminWorkspaceContext);

export function AdminState({ children }) {
    const flow = useAdminFlow();
    const ops = useOperations(flow.preview);
    const [date, setDate] = useState(todayInManila);
    const [selectedId, setSelectedId] = useState("");
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState("");
    const [data, setData] = useState({ schedules: [], bookings: [], events: [], admin: null, loading: true, error: "" });
    useEffect(() => {
        const controller = new AbortController();
        setData(current => ({ ...current, loading: true, error: "" }));
        const config = { signal: controller.signal };
        Promise.all([
            flow.api.get("/bookings/schedules", { ...config, params: { date } }),
            flow.api.get("/bookings", config), flow.api.get("/admin/me", config),
            flow.preview ? flow.api.get("/preview/admin/events", config) : Promise.resolve(null)
        ]).then(([trips, records, profile, events]) => {
            if (controller.signal.aborted) return;
            const schedules = (trips.data.schedules || trips.data.capacities || []).map(normalizeTrip).sort((a, b) => a.departureTime.localeCompare(b.departureTime));
            const bookings = records.data.bookings || [];
            setData({ schedules, bookings, admin: profile.data.admin,
                events: (events?.data.events || deriveEvents(bookings, schedules)).filter(event => timestampDate(event.time) === date), loading: false, error: "" });
        }).catch(error => {
            if (controller.signal.aborted) return;
            setData(current => ({ ...current, loading: false, error: error.response?.data?.message || error.message || "Unable to load the management workspace." }));
        });
        return () => controller.abort();
    }, [date, version, flow.api, flow.preview, ops.bookingVersion]);
    const selectedTrip = data.schedules.find(trip => trip.id === selectedId) || data.schedules[0] || null;
    const statistics = useMemo(() => tripStatistics(data.bookings, selectedTrip), [data.bookings, selectedTrip]);
    const refresh = useCallback(() => setVersion(v => v + 1), []);
    return <AdminWorkspaceContext.Provider value={{ ...flow, ...data, date, setDate, selectedTrip, setSelectedId,
        statistics, refresh, notice, setNotice }}>{children}</AdminWorkspaceContext.Provider>;
}
