// server/validators.js
// Checks the three student registration fields.
// Returns { errors, value }. If "errors" is empty, "value" holds the clean data.

export function validateRegistration(body) {
  const errors = {};

  // Name: alphabets and spaces only
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  if (!name) {
    errors.name = "Student name is required.";
  } else if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(name)) {
    errors.name = "Name can contain only alphabets and spaces.";
  } else if (name.length < 2 || name.length > 60) {
    errors.name = "Name must be between 2 and 60 characters.";
  }

  // Roll number: digits only
  const rollNo = String(body.rollNo ?? "").trim();
  if (!rollNo) {
    errors.rollNo = "Roll number is required.";
  } else if (!/^\d+$/.test(rollNo)) {
    errors.rollNo = "Roll number can contain only digits.";
  } else if (rollNo.length < 4 || rollNo.length > 15) {
    errors.rollNo = "Roll number must be 4 to 15 digits long.";
  }

  // Email: name@domain.extension
  const email = String(body.email ?? "").trim().toLowerCase();
  const emailPattern =
    /^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/;
  if (!email) {
    errors.email = "Email address is required.";
  } else if (email.length > 100 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email, for example name@gmail.com.";
  }

  return { errors, value: { name, rollNo, email } };
}

// ---------- Used by the forgot-password routes ----------
const EMAIL_PATTERN =
  /^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/;

// Returns { error } or { value } (the cleaned email)
export function checkEmail(input) {
  const email = String(input ?? "").trim().toLowerCase();
  if (!email) return { error: "Email address is required." };
  if (email.length > 100 || !EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email, for example name@gmail.com." };
  }
  return { value: email };
}

// Returns an object with a message for each wrong field (empty if all is fine)
export function checkNewPassword(password, confirm) {
  const errors = {};
  const pw = String(password ?? "");
  const conf = String(confirm ?? "");

  if (!pw) errors.newPassword = "New password is required.";
  else if (pw.length < 8 || pw.length > 72) {
    errors.newPassword = "Password must be 8 to 72 characters long.";
  } else if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    errors.newPassword = "Password must contain at least one letter and one digit.";
  }

  if (!conf) errors.confirmPassword = "Please confirm your new password.";
  else if (conf !== pw) errors.confirmPassword = "Passwords do not match.";

  return errors;
}