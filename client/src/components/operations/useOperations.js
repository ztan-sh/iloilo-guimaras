import { useSyncExternalStore } from "react";
import { operationsStore } from "./operationsStore";
const liveState = Object.freeze({ prices: {}, drafts: {}, bookings: [], requests: [], events: [], read: { staff: [], admin: [] }, bookingVersion: 0 });
export function useOperations(preview) {
    const state = useSyncExternalStore(operationsStore.subscribe, operationsStore.getSnapshot);
    return preview ? state : liveState;
}
