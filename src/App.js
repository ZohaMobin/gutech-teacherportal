import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import TeacherEventCalendar from './Pages/EventCalendar/EventCalendar'; // 

function App() {
  return (
    <Router>
          {/* Routes */}
          <Routes>
            <Route path="/calendar" element={<TeacherEventCalendar />} />
          </Routes>
    </Router>
  );
}

export default App;
