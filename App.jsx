import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import MyRegistrations from "./pages/MyRegistrations";
import Approvals from "./pages/Approvals";
import ManageEvents from "./pages/ManageEvents";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import { initialEvents } from "./data/events";
import { checkLogin } from "./data/users";
import { findClash } from "./utils/clash";

// Read saved data from the browser (or use a default)
function loadSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  // The logged-in user (null means nobody is logged in)
  const [user, setUser] = useState(() => loadSaved("eventora-user", null));
  const [theme, setTheme] = useState(() => loadSaved("eventora-theme", "light"));
  const [events, setEvents] = useState(() => loadSaved("eventora-events-v3", initialEvents));
  const [registrations, setRegistrations] = useState(() => loadSaved("eventora-registrations-v3", []));

  // Apply the theme to the whole page and remember it
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("eventora-theme", JSON.stringify(theme));
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // Save to the browser whenever data changes
  useEffect(() => {
    localStorage.setItem("eventora-user", JSON.stringify(user));
  }, [user]);
  useEffect(() => {
    localStorage.setItem("eventora-events-v3", JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem("eventora-registrations-v3", JSON.stringify(registrations));
  }, [registrations]);

  // ---------- Login and logout ----------
  function login(role, identifier, password) {
    const found = checkLogin(role, identifier, password);
    if (!found) {
      return { ok: false, message: "Incorrect email/username or password." };
    }
    setUser(found);
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  // ---------- Student registers for an event ----------
  function registerForEvent(eventId, student) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { ok: false, message: "Event not found." };

    if (event.registered >= event.capacity) {
      return { ok: false, message: "Sorry, this event is full." };
    }

    const duplicate = registrations.some(
      (r) => r.eventId === eventId && r.rollNo.toLowerCase() === student.rollNo.toLowerCase()
    );
    if (duplicate) {
      return { ok: false, message: "This roll number is already registered for this event." };
    }

    const newRegistration = {
      id: "REG-" + Date.now(),
      eventId: eventId,
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      checkedIn: false,
    };

    setRegistrations([...registrations, newRegistration]);
    setEvents(
      events.map((e) => (e.id === eventId ? { ...e, registered: e.registered + 1 } : e))
    );

    return { ok: true, message: "Registration successful! Your pass is below.", registration: newRegistration };
  }

  // ---------- Student cancels a registration ----------
  function cancelRegistration(regId) {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;
    setRegistrations(registrations.filter((r) => r.id !== regId));
    setEvents(
      events.map((e) => (e.id === reg.eventId ? { ...e, registered: e.registered - 1 } : e))
    );
  }

  // ---------- Admin approves or rejects an event ----------
  function updateEventStatus(eventId, newStatus) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { ok: false, message: "Event not found." };

    // Re-check for a clash before approving
    if (newStatus === "Approved") {
      const clash = findClash(event, events);
      if (clash) {
        return {
          ok: false,
          message: "Cannot approve: clashes with " + clash.title + " at the same venue and time.",
        };
      }
    }

    setEvents(events.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e)));

    return {
      ok: true,
      message:
        '"' + event.title + '" was ' + newStatus.toLowerCase() +
        ". Notification sent to " + event.organizer + " (simulated).",
    };
  }

  // ---------- Faculty submits an event (Pending) or Admin publishes one (Approved) ----------
  function addEvent(data) {
    const newId = events.length ? Math.max(...events.map((e) => e.id)) + 1 : 1;
    const status = data.status || "Pending";
    const newEvent = { ...data, id: newId, registered: 0, status: status };
    setEvents([...events, newEvent]);

    return {
      ok: true,
      message:
        status === "Approved"
          ? '"' + data.title + '" was published and is now visible to students.'
          : '"' + data.title + '" was submitted. It is now waiting for Admin approval.',
    };
  }

  // ---------- Delete an event and its registrations ----------
  function deleteEvent(eventId) {
    setEvents(events.filter((e) => e.id !== eventId));
    setRegistrations(registrations.filter((r) => r.eventId !== eventId));
  }

  // ---------- Mark a registration as checked in (simulated QR scan) ----------
  function checkInRegistration(regId) {
    if (!regId) return { ok: false, text: "Enter a Pass ID first." };
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return { ok: false, text: "Invalid pass: no registration found with this ID." };
    if (reg.checkedIn) return { ok: false, text: reg.name + " is already checked in." };

    setRegistrations(
      registrations.map((r) => (r.id === regId ? { ...r, checkedIn: true } : r))
    );
    return { ok: true, text: "✅ " + reg.name + " checked in successfully." };
  }

  // ---------- Put the demo data back to the original state ----------
  function resetDemo() {
    if (window.confirm("Reset all demo data?")) {
      setEvents(initialEvents);
      setRegistrations([]);
    }
  }

  // ---------- Not logged in: show only the role page and login pages ----------
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<RoleSelect theme={theme} toggleTheme={toggleTheme} />} />
        <Route
          path="/login/:roleKey"
          element={<Login onLogin={login} theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ---------- Logged in: show the app for this user's role ----------
  const role = user.role;

  return (
    <>
      <Navbar user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              events={events}
              registrations={registrations}
              onReset={resetDemo}
              updateEventStatus={updateEventStatus}
            />
          }
        />
        <Route path="/events" element={<Events events={events} role={role} />} />
        <Route
          path="/events/:id"
          element={<EventDetails events={events} role={role} registerForEvent={registerForEvent} />}
        />
        <Route
          path="/my-registrations"
          element={
            <MyRegistrations
              registrations={registrations}
              events={events}
              cancelRegistration={cancelRegistration}
            />
          }
        />
        <Route
          path="/approvals"
          element={<Approvals events={events} role={role} updateEventStatus={updateEventStatus} />}
        />
        <Route
          path="/manage"
          element={
            <ManageEvents
              events={events}
              role={role}
              user={user}
              addEvent={addEvent}
              deleteEvent={deleteEvent}
            />
          }
        />
        <Route
          path="/dashboard"
          element={<Dashboard events={events} registrations={registrations} role={role} />}
        />
        <Route
          path="/checkin"
          element={
            <CheckIn
              events={events}
              registrations={registrations}
              role={role}
              checkInRegistration={checkInRegistration}
            />
          }
        />
        <Route path="/login/:roleKey" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;