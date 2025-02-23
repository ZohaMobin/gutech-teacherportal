import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaRegCalendarAlt, FaEllipsisV } from "react-icons/fa";
import { FaRegCirclePlay } from "react-icons/fa6";

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

// Recordings Page Component
const RecordingsPage = () => {
  const navigate = useNavigate();

  const handleWatchNow = (recording) => {
    navigate("/recording-links", { state: { recording } });
  };

  const handleUpload = () => {
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
              <button className="watch-now" onClick={() => handleWatchNow(recording)}>
                Watch Now
              </button>
              <button className="upload-material" onClick={handleUpload}>
                Upload
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recording Links Page Component
const RecordingLinksPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recording } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [links, setLinks] = useState(recording ? recording.links : []);

  // Filter links based on search term and selected date
  const filteredLinks = links.filter((link) => {
    const searchTermLower = searchTerm.toLowerCase();
    const linkTopic = link.topic ? link.topic.toLowerCase() : "";
    const isDateMatch =
      selectedDate &&
      new Date(link.date).toDateString() === selectedDate.toDateString();
    return (
      (!selectedDate || isDateMatch) &&
      (linkTopic.includes(searchTermLower) || searchTerm === "")
    );
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDate(null);
  };

  const handleUpload = () => {
    navigate("/inside-recording");
  };

  const handleDeleteLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
  };

  const handleEditLink = (index) => {
    setEditingLink(index);
  };

  const handleSaveEdit = (index, updatedLink) => {
    const updatedLinks = [...links];
    updatedLinks[index] = updatedLink;
    setLinks(updatedLinks);
    setEditingLink(null);
  };

  if (!recording) {
    return <p>No recording data found. Please navigate back to the recordings page.</p>;
  }

  return (
    <div className="recording-links-container">
      <h1>{recording.title}</h1>
      <h3>by {recording.instructor || "Unknown Instructor"}</h3>
      <div className="filter-container">
        <div className="search-bar-container">
          <div className="input-with-icon">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by topic or pick a date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />
            <FaRegCalendarAlt
              className="calendar-icon"
              onClick={() => document.querySelector(".date-picker-input").focus()}
            />
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              placeholderText=""
              className="date-picker-input"
            />
          </div>
          <button onClick={handleClearFilters} className="clear-button">
            Clear Filters
          </button>
        </div>
      </div>
      <div className="recording-links-upload-container">
        <button onClick={handleUpload} className="recording-links-upload-button">
          Upload Recording
        </button>
      </div>
      <div className="recordings-list">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((link, index) => (
            <div className="recording-item" key={index}>
              <div className="recording-info">
                <p className="recording-date">
                  {new Date(link.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {editingLink === index ? (
                  <EditLinkForm
                    link={link}
                    onSave={(updatedLink) => handleSaveEdit(index, updatedLink)}
                    onCancel={() => setEditingLink(null)}
                  />
                ) : (
                  <p className="recording-topic">{link.topic || "No Topic"}</p>
                )}
              </div>
              <div className="recording-actions">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="watch-recording-button"
                >
                  <FaRegCirclePlay />
                  Watch Recording
                </a>
                <div className="dropdown">
                  <button className="dropdown-button">
                    <FaEllipsisV />
                  </button>
                  <div className="dropdown-content">
                    <button onClick={() => handleEditLink(index)}>Edit</button>
                    <button onClick={() => handleDeleteLink(index)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No recordings found matching your search or filters.</p>
        )}
      </div>
    </div>
  );
};

// Edit Link Form Component
const EditLinkForm = ({ link, onSave, onCancel }) => {
  const [editedLink, setEditedLink] = useState({ ...link });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLink({ ...editedLink, [name]: value });
  };

  const handleSave = () => {
    onSave(editedLink);
  };

  return (
    <div className="edit-link-form">
      <input
        type="text"
        name="topic"
        placeholder="Topic"
        value={editedLink.topic}
        onChange={handleInputChange}
      />
      <input
        type="date"
        name="date"
        value={editedLink.date}
        onChange={handleInputChange}
      />
      <input
        type="url"
        name="url"
        placeholder="URL"
        value={editedLink.url}
        onChange={handleInputChange}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export { RecordingsPage, RecordingLinksPage };