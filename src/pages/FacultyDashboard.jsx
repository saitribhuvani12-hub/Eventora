import { Link } from "react-router-dom";
import { departmentName, departmentLabel } from "../data/events";
import { todayString } from "../utils/stats";

function FacultyDashboard({ user, events }) {
  const today = todayString();

  // Events of this faculty member's department, plus any they created
  const mine = events
    .filter((e) => e.department === user.department || e.createdBy === user.username)
    .sort((a, b) => a.date.localeCompare(b.date));

  const approved = mine.filter((e) => e.status === "Approved");
  const upcoming = approved.filter((e) => e.date >= today).length;
  const registrations = approved.reduce((sum, e) => sum + e.registered, 0);
  const pending = mine.filter((e) => e.status === "Pending").length;

  const cards = [
    { icon: "📅", value: mine.length, label: "Department Events" },
    { icon: "🚀", value: upcoming, label: "Upcoming Events" },
    { icon: "🎟️", value: registrations, label: "Total Registrations" },
    { icon: "⏳", value: pending, label: "Awaiting Approval" },
  ];

  function statusNote(event) {
    if (event.status === "Pending") return "Waiting for Admin approval";
    if (event.status === "Rejected") return "Rejected by Admin";
    return event.date < today ? "Completed" : "Approved and open for registration";
  }

  return (
    <>
      <div className="alert alert-info">
        🏛️ Department: <strong>{departmentName(user.department)}</strong>
      </div>

      <div className="stats">
        {cards.map((c) => (
          <div className="card stat" key={c.label}>
            <div className="stat-icon">{c.icon}</div>
            <h2>{c.value}</h2>
            <p>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>Your department's events</h2>
        <Link to="/manage" className="btn btn-primary btn-small">+ Create new event</Link>
      </div>

      {mine.length === 0 ? (
        <div className="card">No events yet. Create your first event.</div>
      ) : (
        mine.map((event) => (
          <div className="card list-row" key={event.id}>
            <div className="event-row-main">
              <span className={"dept-badge dept-" + event.department}>
                {departmentLabel(event.department)}
              </span>{" "}
              <strong>{event.title}</strong>
              <div className="muted small">
                {event.date} at {event.time} · {event.venue}
              </div>
              <div className="muted small">{statusNote(event)}</div>
            </div>

            <div className="row-progress">
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{ width: (event.registered / event.capacity) * 100 + "%" }}
                ></div>
              </div>
              <div className="muted small">
                {event.registered} / {event.capacity} registered
              </div>
            </div>

            <span className={"status status-" + event.status.toLowerCase()}>
              {event.status}
            </span>
          </div>
        ))
      )}
    </>
  );
}

export default FacultyDashboard;