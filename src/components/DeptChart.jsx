import { departments } from "../data/events";
import { registrationsByDepartment } from "../utils/stats";

// Horizontal bar chart: registrations for each department
function DeptChart({ events }) {
  const data = registrationsByDepartment(events, departments);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card chart-card">
      <h2>Registrations by department</h2>
      {data.map((d) => (
        <div className="bar-row" key={d.code}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div
              className={"bar-fill dept-fill dept-" + d.code}
              style={{ width: (d.count / max) * 100 + "%" }}
            ></div>
          </div>
          <span className="bar-value">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default DeptChart;