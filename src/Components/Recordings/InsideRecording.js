import React, { useState } from "react";
import "./InsideRecording.css";

function InsideRecording() {
  const [recordings, setRecordings] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    link: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addRecording = () => {
    if (formData.title && formData.date && formData.link) {
      setRecordings([...recordings, formData]);
      setFormData({ title: "", date: "", link: "", description: "" });
    } else {
      alert("Please fill in all required fields!");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="inside-recording-management">
      <h2> Here You Can Upload Your Recordings</h2>
      <div className="inside-form-container">
        <input
          type="text"
          name="title"
          placeholder="Recording Title"
          value={formData.title}
          onChange={handleInputChange}
          className="inside-form-input"
        />
        <input
          type="date"
          name="date"
          placeholder="Recording Date"
          value={formData.date}
          onChange={handleInputChange}
          className="inside-form-input"
        />
        <input
          type="url"
          name="link"
          placeholder="Enter Recording Link"
          value={formData.link}
          onChange={handleInputChange}
          className="inside-form-input"
        />
        <input
          type="text"
          name="description"
          placeholder="Enter Topic"
          value={formData.description}
          onChange={handleInputChange}
          className="inside-form-input"
        />
        <button className="inside-add-recording-btn" onClick={addRecording}>
          + Add Recording
        </button>
      </div>

      {recordings.length === 0 ? (
        <p className="inside-no-recordings">
          No recordings added yet. Add your first recording above.
        </p>
      ) : (
        <ul className="inside-recording-list">
          {recordings.map((recording, index) => (
            <li key={index} className="inside-recording-item">
              <strong>{recording.title}</strong> ({formatDate(recording.date)})<br />
              <a
                href={recording.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {recording.link}
              </a>
              {recording.description && <p>{recording.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InsideRecording;
