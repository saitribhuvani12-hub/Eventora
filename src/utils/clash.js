// src/utils/clash.js
// Looks for an already-approved event at the same venue, date and time.
// Returns that event if there is a clash, otherwise returns undefined.

export function findClash(event, events) {
  return events.find(
    (other) =>
      other.id !== event.id &&
      other.status === "Approved" &&
      other.venue === event.venue &&
      other.date === event.date &&
      other.time === event.time
  );
}