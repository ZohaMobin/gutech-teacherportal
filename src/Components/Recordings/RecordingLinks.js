import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaRegCalendarAlt } from "react-icons/fa";
import { FaRegCirclePlay } from "react-icons/fa6";
import "./RecordingLinks.css";

const RecordingLinksPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recording } = location.state || {}; // Fallback if recording is undefined

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  // Filter links based on search term and selected date
  const filteredLinks = recording
    ? recording.links.filter((link) => {
        const searchTermLower = searchTerm.toLowerCase();
        const linkTopic = link.topic ? link.topic.toLowerCase() : "";

        const isDateMatch =
          selectedDate &&
          new Date(link.date).toDateString() === selectedDate.toDateString();

        return (
          (!selectedDate || isDateMatch) &&
          (linkTopic.includes(searchTermLower) || searchTerm === "")
        );
      })
    : [];

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDate(null);
  };

  const handleUpload = () => {
    navigate("/inside-recording");
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
                <p className="recording-topic">{link.topic || "No Topic"}</p>
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

export default RecordingLinksPage;
