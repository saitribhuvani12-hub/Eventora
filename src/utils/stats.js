// src/utils/stats.js
// All dashboard numbers are calculated from the events data here.

// Today's date as YYYY-MM-DD (the same format used by event.date)
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

export function computeStats(events) {
  const today = todayString();
  const approved = events.filter((e) => e.status === "Approved");

  // Count each department once. "GEN" means campus-wide, so it is not counted.
  const departmentsUsed = new Set(
    approved.map((e) => e.department).filter((code) => code !== "GEN")
  );

  return {
    total: approved.length,
    upcoming: approved.filter((e) => e.date >= today).length,
    completed: approved.filter((e) => e.date < today).length,
    registrations: approved.reduce((sum, e) => sum + e.registered, 0),
    departments: departmentsUsed.size,
    pending: events.filter((e) => e.status === "Pending").length,
  };
}

// Registrations added up for each department (used by the bar chart)
export function registrationsByDepartment(events, departments) {
  return departments.map((d) => ({
    code: d.code,
    label: d.label,
    count: events
      .filter((e) => e.status === "Approved" && e.department === d.code)
      .reduce((sum, e) => sum + e.registered, 0),
  }));
}