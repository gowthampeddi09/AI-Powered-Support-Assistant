function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat }) {
    function formatTime(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    function truncateId(id) {
        if (!id) return "";
        return `Session ${id.substring(0, 8)}`;
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Conversations</h2>
                <button className="new-chat-btn" onClick={onNewChat}>
                    + New Chat
                </button>
            </div>
            <div className="session-list">
                {sessions.length === 0 ? (
                    <div className="no-sessions">No conversations yet</div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`session-item ${session.id === activeSessionId ? "active" : ""}`}
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="session-item-id">{truncateId(session.id)}</div>
                            <div className="session-item-time">
                                {formatTime(session.updated_at)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
