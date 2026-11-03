import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const roles = [
  {
    key: "student",
    icon: "🎓",
    title: "Student",
    text: "Discover events, register in one click and get your QR pass.",
  },
  {
    key: "faculty",
    icon: "👩‍🏫",
    title: "Faculty",
    text: "Manage events for your department and review proposals.",
  },
  {
    key: "admin",
    icon: "🛠️",
    title: "Admin",
    text: "Oversee all events, approvals, attendance and analytics.",
  },
];

function RoleSelect({ theme, toggleTheme }) {
  return (
    <div className="auth-page">
      <div className="auth-top">
        <div className="nav-logo">🎓 Eventora</div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div className="auth-center">
        <h1 className="auth-title">Discover What's Happening on Campus</h1>
        <p className="muted">Choose how you want to sign in.</p>

        <div className="role-grid">
          {roles.map((r) => (
            <Link to={"/login/" + r.key} className="card role-card" key={r.key}>
              <div className="role-icon">{r.icon}</div>
              <h2>{r.title} Login</h2>
              <p className="muted">{r.text}</p>
              <span className="btn btn-primary">Continue →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;