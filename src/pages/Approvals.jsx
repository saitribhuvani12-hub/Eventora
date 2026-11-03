import { useState } from "react";
import { findClash } from "../utils/clash";
import { departmentLabel } from "../data/events";

function Approvals({ events, role, updateEventStatus }) {
  const [message, setMessage] = useState(null);

  // Only Faculty can use this page
  if (role !== "Admin") {
    return (
      <div className="container">
        <div className="alert alert-info">
          Only Admin can review event proposals. Please log in as Admin.
        </div>
      </div>
    );
  }

  const pending = events.filter((e) => e.status === "Pending");
  const decided = events.filter((e) => e.status !== "Pending");

  async function decide(event, newStatus) {
    const result = await updateEventStatus(event.id, newStatus);
    setMessage({ ok: result.ok, text: result.message });
  }

  return (
    <div className="container">
      <h1>Event Approvals</h1>
      <p className="muted">Review proposals submitted by clubs and departments.</p>

      {message && (
        <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
          {message.text}
        </div>
      )}

      <h2>Pending ({pending.length})</h2>

      {pending.length === 0 ? (
        <div className="card">No proposals are waiting for review. 🎉</div>
      ) : (
        pending.map((event) => {
          const clash = findClash(event, events);
          return (
            <div className="card approval-card" key={event.id}>
              <span className="badge">{event.category}</span>
              <span className={"dept-badge dept-" + event.department}>
                {departmentLabel(event.department)}
              </span>
              <h3>{event.title}</h3>
              <p className="muted">{event.description}</p>
              <ul className="event-info">
                <li>📅 {event.date} at {event.time}</li>
                <li>📍 {event.venue}</li>
                <li>👤 {event.organizer}</li>
                <li>🎟️ Expected capacity: {event.capacity}</li>
              </ul>

              {clash && (
                <div className="alert alert-warn">
                  ⚠️ Venue clash: <strong>{clash.title}</strong> is already approved at{" "}
                  {clash.venue} on {clash.date} at {clash.time}.
                </div>
              )}

              <div className="actions">
                <button
                  className="btn btn-primary"
                  disabled={Boolean(clash)}
                  onClick={() => decide(event, "Approved")}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => decide(event, "Rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })
      )}

      <h2>Already decided ({decided.length})</h2>
      {decided.map((event) => (
        <div className="card list-row" key={event.id}>
          <div>
            <strong>{event.title}</strong>
            <div className="muted small">
              {event.venue} · {event.date} at {event.time}
            </div>
          </div>
          <span className={"status status-" + event.status.toLowerCase()}>
            {event.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Approvals;