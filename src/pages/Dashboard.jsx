import { categories } from "../data/events";

function Dashboard({ events, registrations, role }) {
  // Only Admin can see analytics
  if (role !== "Admin") {
    return (
      <div className="container">
        <div className="alert alert-info">
          The dashboard is for Admin. Please log in as Admin.
        </div>
      </div>
    );
  }

  const approved = events.filter((e) => e.status === "Approved");
  const totalRegs = events.reduce((sum, e) => sum + e.registered, 0);
  const checkedIn = registrations.filter((r) => r.checkedIn).length;

  const totalSeats = approved.reduce((sum, e) => sum + e.capacity, 0);
  const filledSeats = approved.reduce((sum, e) => sum + e.registered, 0);
  const fillRate = totalSeats ? Math.round((filledSeats / totalSeats) * 100) : 0;

  // Registrations per category
  const byCategory = categories.map((name) => ({
    name,
    count: events
      .filter((e) => e.category === name)
      .reduce((sum, e) => sum + e.registered, 0),
  }));
  const maxCategory = Math.max(...byCategory.map((c) => c.count), 1);

  // Most popular approved events
  const topEvents = [...approved].sort((a, b) => b.registered - a.registered);

  const count = (status) => events.filter((e) => e.status === status).length;

  return (
    <div className="container">
      <h1>Analytics Dashboard</h1>

      <div className="stats">
        <div className="card stat">
          <h2>{approved.length}</h2>
          <p>Approved Events</p>
        </div>
        <div className="card stat">
          <h2>{totalRegs}</h2>
          <p>Total Registrations</p>
        </div>
        <div className="card stat">
          <h2>{fillRate}%</h2>
          <p>Seats Filled</p>
        </div>
        <div className="card stat">
          <h2>{checkedIn}</h2>
          <p>QR Check-ins</p>
        </div>
      </div>

      <div className="card chart-card">
        <h2>Registrations by category</h2>
        {byCategory.map((c) => (
          <div className="bar-row" key={c.name}>
            <span className="bar-label">{c.name}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: (c.count / maxCategory) * 100 + "%" }}
              ></div>
            </div>
            <span className="bar-value">{c.count}</span>
          </div>
        ))}
      </div>

      <div className="card chart-card">
        <h2>Most popular events</h2>
        {topEvents.map((e) => (
          <div className="bar-row" key={e.id}>
            <span className="bar-label wide">{e.title}</span>
            <div className="bar-track">
              <div
                className="bar-fill green"
                style={{ width: (e.registered / e.capacity) * 100 + "%" }}
              ></div>
            </div>
            <span className="bar-value">
              {e.registered}/{e.capacity}
            </span>
          </div>
        ))}
      </div>

      <div className="card chart-card">
        <h2>Proposal status</h2>
        <p>
          <span className="status status-approved">Approved: {count("Approved")}</span>
          <span className="status status-pending">Pending: {count("Pending")}</span>
          <span className="status status-rejected">Rejected: {count("Rejected")}</span>
        </p>
      </div>

      <p className="muted small">
        Note: the sample events come with preset registration counts. QR check-ins are
        counted only for passes created in this demo.
      </p>
    </div>
  );
}

export default Dashboard;