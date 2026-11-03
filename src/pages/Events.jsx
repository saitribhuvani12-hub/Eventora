import { useState } from "react";
import EventCard from "../components/EventCard";
import { categories, departments } from "../data/events";
import { todayString } from "../utils/stats";

function Events({ events, role }) {
  // What the user has typed or selected
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All");
  const [sortBy, setSortBy] = useState("date");

  // 1. Only approved, upcoming events are shown
  const today = todayString();
  let shown = events.filter((e) => e.status === "Approved" && e.date >= today);

  // 2. Search by title
  shown = shown.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  // 3. Filter by category
  if (category !== "All") {
    shown = shown.filter((e) => e.category === category);
  }

  // 4. Filter by department
  if (department !== "All") {
    shown = shown.filter((e) => e.department === department);
  }

  // 5. Sort (copy the list first so the original is not changed)
  shown = [...shown].sort((a, b) => {
    if (sortBy === "popular") return b.registered - a.registered;
    return a.date.localeCompare(b.date); // soonest first
  });

  return (
    <div className="container">
      <h1>Upcoming Events</h1>

      <div className="chips">
        <button
          className={department === "All" ? "chip active" : "chip"}
          onClick={() => setDepartment("All")}
        >
          All Departments
        </button>
        {departments.map((d) => (
          <button
            key={d.code}
            className={department === d.code ? "chip active" : "chip"}
            onClick={() => setDepartment(d.code)}
            title={d.name}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sort: Soonest date</option>
          <option value="popular">Sort: Most popular</option>
        </select>
      </div>

      <p className="muted">{shown.length} event(s) found</p>

      {shown.length === 0 ? (
        <div className="card">No events match your search.</div>
      ) : (
        <div className="event-grid">
          {shown.map((event) => (
            <EventCard key={event.id} event={event} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;