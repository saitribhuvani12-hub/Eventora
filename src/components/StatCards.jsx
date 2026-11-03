// Five statistic cards shown on the Student and Admin dashboards
function StatCards({ stats }) {
  const items = [
    { icon: "📅", value: stats.total, label: "Total Events" },
    { icon: "🚀", value: stats.upcoming, label: "Upcoming Events" },
    { icon: "🎟️", value: stats.registrations, label: "Total Registrations" },
    { icon: "🏛️", value: stats.departments, label: "Participating Departments" },
    { icon: "✅", value: stats.completed, label: "Completed Events" },
  ];

  return (
    <div className="stats">
      {items.map((item) => (
        <div className="card stat" key={item.label}>
          <div className="stat-icon">{item.icon}</div>
          <h2>{item.value}</h2>
          <p>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default StatCards;