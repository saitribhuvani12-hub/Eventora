import { useState } from "react";
import { categories, venues, departments, departmentLabel } from "../data/events";
import { findClash } from "../utils/clash";
import { todayString } from "../utils/stats";
import { validateEventForm } from "../utils/eventValidation";

function makeEmptyForm(department) {
  return {
    title: "",
    description: "",
    organizer: "",
    coordinator: "",
    category: "",
    department: department,
    venue: "",
    date: "",
    time: "",
    endTime: "",
    registrationDeadline: "",
    capacity: "",
  };
}

// One form field: a label with a red star, the input, and its error message
function Field({ id, label, error, full, children }) {
  return (
    <div className={full ? "full-width" : ""}>
      <label htmlFor={id}>
        {label} <span className="required-star">*</span>
      </label>
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function ManageEvents({ events, role, user, addEvent, deleteEvent }) {
  const isAdmin = role === "Admin";
  const [form, setForm] = useState(() => makeEmptyForm(user.department));
  const [touched, setTouched] = useState({}); // fields the user has visited
  const [submitted, setSubmitted] = useState(false); // has Submit been pressed?
  const [serverErrors, setServerErrors] = useState({}); // messages sent by the server
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Only Faculty and Admin can use this page
  if (role !== "Admin" && role !== "Faculty") {
    return (
      <div className="container">
        <div className="alert alert-info">
          Only Faculty and Admin can create events. Please log in as Faculty or Admin.
        </div>
      </div>
    );
  }

  // Live validation: recalculated every time the form changes
  const errors = validateEventForm(form, todayString());

  // Live check: is this venue, date and start time already taken by an approved event?
  const clash =
    form.date && form.time && form.venue
      ? findClash({ id: -1, venue: form.venue, date: form.date, time: form.time }, events)
      : undefined;

  function errorFor(field) {
    if ((touched[field] || submitted) && errors[field]) return errors[field];
    return serverErrors[field] || "";
  }

  const cls = (field) => (errorFor(field) ? "invalid" : "");

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
    e.preventDefault();
    setSubmitted(true); // now every error message becomes visible

    if (Object.keys(errors).length > 0) {
      setMessage({ ok: false, text: "Please fill in all mandatory fields correctly." });
      return;
    }
    if (clash) {
      setMessage({ ok: false, text: "Choose a different venue, date or start time. This slot is already taken." });
      return;
    }

    setSaving(true);
    const result = await addEvent({
      title: form.title.trim(),
      description: form.description.trim(),
      organizer: form.organizer.trim(),
      coordinator: form.coordinator.trim(),
      category: form.category,
      department: form.department,
      venue: form.venue,
      date: form.date,
      time: form.time,
      endTime: form.endTime,
      registrationDeadline: form.registrationDeadline,
      capacity: Number(form.capacity),
    });
    setSaving(false);

    setMessage({ ok: result.ok, text: result.message });
    if (result.ok) {
      setForm(makeEmptyForm(user.department));
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
    } else {
      setServerErrors(result.errors || {});
    }
  }

  function handleDelete(event) {
    if (window.confirm('Delete "' + event.title + '"? Its registrations will also be removed.')) {
      deleteEvent(event.id);
    }
  }

  // Admin sees every event. Faculty sees their own department's events.
  const visible = (isAdmin
    ? events
    : events.filter((e) => e.department === user.department || e.createdBy === user.username)
  )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="container">
      <h1>Manage Events</h1>

      <div className="card">
        <h2>Create a new event</h2>
        <p className="muted small">
          {isAdmin
            ? "Events created by Admin are published straight away."
            : "Events you create are sent to Admin for approval."}{" "}
          Fields marked <span className="required-star">*</span> are compulsory.
        </p>

        {message && (
          <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form form-wide" noValidate>
          <Field id="title" label="Event Name" error={errorFor("title")}>
            <input id="title" name="title" value={form.title} onChange={handleChange}
              onBlur={handleBlur} className={cls("title")} placeholder="e.g. Robotics Expo" />
          </Field>

          <Field id="organizer" label="Organizer" error={errorFor("organizer")}>
            <input id="organizer" name="organizer" value={form.organizer} onChange={handleChange}
              onBlur={handleBlur} className={cls("organizer")} placeholder="e.g. Robotics Club" />
          </Field>

          <Field id="coordinator" label="Faculty Coordinator" error={errorFor("coordinator")}>
            <input id="coordinator" name="coordinator" value={form.coordinator} onChange={handleChange}
              onBlur={handleBlur} className={cls("coordinator")} placeholder="e.g. Mrs. K. Mounika" />
          </Field>

          <Field id="department" label="Department" error={errorFor("department")}>
            <select id="department" name="department" value={form.department} onChange={handleChange}
              onBlur={handleBlur} className={cls("department")}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field id="category" label="Category" error={errorFor("category")}>
            <select id="category" name="category" value={form.category} onChange={handleChange}
              onBlur={handleBlur} className={cls("category")}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field id="venue" label="Venue" error={errorFor("venue")}>
            <select id="venue" name="venue" value={form.venue} onChange={handleChange}
              onBlur={handleBlur} className={cls("venue")}>
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field id="date" label="Event Date" error={errorFor("date")}>
            <input id="date" type="date" name="date" min={todayString()} value={form.date}
              onChange={handleChange} onBlur={handleBlur} className={cls("date")} />
          </Field>

          <Field id="time" label="Start Time" error={errorFor("time")}>
            <input id="time" type="time" name="time" value={form.time}
              onChange={handleChange} onBlur={handleBlur} className={cls("time")} />
          </Field>

          <Field id="endTime" label="End Time" error={errorFor("endTime")}>
            <input id="endTime" type="time" name="endTime" value={form.endTime}
              onChange={handleChange} onBlur={handleBlur} className={cls("endTime")} />
          </Field>

          <Field id="registrationDeadline" label="Registration Deadline" error={errorFor("registrationDeadline")}>
            <input id="registrationDeadline" type="date" name="registrationDeadline"
              min={todayString()} max={form.date || undefined} value={form.registrationDeadline}
              onChange={handleChange} onBlur={handleBlur} className={cls("registrationDeadline")} />
          </Field>

          <Field id="capacity" label="Maximum Participants" error={errorFor("capacity")}>
            <input id="capacity" type="number" name="capacity" min="1" value={form.capacity}
              onChange={handleChange} onBlur={handleBlur} className={cls("capacity")}
              placeholder="e.g. 100" />
          </Field>

          <Field id="description" label="Event Description" error={errorFor("description")} full>
            <textarea id="description" name="description" rows="3" value={form.description}
              onChange={handleChange} onBlur={handleBlur} className={cls("description")}
              placeholder="What is this event about? (10 to 500 characters)" />
          </Field>

          {clash && (
            <div className="alert alert-warn full-width">
              ⚠️ Venue clash: <strong>{clash.title}</strong> is already approved at{" "}
              {clash.venue} on {clash.date} at {clash.time}.
            </div>
          )}

          <div className="full-width">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isAdmin ? "Publish Event" : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>

      <h2>{isAdmin ? "All events" : "Your department's events"} ({visible.length})</h2>
      {visible.map((event) => (
        <div className="card list-row" key={event.id}>
          <div>
            <strong>{event.title}</strong>
            <div className="muted small">
              {departmentLabel(event.department)} · {event.venue} · {event.date} at {event.time}
              {event.endTime ? "–" + event.endTime : ""} · {event.registered}/{event.capacity} registered
            </div>
          </div>
          <div className="row-right">
            <span className={"status status-" + event.status.toLowerCase()}>{event.status}</span>
            <button className="btn btn-danger btn-small" onClick={() => handleDelete(event)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ManageEvents;