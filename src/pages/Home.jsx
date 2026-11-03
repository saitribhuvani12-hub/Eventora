import StudentDashboard from "./StudentDashboard";
import FacultyDashboard from "./FacultyDashboard";
import AdminDashboard from "./AdminDashboard";

const welcome = {
  Student: "Find events by department, register in one click and keep your QR passes in one place.",
  Faculty: "Create events for your department and track their approval and registrations.",
  Admin: "Approve events, watch campus-wide participation and manage every department.",
};

// The Home page shows a different dashboard for each role
function Home({ user, events, registrations, updateEventStatus }) {
  const role = user.role;

  return (
    <div className="container">
      <div className="hero">
        <h1>Discover What's Happening on Campus</h1>
        <p>
          Welcome, {user.name}. {welcome[role]}
        </p>
      </div>

      {role === "Student" && (
        <StudentDashboard events={events} registrations={registrations} />
      )}
      {role === "Faculty" && <FacultyDashboard user={user} events={events} />}
      {role === "Admin" && (
        <AdminDashboard events={events} updateEventStatus={updateEventStatus} />
      )}
      
    </div>
  );
}

export default Home;