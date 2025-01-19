import React from "react";
import { useNavigate } from "react-router-dom";
import "./Recordings.css";

// Your recordings data
const recordingsData = [
  {
    title: "PSPF - Problem Solving and Fundamentals",
    instructor: "Sir Twaha Minai",
    lessons: 4,
    description: "Coding like poetry should be short and concise.",
    links: [
      { date: "2025-01-10", topic: "Introduction to PSPF", url: "https://www.loom.com/share/example1" },
      { date: "2025-01-11", topic: "Advanced Problem Solving", url: "https://www.loom.com/share/example2" },
      { date: "2025-01-12", topic: "Efficiency and Optimization", url: "https://www.loom.com/share/example12" },
      { date: "2025-01-13", topic: "Data Structures Overview", url: "https://www.loom.com/share/example13" },
    ],
  },
  {
    title: "Design Thinking",
    instructor: "Sir Rauf",
    lessons: 4,
    description: "A process for solving problems by prioritizing the consumer's needs above all else.",
    links: [
      { date: "2025-01-09", topic: "Introduction to Design Thinking", url: "https://www.loom.com/share/example3" },
      { date: "2025-01-10", topic: "Empathy Mapping", url: "https://www.loom.com/share/example14" },
      { date: "2025-01-11", topic: "Defining the Problem", url: "https://www.loom.com/share/example15" },
      { date: "2025-01-12", topic: "Ideation and Prototyping", url: "https://www.loom.com/share/example16" },
    ],
  },
  {
    title: "Web Technologies",
    instructor: "Sir Khubaib",
    lessons: 5,
    description: "The means by which computers communicate with each other using markup languages and multimedia packages.",
    links: [
      { date: "2025-01-08", topic: "Introduction to Web Technologies", url: "https://www.loom.com/share/example4" },
      { date: "2025-01-09", topic: "HTML Basics", url: "https://www.loom.com/share/example17" },
      { date: "2025-01-10", topic: "CSS Styling and Layout", url: "https://www.loom.com/share/example18" },
      { date: "2025-01-11", topic: "JavaScript Fundamentals", url: "https://www.loom.com/share/example19" },
      { date: "2025-01-12", topic: "Responsive Web Design", url: "https://www.loom.com/share/example5" },
    ],
  },
  {
    title: "Functional English",
    instructor: "Sir Ali Dossa",
    lessons: 2,
    description: "Usage of the English language required to perform a specific function like academic study or career progression.",
    links: [
      { date: "2025-01-07", topic: "Introduction to Functional English", url: "https://www.loom.com/share/example6" },
      { date: "2025-01-08", topic: "Writing Academic Papers", url: "https://www.loom.com/share/example20" },
    ],
  },
  {
    title: "Web Tech Lab",
    instructor: "Miss Zoha Mobin",
    lessons: 2,
    description: "Let's learn about colors, color contrast, and color styles.",
    links: [
      { date: "2025-01-06", topic: "Basic Color Theory", url: "https://www.loom.com/share/example7" },
      { date: "2025-01-07", topic: "Accessibility and Color Contrast", url: "https://www.loom.com/share/example21" },
    ],
  },
  {
    title: "Discrete Structures",
    instructor: "Sir Shahzad",
    lessons: 3,
    description: "Deals with the study of mathematical structures.",
    links: [
      { date: "2025-01-05", topic: "Introduction to Discrete Structures", url: "https://www.loom.com/share/example8" },
      { date: "2025-01-06", topic: "Set Theory", url: "https://www.loom.com/share/example22" },
      { date: "2025-01-13", topic: "Graph Theory", url: "https://www.loom.com/share/example9" },
    ],
  },
  {
    title: "PSPF-Lab",
    instructor: "Miss Zoha Mobin",
    lessons: 2,
    description: "Lab sessions focused on applying problem-solving techniques.",
    links: [
      { date: "2025-01-15", topic: "Lab 1: Basic Problem Solving", url: "https://www.loom.com/share/example10" },
      { date: "2025-01-16", topic: "Lab 2: Algorithm Design", url: "https://www.loom.com/share/example11" },
    ],
  },
];

const RecordingsPage = () => {
  const navigate = useNavigate();

  const handleWatchNow = (recording) => {
    navigate("/recording-links", { state: { recording } });
  };

  const handleUpload = (recording) => {
    // Navigate to the inside-recording route when the upload button is clicked
    navigate("/inside-recording");
  };

  return (
    <div className="recordings-container">
      <h1>Class Recordings</h1>
      <p>Access and review past class sessions</p>
      <div className="recordings-grid">
        {recordingsData.map((recording, index) => (
          <div className="recording-card" key={index}>
            <h3>{recording.title}</h3>
            <p>{recording.description}</p>
            <p>
              <strong>{recording.lessons} Lessons</strong>
            </p>
            <div className="recording-actions">
              <button
                className="watch-now"
                onClick={() => handleWatchNow(recording)}
              >
                Watch Now
              </button>
              <button
                className="upload-material"
                onClick={() => handleUpload(recording)}
              >
                Upload
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordingsPage;
