import { useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import StatCards from "../components/StatCards";
import { departments } from "../data/events";
import { computeStats, todayString } from "../utils/stats";

function StudentDashboard({ events, registrations }) {
  const [department, setDepartment] = useState("All");
  const stats = computeStats(events);
  const today = todayString();

  // Upcoming approved events, filtered by the chosen department
  let upcoming = events.filter((e) => e.status === "Approved" && e.date >= today);
  if (department !== "All") {
    upcoming = upcoming.filter((e) => e.department === department);
  }
  upcoming = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));
  const featured = upcoming.slice(0, 6);

  // Events this student has registered for
  const myEvents = registrations
    .map((reg) => ({ reg, event: events.find((e) => e.id === reg.eventId) }))
    .filter((item) => item.event);

  return (
    <>
      <StatCards stats={stats} />

      <div className="section-head">
        <h2>Upcoming events</h2>
        <Link to="/events" className="link-more">See all events →</Link>
      </div>

      <div className="chips">
        <button
          className={department === "All" ? "chip active" : "chip"}
          onClick={() => setDepartment("All")}
        >
          All Departments
        </button>
        {departments.map((d) => (
          <button
            key={d.code}
            className={department === d.code ? "chip active" : "chip"}
            onClick={() => setDepartment(d.code)}
            title={d.name}
          >
            {d.label}
          </button>
        ))}
      </div>

      {featured.length === 0 ? (
        <div className="card">No upcoming events for this department yet.</div>
      ) : (
        <div className="event-grid">
          {featured.map((event) => (
            <EventCard key={event.id} event={event} role="Student" />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>My registered events ({myEvents.length})</h2>
        <Link to="/my-registrations" className="link-more">View my passes →</Link>
      </div>

      {myEvents.length === 0 ? (
        <div className="card">You have not registered for any event yet.</div>
      ) : (
        myEvents.slice(0, 3).map(({ reg, event }) => (
          <div className="card list-row" key={reg.id}>
            <div>
              <strong>{event.title}</strong>
              <div className="muted small">
                {event.date} at {event.time} · {event.venue}
              </div>
            </div>
            <span className={reg.checkedIn ? "status status-approved" : "status status-pending"}>
              {reg.checkedIn ? "Checked In" : "Registered"}
            </span>
          </div>
        ))
      )}
    </>
  );
}

export default StudentDashboard;