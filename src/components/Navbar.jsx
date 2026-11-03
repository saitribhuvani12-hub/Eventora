import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

// Which menu links each role can see
const linksByRole = {
  Student: [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/blog", label: "Community Blog" },
    { to: "/my-registrations", label: "My Registrations" },
  ],
  Faculty: [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/blog", label: "Community Blog" },
    { to: "/manage", label: "Manage Events" },
  ],
  Admin: [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/blog", label: "Community Blog" },
    { to: "/manage", label: "Manage Events" },
    { to: "/approvals", label: "Approvals" },
    { to: "/dashboard", label: "Analytics" },
    { to: "/checkin", label: "Check-in" },
  ],
};

function Navbar({
  user,
  onLogout,
  theme,
  toggleTheme,
  notifications,
  unreadCount,
  onRefreshNotifications,
  onMarkRead,
  onMarkAllRead,
}) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="nav-logo">🎓 Eventora</div>

      <div className="nav-links">
        {linksByRole[user.role].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-user">
        {user.role === "Faculty" && (
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onOpen={onRefreshNotifications}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
          />
        )}
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <span className="user-chip">
          {user.name} · {user.role}
        </span>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;