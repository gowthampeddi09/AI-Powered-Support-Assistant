import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ChatWindow({ messages, loading, onSend, sessionId }) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [sessionId]);

    function handleSubmit(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;
        onSend(input);
        setInput("");
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return (
        <main className="chat-area">
            <div className="chat-header">
                <div className="chat-header-dot"></div>
                <h1>AI Support Assistant</h1>
                <span>Session: {sessionId.substring(0, 8)}</span>
            </div>

            <div className="messages-container">
                {messages.length === 0 && !loading && (
                    <div className="welcome-screen">
                        <h2>Welcome</h2>
                        <p>
                            Ask me anything about our product. I can help with account
                            settings, billing, shipping, security, and more.
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.role}`}>
                        <div className="message-role">
                            {msg.role === "user" ? "You" : "Assistant"}
                        </div>
                        <div className="message-bubble">
                            {msg.role === "assistant" ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                msg.content
                            )}
                        </div>
                        <div className="message-time">{formatTime(msg.created_at)}</div>
                    </div>
                ))}

                {loading && (
                    <div className="loading-indicator">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <form className="input-form" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="message-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your question..."
                            rows={1}
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={!input.trim() || loading}
                    >
                        Send
                    </button>
                </form>
            </div>
        </main>
    );
}

export default ChatWindow;
