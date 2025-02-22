import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RecordingsPage, RecordingLinksPage } from "./Components/Recordings/Recordings"; // Import components
import InsideRecording from "./Components/Recordings/InsideRecording"; // If this exists

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RecordingsPage />} /> {/* Default route */}
        <Route path="/recording-links" element={<RecordingLinksPage />} /> {/* Route for RecordingLinksPage */}
        <Route path="/inside-recording" element={<InsideRecording />} /> {/* Route for InsideRecording */}
      </Routes>
    </Router>
  );
}

export default App;