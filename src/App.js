import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from "../src/Pages/Sidebar/sidebar/index";

import Dashboard from './Pages/dashboard/dashboard';
import { Topbar } from './Pages/topbar/topbar';
import GradingPage from './Pages/Teacher_Grading/Teacher_Gradings';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className='mainContent '>
  <Topbar/>
  <div className='content'>
        <Routes >

          <Route path="/" element={<Dashboard/>} /> 
      <Route path="/Teacher_Gradings" element={<GradingPage/>}/>
      
        </Routes>
        </div>
        </div>
      </div>
    </Router>
  );
}

export default App;



