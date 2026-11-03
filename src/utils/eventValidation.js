// src/utils/eventValidation.js
// The rules for every mandatory field of an event.
// The server (routes/events.js) checks the same rules again.

import { categories, venues, departments } from "../data/events";

function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(text + "T00:00:00Z");
  return !isNaN(parsed) && parsed.toISOString().slice(0, 10) === text;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Returns an object with a message for each wrong field (empty if all is fine)
export function validateEventForm(form, today) {
  const errors = {};

  const title = form.title.trim();
  const description = form.description.trim();
  const organizer = form.organizer.trim();
  const coordinator = form.coordinator.trim();
  const capacity = form.capacity.trim();

  if (!title) errors.title = "Event name is required.";
  else if (title.length < 3 || title.length > 100) errors.title = "Event name must be 3 to 100 characters.";

  if (!description) errors.description = "Event description is required.";
  else if (description.length < 10 || description.length > 500) {
    errors.description = "Description must be 10 to 500 characters.";
  }

  if (!organizer) errors.organizer = "Organizer is required.";
  else if (organizer.length < 2 || organizer.length > 80) errors.organizer = "Organizer must be 2 to 80 characters.";

  if (!coordinator) errors.coordinator = "Faculty coordinator is required.";
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(coordinator) || coordinator.length < 2 || coordinator.length > 60) {
    errors.coordinator = "Enter a valid name (letters, spaces, dots and hyphens only).";
  }

  if (!categories.includes(form.category)) errors.category = "Please select a category.";
  if (!departments.some((d) => d.code === form.department)) errors.department = "Please select a department.";
  if (!venues.includes(form.venue)) errors.venue = "Please select a venue.";

  if (!form.date) errors.date = "Event date is required.";
  else if (!isRealDate(form.date)) errors.date = "Please enter a valid event date.";
  else if (form.date < today) errors.date = "Event date cannot be in the past.";

  if (!form.time) errors.time = "Start time is required.";
  else if (!TIME_PATTERN.test(form.time)) errors.time = "Please enter a valid start time.";

  if (!form.endTime) errors.endTime = "End time is required.";
  else if (!TIME_PATTERN.test(form.endTime)) errors.endTime = "Please enter a valid end time.";
  else if (TIME_PATTERN.test(form.time) && form.endTime <= form.time) {
    errors.endTime = "End time must be after the start time.";
  }

  const deadline = form.registrationDeadline;
  if (!deadline) errors.registrationDeadline = "Registration deadline is required.";
  else if (!isRealDate(deadline)) errors.registrationDeadline = "Please enter a valid registration deadline.";
  else if (deadline < today) errors.registrationDeadline = "Registration deadline cannot be in the past.";
  else if (isRealDate(form.date) && deadline > form.date) {
    errors.registrationDeadline = "Registration deadline must be on or before the event date.";
  }

  if (!capacity) errors.capacity = "Maximum participants is required.";
  else if (!/^\d+$/.test(capacity) || Number(capacity) < 1 || Number(capacity) > 5000) {
    errors.capacity = "Maximum participants must be a whole number between 1 and 5000.";
  }

  return errors;
}