// server/seedData.js
// The sample events, copied from the frontend. They are stored in the database
// the first time the server starts.

// Date (YYYY-MM-DD) a number of days from today, so events stay "upcoming".
function daysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// byFaculty: true means the demo faculty account created this event.
export function makeSeedEvents() {
  return [
    { title: "CodeSprint Hackathon", category: "Technical", department: "IT", date: daysFromToday(14), time: "09:00", venue: "Computer Lab 1", organizer: "Coding Club", description: "A 6-hour coding contest where teams solve real campus problems.", capacity: 60, registered: 42, status: "Approved", byFaculty: true },
    { title: "Annual Cultural Fest", category: "Cultural", department: "GEN", date: daysFromToday(22), time: "16:00", venue: "Open Air Theatre", organizer: "Cultural Committee", description: "Music, dance and drama performances by students of all departments.", capacity: 300, registered: 210, status: "Approved" },
    { title: "Inter-Department Cricket Cup", category: "Sports", department: "GEN", date: daysFromToday(17), time: "08:00", venue: "Sports Ground", organizer: "Sports Department", description: "Knockout cricket tournament between all departments.", capacity: 120, registered: 96, status: "Approved" },
    { title: "AI and Future Careers Seminar", category: "Seminar", department: "AIDS", date: daysFromToday(16), time: "10:00", venue: "Seminar Hall", organizer: "AI & DS Department", description: "Industry speakers talk about careers in AI and data science.", capacity: 150, registered: 88, status: "Approved" },
    { title: "Web Development Workshop", category: "Workshop", department: "IT", date: daysFromToday(20), time: "11:00", venue: "Computer Lab 1", organizer: "IT Department", description: "Hands-on workshop to build a website using HTML, CSS and React.", capacity: 40, registered: 38, status: "Approved", byFaculty: true },
    { title: "Photography Workshop", category: "Workshop", department: "GEN", date: daysFromToday(16), time: "10:00", venue: "Seminar Hall", organizer: "Photography Club", description: "Learn composition and lighting basics from a professional photographer.", capacity: 50, registered: 0, status: "Pending", byFaculty: true },
    { title: "Startup Pitch Day", category: "Seminar", department: "GEN", date: daysFromToday(27), time: "14:00", venue: "Main Auditorium", organizer: "E-Cell", description: "Student teams pitch startup ideas to a panel of mentors.", capacity: 200, registered: 0, status: "Pending", byFaculty: true },
    { title: "Midnight Gaming Night", category: "Cultural", department: "CSE", date: daysFromToday(24), time: "22:00", venue: "Computer Lab 1", organizer: "Gaming Club", description: "Late-night gaming event in the computer lab.", capacity: 30, registered: 0, status: "Rejected" },
    { title: "Circuit Design Challenge", category: "Technical", department: "ECE", date: daysFromToday(18), time: "10:00", venue: "Electronics Lab", organizer: "ECE Department", description: "Design and test a working circuit within two hours.", capacity: 50, registered: 31, status: "Approved" },
    { title: "Renewable Energy Expo", category: "Technical", department: "EEE", date: daysFromToday(21), time: "10:00", venue: "Main Auditorium", organizer: "EEE Association", description: "Student models and talks on solar, wind and smart-grid technology.", capacity: 120, registered: 64, status: "Approved" },
    { title: "Robotics and CAD Workshop", category: "Workshop", department: "MECH", date: daysFromToday(19), time: "14:00", venue: "Mechanical Workshop", organizer: "Mechanical Department", description: "Build a simple robot arm and learn the basics of CAD design.", capacity: 45, registered: 29, status: "Approved" },
    { title: "Smart Cities Seminar", category: "Seminar", department: "CIVIL", date: daysFromToday(23), time: "11:00", venue: "Seminar Hall", organizer: "Civil Department", description: "How planning and sustainable construction shape smart cities.", capacity: 100, registered: 47, status: "Approved" },
    { title: "Machine Learning Bootcamp", category: "Workshop", department: "CSE", date: daysFromToday(25), time: "09:30", venue: "Computer Lab 1", organizer: "CSE Department", description: "A beginner-friendly bootcamp on building your first ML model.", capacity: 60, registered: 35, status: "Approved" },
    { title: "Data Science Quiz", category: "Technical", department: "AIDS", date: daysFromToday(28), time: "15:00", venue: "Seminar Hall", organizer: "AI & DS Association", description: "A team quiz on statistics, data and machine learning concepts.", capacity: 80, registered: 0, status: "Pending", byFaculty: true },
    { title: "Freshers Welcome Meet", category: "Cultural", department: "GEN", date: daysFromToday(-12), time: "10:00", venue: "Main Auditorium", organizer: "Student Council", description: "A welcome event with games, music and campus introductions for new students.", capacity: 250, registered: 180, status: "Approved" },
    { title: "Python Programming Workshop", category: "Workshop", department: "CSE", date: daysFromToday(-20), time: "10:00", venue: "Computer Lab 1", organizer: "CSE Department", description: "A hands-on introduction to Python for first-year students.", capacity: 60, registered: 52, status: "Approved" },
    { title: "Structural Design Contest", category: "Technical", department: "CIVIL", date: daysFromToday(-6), time: "10:00", venue: "Seminar Hall", organizer: "Civil Department", description: "Teams design and test a bridge model built from simple materials.", capacity: 60, registered: 44, status: "Approved" },
  ];
}