import { useState, useEffect, useRef } from "react";

// The server stores times in UTC, so we turn them into a readable local time
function niceTime(createdAt) {
  const date = new Date(createdAt.replace(" ", "T") + "Z");
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationBell({ notifications, unreadCount, onOpen, onMarkRead, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close the list when the user clicks anywhere outside it
  useEffect(() => {
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle() {
    if (!open) onOpen(); // get the newest notifications when the list opens
    setOpen(!open);
  }

  return (
    <div className="bell-wrap" ref={boxRef}>
      <button
        className="bell-btn"
        onClick={toggle}
        aria-label={"Notifications, " + unreadCount + " unread"}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="bell-link" onClick={onMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="bell-empty">No notifications yet.</p>
          ) : (
            <ul className="bell-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.isRead ? "bell-item" : "bell-item unread"}
                >
                  <div className="bell-message">{n.message}</div>
                  <div className="bell-meta">
                    <span>{niceTime(n.createdAt)}</span>
                    {n.isRead ? (
                      <span>Read</span>
                    ) : (
                      <button className="bell-link" onClick={() => onMarkRead(n.id)}>
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;