import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

function MyRegistrations({ registrations, events, cancelRegistration }) {
  function handleCancel(reg) {
    if (window.confirm("Cancel this registration?")) {
      cancelRegistration(reg.id);
    }
  }

  return (
    <div className="container">
      <h1>My Registrations</h1>
      <p className="muted">Passes registered on this device.</p>

      {registrations.length === 0 ? (
        <div className="card">
          <p>You have not registered for any event yet.</p>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="event-grid">
          {registrations.map((reg) => {
            const event = events.find((e) => e.id === reg.eventId);
            if (!event) return null;
            return (
              <div className="card pass" key={reg.id}>
                <h3>{event.title}</h3>
                <p className="muted small">
                  📅 {event.date} at {event.time} · 📍 {event.venue}
                </p>
                <QRCodeSVG value={"EVENTORA|" + reg.id + "|" + event.id + "|" + reg.rollNo} size={140} />
                <p><strong>{reg.name}</strong> ({reg.rollNo})</p>
                <p className="muted small">Pass ID: {reg.id}</p>
                <span className={reg.checkedIn ? "status status-approved" : "status status-pending"}>
                  {reg.checkedIn ? "Checked In" : "Registered"}
                </span>
                {!reg.checkedIn && (
                  <button className="btn btn-danger" onClick={() => handleCancel(reg)}>
                    Cancel Registration
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyRegistrations;