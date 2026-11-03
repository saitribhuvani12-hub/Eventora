import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
// Shown only as a convenience for the demo. The real check happens on the server.
const demoLogins = {
  Student: { username: "student", password: "student123" },
  Faculty: { username: "faculty", password: "faculty123" },
  Admin: { username: "admin", password: "admin123" },
};

const roleInfo = {
  student: { role: "Student", icon: "🎓", text: "Sign in to browse and register for events." },
  faculty: { role: "Faculty", icon: "👩‍🏫", text: "Sign in to manage your department's events." },
  admin: { role: "Admin", icon: "🛠️", text: "Sign in to manage all campus events." },
};

function Login({ onLogin, theme, toggleTheme }) {
  const { roleKey } = useParams(); // student, faculty or admin from the web address
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const info = roleInfo[roleKey];
  if (!info) return <Navigate to="/" replace />;

    const demo = demoLogins[info.role];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      setError("Please enter both your email/username and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

        const result = await onLogin(info.role, identifier, password);
    if (!result.ok) setError(result.message);
    // On success, App.jsx stores the user and shows the dashboard automatically.
  }

  function fillDemo() {
    setIdentifier(demo.username);
    setPassword(demo.password);
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-top">
        <div className="nav-logo">🎓 Eventora</div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div className="auth-center">
        <div className="card login-card">
          <div className="role-icon">{info.icon}</div>
          <h1>{info.role} Login</h1>
          <p className="muted">{info.text}</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form">
            <label>Email or username</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={demo.username}
              autoComplete="username"
            />

            <label>Password</label>
            <div className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
              <Link to={"/forgot-password/" + roleKey} className="forgot-link">
              Forgot Password?
            </Link>

            <button type="submit" className="btn btn-primary login-btn">
              Login
            </button>
          </form>

          <div className="demo-box">
            <strong>Demo account</strong>
            <div className="small">
              Username: <code>{demo.username}</code> · Password: <code>{demo.password}</code>
            </div>
            <button type="button" className="btn btn-small" onClick={fillDemo}>
              Fill demo login
            </button>
          </div>

          <Link to="/" className="back-link">← Choose a different role</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;