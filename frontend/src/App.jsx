import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { sendMessage, getChatHistory, getSessions } from "./api";

function generateSessionId() {
    return crypto.randomUUID();
}

function getStoredSessionId() {
    return localStorage.getItem("sessionId");
}

function storeSessionId(id) {
    localStorage.setItem("sessionId", id);
}

function App() {
    const [sessionId, setSessionId] = useState(() => {
        const stored = getStoredSessionId();
        if (stored) return stored;
        const newId = generateSessionId();
        storeSessionId(newId);
        return newId;
    });

    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSessions = useCallback(async () => {
        try {
            const data = await getSessions();
            setSessions(data.sessions || []);
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
        }
    }, []);

    const fetchChatHistory = useCallback(async (sid) => {
        try {
            const data = await getChatHistory(sid);
            setMessages(data.messages || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setMessages([]);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
        fetchChatHistory(sessionId);
    }, [sessionId, fetchSessions, fetchChatHistory]);

    const handleSend = async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = {
            id: Date.now(),
            role: "user",
            content: text.trim(),
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        setError(null);

        try {
            const data = await sendMessage(sessionId, text.trim());

            const assistantMsg = {
                id: Date.now() + 1,
                role: "assistant",
                content: data.reply,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
            fetchSessions();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        const newId = generateSessionId();
        storeSessionId(newId);
        setSessionId(newId);
        setMessages([]);
    };

    const handleSelectSession = (sid) => {
        storeSessionId(sid);
        setSessionId(sid);
    };

    return (
        <div className="app-container">
            <Sidebar
                sessions={sessions}
                activeSessionId={sessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
            />
            <ChatWindow
                messages={messages}
                loading={loading}
                onSend={handleSend}
                sessionId={sessionId}
            />
            {error && <div className="error-toast">{error}</div>}
        </div>
    );
}

export default App;
