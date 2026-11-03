// src/utils/validation.js
// The same rules the server uses, so the browser can warn the student early.

export function cleanName(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateName(value) {
  const name = cleanName(value);
  if (!name) return "Student name is required.";
  if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(name)) {
    return "Name can contain only alphabets and spaces.";
  }
  if (name.length < 2 || name.length > 60) {
    return "Name must be between 2 and 60 characters.";
  }
  return "";
}

export function validateRollNo(value) {
  const rollNo = value.trim();
  if (!rollNo) return "Roll number is required.";
  if (!/^\d+$/.test(rollNo)) return "Roll number can contain only digits.";
  if (rollNo.length < 4 || rollNo.length > 15) {
    return "Roll number must be 4 to 15 digits long.";
  }
  return "";
}

export function validateEmail(value) {
  const email = value.trim().toLowerCase();
  const pattern =
    /^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/;
  if (!email) return "Email address is required.";
  if (email.length > 100 || !pattern.test(email)) {
    return "Enter a valid email, for example name@gmail.com.";
  }
  return "";
}

// Checks all three fields and returns one message per field
export function validateRegistrationForm(form) {
  return {
    name: validateName(form.name),
    rollNo: validateRollNo(form.rollNo),
    email: validateEmail(form.email),
  };
}

// ---------- Forgot password form ----------

export function validateResetCode(value) {
  const code = value.trim();
  if (!code) return "Reset code is required.";
  if (!/^\d{6}$/.test(code)) return "Reset code must be exactly 6 digits.";
  return "";
}

export function validateNewPassword(value) {
  if (!value) return "New password is required.";
  if (value.length < 8 || value.length > 72) {
    return "Password must be 8 to 72 characters long.";
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Password must contain at least one letter and one digit.";
  }
  return "";
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return "Please confirm your new password.";
  if (confirm !== password) return "Passwords do not match.";
  return "";
}