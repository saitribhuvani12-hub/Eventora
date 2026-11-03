import { Link } from "react-router-dom";
import { departmentName, departmentLabel } from "../data/events";

// Shows one event as a card
function EventCard({ event, role }) {
  const seatsLeft = event.capacity - event.registered;
  const percentFull = Math.round((event.registered / event.capacity) * 100);

  const niceDate = new Date(event.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card event-card">
      <div className="badges">
        <span className="badge">{event.category}</span>
        <span
          className={"dept-badge dept-" + event.department}
          title={departmentName(event.department)}
        >
          {departmentLabel(event.department)}
        </span>
      </div>

      <h3>{event.title}</h3>
      <p className="muted">{event.description}</p>

      <ul className="event-info">
        <li>🏛️ {departmentName(event.department)}</li>
        <li>📅 {niceDate} at {event.time}</li>
        <li>📍 {event.venue}</li>
        <li>👤 {event.organizer}</li>
      </ul>

      <div className="progress">
        <div className="progress-fill" style={{ width: percentFull + "%" }}></div>
      </div>
      <p className="muted small">
        {event.registered} / {event.capacity} registered ·{" "}
        {seatsLeft > 0 ? seatsLeft + " seats left" : "Full"}
      </p>

            {role === "Student" && seatsLeft > 0 ? (
        <Link to={"/events/" + event.id} className="btn btn-primary">
          Register Now
        </Link>
      ) : (
        <Link to={"/events/" + event.id} className="btn">
          View Details
        </Link>
      )}
    </div>
  );
}

export default EventCard;