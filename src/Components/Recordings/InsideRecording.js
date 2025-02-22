import React, { useState } from "react";
import "./Recordings.css";

const InsideRecording = () => {
  const [recordings, setRecordings] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    link: "",
    description: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update a recording
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
      // Update existing recording
      const updatedRecordings = [...recordings];
      updatedRecordings[editingIndex] = formData;
      setRecordings(updatedRecordings);
      setEditingIndex(null);
    } else {
      // Add new recording
      if (formData.title && formData.date && formData.link) {
        setRecordings([...recordings, formData]);
      } else {
        alert("Please fill in all required fields!");
      }
    }
    // Clear the form
    setFormData({ title: "", date: "", link: "", description: "" });
  };

  // Edit a recording
  const handleEdit = (index) => {
    setFormData(recordings[index]);
    setEditingIndex(index);
  };

  // Delete a recording
  const handleDelete = (index) => {
    const updatedRecordings = recordings.filter((_, i) => i !== index);
    setRecordings(updatedRecordings);
  };

  return (
    <div className="inside-recording-management">
      <h2>Upload and Manage Recordings</h2>
      <form onSubmit={handleSubmit} className="inside-form-container">
        <input
          type="text"
          name="title"
          placeholder="Recording Title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          required
        />
        <input
          type="url"
          name="link"
          placeholder="Recording Link"
          value={formData.link}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          value={formData.description}
          onChange={handleInputChange}
        />
        <button type="submit" className="inside-add-recording-btn">
          {editingIndex !== null ? "Update Recording" : "Add Recording"}
        </button>
      </form>

      <div className="inside-recording-list">
        {recordings.length === 0 ? (
          <p className="inside-no-recordings">No recordings added yet.</p>
        ) : (
          recordings.map((recording, index) => (
            <div key={index} className="inside-recording-item">
              <h3>{recording.title}</h3>
              <p>
                <strong>Date:</strong> {new Date(recording.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Link:</strong>{" "}
                <a href={recording.link} target="_blank" rel="noopener noreferrer">
                  {recording.link}
                </a>
              </p>
              {recording.description && (
                <p>
                  <strong>Description:</strong> {recording.description}
                </p>
              )}
              <div className="recording-actions">
                <button onClick={() => handleEdit(index)}>Edit</button>
                <button onClick={() => handleDelete(index)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InsideRecording;