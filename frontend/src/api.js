const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function sendMessage(sessionId, message) {
    const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to send message");
    }

    return response.json();
}

export async function getChatHistory(sessionId) {
    const response = await fetch(`${API_BASE}/chat/${sessionId}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load chat history");
    }

    return response.json();
}

export async function getSessions() {
    const response = await fetch(`${API_BASE}/sessions`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to load sessions");
    }

    return response.json();
}
