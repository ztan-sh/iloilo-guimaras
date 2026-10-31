export function getApiErrorMessage(error) {
    const status = error?.response?.status ?? error?.status;
    const serverMessage =
        error?.response?.data?.message || error?.data?.message;

    if (!status) {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
            return "You appear to be offline. Check your internet connection and try again.";
        }

        return "Could not connect to the server. Check your internet connection and try again.";
    }

    if (status === 404) {
        return serverMessage || "The requested page or record was not found (404). Check the link and try again.";
    }

    if (status === 401) {
        return serverMessage || "Your session may have expired. Please sign in again.";
    }

    if (status === 403) {
        return serverMessage || "You do not have permission to do that (403).";
    }

    if (status === 408 || status === 504) {
        return "The request timed out. Check your connection and try again.";
    }

    if (status === 429) {
        return "There have been too many requests. Wait a moment and try again.";
    }

    if (status >= 500) {
        return `The server encountered an error (${status}). Check your internet connection and try again later.`;
    }

    return serverMessage || error?.message || `The request could not be completed (${status}).`;
}
