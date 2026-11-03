import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../api";
import {
  validateEmail,
  validateResetCode,
  validateNewPassword,
  validateConfirmPassword,
} from "../utils/validation";

const roleInfo = {
  student: { role: "Student", icon: "🎓" },
  faculty: { role: "Faculty", icon: "👩‍🏫" },
  admin: { role: "Admin", icon: "🛠️" },
};

function ForgotPassword({ theme, toggleTheme }) {
  const { roleKey } = useParams(); // student, faculty or admin from the web address

  const [step, setStep] = useState(1); // 1 = email, 2 = code and new password, 3 = done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [message, setMessage] = useState(null); // { ok, text }
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);

  const info = roleInfo[roleKey];
  if (!info) return <Navigate to="/" replace />;

  // Live validation, recalculated on every keystroke
  const errors = {
    email: validateEmail(email),
    code: validateResetCode(code),
    newPassword: validateNewPassword(newPassword),
    confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
  };

  function errorFor(field) {
    if (touched[field] && errors[field]) return errors[field];
    return serverErrors[field] || "";
  }

  function handleBlur(field) {
    setTouched({ ...touched, [field]: true });
  }

  // Clears the server message for a field when the user edits it
  function change(setter, field) {
    return (e) => {
      setter(e.target.value);
      setServerErrors({ ...serverErrors, [field]: "" });
      setMessage(null);
    };
  }

  // Step 1: ask the server to send a reset code
  async function requestCode(e) {
    if (e) e.preventDefault();

    setTouched({ ...touched, email: true });
    if (errors.email) {
      setMessage({ ok: false, text: "Please enter a valid email address." });
      return;
    }

    setBusy(true);
    const res = await api("POST", "/auth/forgot-password", { role: info.role, email });
    setBusy(false);

    if (!res.ok) {
      setServerErrors(res.data.errors || {});
      setMessage({ ok: false, text: res.data.message || "Something went wrong." });
      return;
    }

    setDemoCode(res.data.demoCode || "");
    setMessage({ ok: true, text: res.data.message });
    setServerErrors({});
    setTouched({});
    setStep(2);
  }

  // Step 2: send the code and the new password
  async function resetPassword(e) {
    e.preventDefault();

    setTouched({ ...touched, code: true, newPassword: true, confirmPassword: true });
    if (errors.code || errors.newPassword || errors.confirmPassword) {
      setMessage({ ok: false, text: "Please correct the highlighted fields." });
      return;
    }

    setBusy(true);
    const res = await api("POST", "/auth/reset-password", {
      role: info.role,
      email,
      code: code.trim(),
      newPassword,
      confirmPassword,
    });
    setBusy(false);

    if (!res.ok) {
      setServerErrors(res.data.errors || {});
      setMessage({ ok: false, text: res.data.message || "Something went wrong." });
      return;
    }

    setMessage({ ok: true, text: res.data.message });
    setStep(3);
  }

  function useDifferentEmail() {
    setStep(1);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setDemoCode("");
    setTouched({});
    setServerErrors({});
    setMessage(null);
  }

  return (
    <div className="auth-page">
      <div className="auth-top">
        <div className="nav-logo">🎓 Eventora</div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div className="auth-center">
        <div className="card login-card">
          <div className="role-icon">{step === 3 ? "✅" : info.icon}</div>
          <h1>{step === 3 ? "Password reset" : "Forgot Password"}</h1>
          <p className="muted">{info.role} account</p>

          {message && (
            <div className={message.ok ? "alert alert-ok" : "alert alert-error"}>
              {message.text}
            </div>
          )}

          {/* Step 1: email */}
          {step === 1 && (
            <form onSubmit={requestCode} className="form" noValidate>
              <label htmlFor="email">
                Registered email address <span className="required-star">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={change(setEmail, "email")}
                onBlur={() => handleBlur("email")}
                className={errorFor("email") ? "invalid" : ""}
                placeholder={"e.g. " + info.role.toLowerCase() + "@eventora.edu"}
                autoComplete="email"
              />
              {errorFor("email") && <div className="field-error">{errorFor("email")}</div>}

              <button type="submit" className="btn btn-primary login-btn" disabled={busy}>
                {busy ? "Sending..." : "Send reset code"}
              </button>
            </form>
          )}

          {/* Step 2: code and new password */}
          {step === 2 && (
            <>
              {demoCode && (
                <div className="demo-box">
                  <strong>Demo mode</strong>
                  <div className="small">
                    No email service is connected, so the reset code is shown here instead of
                    being emailed:
                  </div>
                  <div className="demo-code">{demoCode}</div>
                </div>
              )}

              <form onSubmit={resetPassword} className="form" noValidate>
                <div className="muted small">Code sent for: {email}</div>

                <label htmlFor="code">
                  Reset code <span className="required-star">*</span>
                </label>
                <input
                  id="code"
                  value={code}
                  onChange={change(setCode, "code")}
                  onBlur={() => handleBlur("code")}
                  className={errorFor("code") ? "invalid" : ""}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                {errorFor("code") && <div className="field-error">{errorFor("code")}</div>}

                <label htmlFor="newPassword">
                  New password <span className="required-star">*</span>
                </label>
                <input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={change(setNewPassword, "newPassword")}
                  onBlur={() => handleBlur("newPassword")}
                  className={errorFor("newPassword") ? "invalid" : ""}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <div className="muted small">Use 8 or more characters with at least one letter and one digit.</div>
                {errorFor("newPassword") && <div className="field-error">{errorFor("newPassword")}</div>}

                <label htmlFor="confirmPassword">
                  Confirm password <span className="required-star">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={change(setConfirmPassword, "confirmPassword")}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={errorFor("confirmPassword") ? "invalid" : ""}
                  placeholder="Type the new password again"
                  autoComplete="new-password"
                />
                {errorFor("confirmPassword") && (
                  <div className="field-error">{errorFor("confirmPassword")}</div>
                )}

                <button
                  type="button"
                  className="btn btn-small forgot-toggle"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? "Hide passwords" : "Show passwords"}
                </button>

                <button type="submit" className="btn btn-primary login-btn" disabled={busy}>
                  {busy ? "Resetting..." : "Reset password"}
                </button>
              </form>

              <div className="forgot-actions">
                <button type="button" className="bell-link" onClick={() => requestCode()}>
                  Send a new code
                </button>
                <button type="button" className="bell-link" onClick={useDifferentEmail}>
                  Use a different email
                </button>
              </div>
            </>
          )}

          {/* Step 3: finished */}
          {step === 3 && (
            <Link to={"/login/" + roleKey} className="btn btn-primary login-btn">
              Go to {info.role} login
            </Link>
          )}

          {step !== 3 && (
            <Link to={"/login/" + roleKey} className="back-link">
              ← Back to login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;