import { useState } from "react";

function CheckIn({ events, registrations, role, checkInRegistration }) {
  const approved = events.filter((e) => e.status === "Approved");
  const [eventId, setEventId] = useState("");
  const [passId, setPassId] = useState("");
  const [message, setMessage] = useState(null);

  // Only Admin can run check-in
  if (role !== "Admin") {
    return (
      <div className="container">
        <div className="alert alert-info">
          Check-in is for Admin. Please log in as Admin.
        </div>
      </div>
    );
  }

  // Use the first approved event until one is chosen
  const currentId = Number(eventId) || (approved[0] ? approved[0].id : 0);
  const list = registrations.filter((r) => r.eventId === currentId);
  const checkedCount = list.filter((r) => r.checkedIn).length;

 async function handleScan() {
    const result = await checkInRegistration(passId.trim());
    setMessage(result);
    if (result.ok) setPassId("");
  }

  return (
    <div className="container">
      <h1>QR Check-in</h1>
      <p className="muted">
        Camera scanning is simulated: type or paste a Pass ID, or use the Check in button.
      </p>

      <div className="card">
        <label className="field-label">Event</label>
        <select
          className="wide-select"
          value={currentId}
          onChange={(e) => {
            setEventId(e.target.value);
            setMessage(null);
          }}
        >
          {approved.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>

        <label className="field-label">Pass ID (what the QR code contains)</label>
        <div className="scan-row">
          <input
            value={passId}
            onChange={(e) => setPassId(e.target.value)}
            placeholder="e.g. REG-1730000000000"
          />
          <button className="btn btn-primary" onClick={handleScan}>
            Simulate scan
          </button>
        </div>

        {message && (
          <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
            {message.text}
          </div>
        )}
      </div>

      <h2>
        Attendance: {checkedCount} / {list.length} checked in
      </h2>

      {list.length === 0 ? (
        <div className="card">
          No passes for this event yet. Register as a Student first, then come back.
        </div>
      ) : (
        list.map((reg) => (
          <div className="card list-row" key={reg.id}>
            <div>
              <strong>{reg.name}</strong> ({reg.rollNo})
              <div className="muted small">Pass ID: {reg.id}</div>
            </div>
            {reg.checkedIn ? (
              <span className="status status-approved">Checked In</span>
            ) : (
              <button
                className="btn btn-small"
                onClick={async () => setMessage(await checkInRegistration(reg.id))}
              >
                Check in
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default CheckIn;