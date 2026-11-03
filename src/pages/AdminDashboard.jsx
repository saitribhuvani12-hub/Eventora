import { useState } from "react";
import { Link } from "react-router-dom";
import StatCards from "../components/StatCards";
import DeptChart from "../components/DeptChart";
import { departmentLabel } from "../data/events";
import { computeStats } from "../utils/stats";
import { findClash } from "../utils/clash";

function AdminDashboard({ events, updateEventStatus }) {
  const [message, setMessage] = useState(null);
  const stats = computeStats(events);
  const pending = events.filter((e) => e.status === "Pending");

  async function decide(event, newStatus) {
    const result = await updateEventStatus(event.id, newStatus);
    setMessage({ ok: result.ok, text: result.message });
  }

  return (
    <>
      <StatCards stats={stats} />

      <div className="section-head">
        <h2>Awaiting your approval ({pending.length})</h2>
        <Link to="/approvals" className="link-more">Open Approvals page →</Link>
      </div>

      {message && (
        <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
          {message.text}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="card">No proposals are waiting. 🎉</div>
      ) : (
        pending.map((event) => {
          const clash = findClash(event, events);
          return (
            <div className="card list-row" key={event.id}>
              <div className="event-row-main">
                <span className={"dept-badge dept-" + event.department}>
                  {departmentLabel(event.department)}
                </span>{" "}
                <strong>{event.title}</strong>
                <div className="muted small">
                  {event.date} at {event.time} · {event.venue}
                </div>
                {clash && (
                  <div className="small clash-note">⚠️ Clashes with {clash.title}</div>
                )}
              </div>
              <div className="row-right">
                <button
                  className="btn btn-primary btn-small"
                  disabled={Boolean(clash)}
                  onClick={() => decide(event, "Approved")}
                >
                  Approve
                </button>
                <button className="btn btn-danger btn-small" onClick={() => decide(event, "Rejected")}>
                  Reject
                </button>
              </div>
            </div>
          );
        })
      )}

      <DeptChart events={events} />

      <div className="section-head">
        <h2>Quick actions</h2>
      </div>
      <div className="quick-links">
        <Link to="/manage" className="btn">Manage events</Link>
        <Link to="/dashboard" className="btn">Full analytics</Link>
        <Link to="/checkin" className="btn">QR check-in</Link>
      </div>
    </>
  );
}

export default AdminDashboard;