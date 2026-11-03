import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { departmentName } from "../data/events";
import { todayString } from "../utils/stats";
import { validateRegistrationForm, cleanName } from "../utils/validation";

const emptyForm = { name: "", rollNo: "", email: "" };

function EventDetails({ events, role, registerForEvent }) {
  const { id } = useParams(); // the number in the web address
  const event = events.find((e) => e.id === Number(id));

  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({}); // which fields the student has visited
  const [serverErrors, setServerErrors] = useState({}); // messages sent back by the server
  const [message, setMessage] = useState(null); // { ok: true/false, text }
  const [newReg, setNewReg] = useState(null); // the pass just created
  const [saving, setSaving] = useState(false);

  if (!event) {
    return (
      <div className="container">
        <div className="card">
          <h2>Event not found</h2>
          <Link to="/events">← Back to events</Link>
        </div>
      </div>
    );
  }

  const seatsLeft = event.capacity - event.registered;
  const isPast = event.date < todayString();
  const deadlinePassed =
    Boolean(event.registrationDeadline) && event.registrationDeadline < todayString();
  const niceDate = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Live validation: recalculated every time the form changes
  const errors = validateRegistrationForm(form);

  // A message is shown once the field was visited, or after a failed submit
  function errorFor(field) {
    if (touched[field] && errors[field]) return errors[field];
    return serverErrors[field] || "";
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setServerErrors({ ...serverErrors, [name]: "" });
    setMessage(null);
  }

  function handleBlur(e) {
    setTouched({ ...touched, [e.target.name]: true });
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the page from reloading

    // Show every message at once, and stop here if anything is wrong
    setTouched({ name: true, rollNo: true, email: true });
    if (errors.name || errors.rollNo || errors.email) {
      setMessage({ ok: false, text: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    const result = await registerForEvent(event.id, {
      name: cleanName(form.name),
      rollNo: form.rollNo.trim(),
      email: form.email.trim(),
    });
    setSaving(false);

    setMessage({ ok: result.ok, text: result.message });
    if (result.ok) {
      setNewReg(result.registration);
      setForm(emptyForm);
      setTouched({});
      setServerErrors({});
    } else {
      setServerErrors(result.errors || {});
    }
  }

  return (
    <div className="container">
      <Link to="/events" className="back-link">← Back to events</Link>

      <div className="card details">
        <span className="badge">{event.category}</span>
        <span className={"status status-" + event.status.toLowerCase()}>
          {event.status}
        </span>
        <h1>{event.title}</h1>
        <p>{event.description}</p>

        <ul className="event-info">
          <li>🏛️ {departmentName(event.department)}</li>
          <li>📅 {niceDate}</li>
          <li>🕒 {event.time}{event.endTime ? " – " + event.endTime : ""}</li>
          <li>📍 {event.venue}</li>
          <li>👤 Organised by {event.organizer}</li>
                    {event.coordinator && <li>🧑‍🏫 Faculty coordinator: {event.coordinator}</li>}
          {event.registrationDeadline && <li>⏳ Register by {event.registrationDeadline}</li>}
          <li>🎟️ {event.registered} / {event.capacity} registered ({seatsLeft} seats left)</li>
        </ul>
      </div>

      {/* Registration section */}
        {role === "Student" && event.status === "Approved" && !isPast && !deadlinePassed && (
        <div className="card">
          <h2>Register for this event</h2>
          <p className="muted small">
            Fields marked <span className="required-star">*</span> are compulsory.
          </p>

          {message && (
            <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
              {message.text}
            </div>
          )}

          {seatsLeft > 0 ? (
            <form onSubmit={handleSubmit} className="form" noValidate>
              <label htmlFor="name">
                Student name <span className="required-star">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errorFor("name") ? "invalid" : ""}
                placeholder="e.g. Ravi Kumar"
                autoComplete="name"
              />
              {errorFor("name") && <div className="field-error">{errorFor("name")}</div>}

              <label htmlFor="rollNo">
                Roll number <span className="required-star">*</span>
              </label>
              <input
                id="rollNo"
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errorFor("rollNo") ? "invalid" : ""}
                placeholder="e.g. 160824737006 (digits only)"
                inputMode="numeric"
              />
              {errorFor("rollNo") && <div className="field-error">{errorFor("rollNo")}</div>}

              <label htmlFor="email">
                Email address <span className="required-star">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errorFor("email") ? "invalid" : ""}
                placeholder="e.g. ravi@gmail.com"
                autoComplete="email"
              />
              {errorFor("email") && <div className="field-error">{errorFor("email")}</div>}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Registering..." : "Register Now"}
              </button>
            </form>
          ) : (
            <p className="alert alert-error">This event is full.</p>
          )}
        </div>
      )}

      {role === "Student" && event.status === "Approved" && isPast && (
        <div className="alert alert-info">
          Registration is closed because this event has already taken place.
        </div>
      )}
            {role === "Student" && event.status === "Approved" && !isPast && deadlinePassed && (
        <div className="alert alert-info">
          Registration is closed. The deadline was {event.registrationDeadline}.
        </div>
      )}

      {role !== "Student" && (
        <div className="alert alert-info">
          Registration is available to students. Please log in as a Student to register.
        </div>
      )}

      {role === "Student" && event.status !== "Approved" && (
        <div className="alert alert-info">
          Registration opens only after the event is approved.
        </div>
      )}

      {/* QR pass shown right after registering */}
      {newReg && (
        <div className="card pass">
          <h2>🎉 Your Event Pass</h2>
          <QRCodeSVG value={"EVENTORA|" + newReg.id + "|" + event.id + "|" + newReg.rollNo} size={170} />
          <p><strong>{newReg.name}</strong> ({newReg.rollNo})</p>
          <p className="muted small">Pass ID: {newReg.id}</p>
          <p className="muted small">Show this QR code at the venue for check-in.</p>
          <Link to="/my-registrations" className="btn">View My Registrations</Link>
        </div>
      )}
    </div>
  );
}

export default EventDetails;