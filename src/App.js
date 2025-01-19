import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RecordingsPage from "./Components/Recordings/Recordings"; // Updated import path
import RecordingLinksPage from "./Components/Recordings/RecordingLinks"; // Updated import path
import InsideRecording from "./Components/Recordings/InsideRecording"; // Updated import path

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RecordingsPage />} />
        <Route path="/recording-links" element={<RecordingLinksPage />} />
        <Route path="/inside-recording" element={<InsideRecording />} />
      </Routes>
    </Router>
  );
}

export default App;
