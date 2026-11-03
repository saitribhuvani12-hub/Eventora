import { useState, useEffect, useCallback } from "react";
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
import Blog from "./pages/Blog";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import { api, getToken, setToken } from "./api";

// Read the saved theme from the browser (or use a default)
function loadSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [user, setUser] = useState(null); // the logged-in user, from the server
  const [booting, setBooting] = useState(Boolean(getToken())); // checking a saved login
  const [theme, setTheme] = useState(() => loadSaved("eventora-theme", "light"));
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  // ---------- Theme ----------
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("eventora-theme", JSON.stringify(theme));
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // ---------- Keep the user logged in after a refresh ----------
  useEffect(() => {
    if (!getToken()) return;
    api("GET", "/auth/me").then((res) => {
      if (res.ok) setUser(res.data.user);
      else if (res.status === 401) setToken(null);
      setBooting(false);
    });
  }, []);

  // If the server says our login is no longer valid, log out
  useEffect(() => {
    function onUnauthorized() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("eventora-unauthorized", onUnauthorized);
    return () => window.removeEventListener("eventora-unauthorized", onUnauthorized);
  }, []);

  // ---------- Loading data from the server ----------
  const refreshEvents = useCallback(async () => {
    const res = await api("GET", "/events");
    if (res.ok) {
      setEvents(res.data.events);
      setLoadError("");
    } else if (res.status === 0) {
      setLoadError(res.data.message);
    }
  }, []);

  const refreshRegistrations = useCallback(async () => {
    if (!user) return;
    if (user.role === "Student") {
      const res = await api("GET", "/registrations/mine");
      if (res.ok) setRegistrations(res.data.registrations);
    } else if (user.role === "Admin") {
      const res = await api("GET", "/registrations");
      if (res.ok) setRegistrations(res.data.registrations);
    } else {
      setRegistrations([]);
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user || user.role !== "Faculty") return;
    const res = await api("GET", "/notifications");
    if (res.ok) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
  }, [user]);

  // Load everything when someone logs in. Clear everything when they log out.
  useEffect(() => {
    if (!user) {
      setEvents([]);
      setRegistrations([]);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refreshEvents();
    refreshRegistrations();
    refreshNotifications();
  }, [user, refreshEvents, refreshRegistrations, refreshNotifications]);

  // Faculty: check for new notifications every 15 seconds
  useEffect(() => {
    if (!user || user.role !== "Faculty") return;
    const timer = setInterval(refreshNotifications, 15000);
    return () => clearInterval(timer);
  }, [user, refreshNotifications]);

  // ---------- Login and logout ----------
  async function login(role, identifier, password) {
    const res = await api("POST", "/auth/login", { role, identifier, password });
    if (!res.ok) {
      return { ok: false, message: res.data.message || "Login failed." };
    }
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  // ---------- Student registers for an event ----------
  async function registerForEvent(eventId, student) {
    const res = await api("POST", "/registrations", { eventId, ...student });
    if (!res.ok) {
      return {
        ok: false,
        message: res.data.message || "Registration failed.",
        errors: res.data.errors || {},
      };
    }
    await Promise.all([refreshEvents(), refreshRegistrations()]);
    return { ok: true, message: res.data.message, registration: res.data.registration };
  }

  // ---------- Student cancels a registration ----------
  async function cancelRegistration(passId) {
    const res = await api("DELETE", "/registrations/" + passId);
    if (res.ok) await Promise.all([refreshEvents(), refreshRegistrations()]);
    return { ok: res.ok, message: res.data.message };
  }

  // ---------- Admin approves or rejects an event ----------
  async function updateEventStatus(eventId, newStatus) {
    const res = await api("PATCH", "/events/" + eventId + "/status", { status: newStatus });
    if (res.ok) await refreshEvents();
    return { ok: res.ok, message: res.data.message || "Something went wrong." };
  }

  // ---------- Faculty submits an event, Admin publishes one ----------
    async function addEvent(data) {
    const res = await api("POST", "/events", data);
    if (res.ok) await refreshEvents();
    return {
      ok: res.ok,
      message: res.data.message || "Something went wrong.",
      errors: res.data.errors || {},
    };
  }

  // ---------- Delete an event ----------
  async function deleteEvent(eventId) {
    const res = await api("DELETE", "/events/" + eventId);
    if (res.ok) await Promise.all([refreshEvents(), refreshRegistrations()]);
    return { ok: res.ok, message: res.data.message };
  }

  // ---------- Admin checks a pass in (simulated QR scan) ----------
  async function checkInRegistration(passId) {
    const res = await api("POST", "/registrations/checkin", { passId });
    if (res.ok) await refreshRegistrations();
    return { ok: res.ok, text: res.data.message || "Something went wrong." };
  }

  // ---------- Faculty notifications (the bell is added in the next stage) ----------
  async function markNotificationRead(id) {
    await api("PATCH", "/notifications/" + id + "/read");
    await refreshNotifications();
  }

  async function markAllNotificationsRead() {
    await api("PATCH", "/notifications/read-all");
    await refreshNotifications();
  }

  // ---------- Still checking the saved login ----------
  if (booting) {
    return (
      <div className="container">
        <p className="muted">Loading Eventora...</p>
      </div>
    );
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
          <Route
          path="/forgot-password/:roleKey"
          element={<ForgotPassword theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ---------- Logged in: show the app for this user's role ----------
  const role = user.role;

  return (
    <>
            <Navbar
        user={user}
        onLogout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefreshNotifications={refreshNotifications}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />

      {loadError && (
        <div className="container">
          <div className="alert alert-error">{loadError}</div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              events={events}
              registrations={registrations}
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
        <Route path="/blog" element={<Blog user={user} events={events} />} />
        <Route path="/login/:roleKey" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;