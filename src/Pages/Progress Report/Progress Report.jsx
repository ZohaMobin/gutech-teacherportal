import React, { useState } from "react";  // Import useState
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";
import "./Progress Report.css";

// Register the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const ProgressReport = () => {
  // Student data
  const data = [
    { name: "Student 1", roll: "BCS-543", attendance: "90%", gpa: 3.8, quizzes: "10/10", midExam: "20/25", finalExam: "30/30" },
    { name: "Student 2", roll: "BCS-543", attendance: "85%", gpa: 3.5, quizzes: "9/10", midExam: "19/25", finalExam: "28/30" },
    { name: "Student 3", roll: "BCS-543", attendance: "35%", gpa: 2.9, quizzes: "8/10", midExam: "16/25", finalExam: "22/30" },
    { name: "Student 4", roll: "BCS-543", attendance: "80%", gpa: 3.2, quizzes: "7/10", midExam: "18/25", finalExam: "25/30" },
    { name: "Student 5", roll: "BCS-543", attendance: "90%", gpa: 3.7, quizzes: "10/10", midExam: "20/25", finalExam: "28/30" },
    { name: "Student 6", roll: "BCS-543", attendance: "70%", gpa: 2.5, quizzes: "5/10", midExam: "12/25", finalExam: "15/30" },
    { name: "Student 7", roll: "BCS-543", attendance: "95%", gpa: 3.9, quizzes: "10/10", midExam: "22/25", finalExam: "30/30" },
    { name: "Student 8", roll: "BCS-543", attendance: "80%", gpa: 3.0, quizzes: "9/10", midExam: "19/25", finalExam: "23/30" },
    { name: "Student 9", roll: "BCS-543", attendance: "85%", gpa: 2.3, quizzes: "10/10", midExam: "20/25", finalExam: "27/30" },
  ];
  
  // State to store the selected class
  const [selectedClass, setSelectedClass] = useState(""); 

  // Handle class change
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  // Calculate average GPA
  const totalGpa = data.reduce((sum, row) => sum + parseFloat(row.gpa), 0);
  const averageGpa = (totalGpa / data.length).toFixed(2);

  // Find the highest and lowest GPA students
  const highestGpaStudent = data.reduce((max, student) => parseFloat(student.gpa) > parseFloat(max.gpa) ? student : max, data[0]);
  const lowestGpaStudent = data.reduce((min, student) => parseFloat(student.gpa) < parseFloat(min.gpa) ? student : min, data[0]);

  // Function to calculate total for each student
  const calculateTotal = (quizzes, midExam, finalExam) => {
    const quizScore = parseFloat(quizzes.split("/")[0]);
    const quizMax = parseFloat(quizzes.split("/")[1]);
    const midExamScore = parseFloat(midExam.split("/")[0]);
    const midExamMax = parseFloat(midExam.split("/")[1]);
    const finalExamScore = parseFloat(finalExam.split("/")[0]);
    const finalExamMax = parseFloat(finalExam.split("/")[1]);

    const totalScore = quizScore + midExamScore + finalExamScore;
    const totalMax = quizMax + midExamMax + finalExamMax;

    return `${totalScore}/${totalMax}`;
  };

  // Scatter chart data
  const scatterData = {
    datasets: [
      {
        label: 'Students',
        data: data.map((student, index) => ({
          x: index + 1,
          y: parseFloat(student.gpa),
          label: student.name,
        })),
        backgroundColor: data.map((student) => {
          const gpa = parseFloat(student.gpa);
          return gpa >= 3.5
            ? '#d4edda' // Green for GPA >= 3.5
            : gpa >= 3
            ? '#f8d7da' // Red for GPA >= 3
            : '#cce5ff'; // Blue for GPA < 3
        }),
        borderColor: data.map((student) => {
          const gpa = parseFloat(student.gpa);
          return gpa >= 3.5
            ? 'rgb(17, 128, 17)' // Dark Green for GPA >= 3.5
            : gpa >= 3
            ? 'rgba(128, 0, 0, 1)' // Dark Red for GPA >= 3
            : 'rgba(0, 0, 128, 1)'; // Dark Blue for GPA < 3
        }),
        borderWidth: 1, // Optional: Makes the borders more visible
      },
    ],
  };

  // Scatter plot options
  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.raw.label + " (" + tooltipItem.raw.y + ")";
          },
        },
      },
    },
    scales: {
      x: {
        display: false, // Hide the X-axis labels
      },
      y: {
        title: {
          display: true,
          text: "GPA",
        },
        beginAtZero: false,
        min: 0,
        max: 4,
      },
    },
  };

  return (
    <div>
      {/* Dropdown for class selection */}
      <div>
        <label htmlFor="classSelect">Select Class: </label>
        <select id="classSelect" value={selectedClass} onChange={handleClassChange}>
          <option value="">Select a Class</option>
          <option value="PSPF">PSPF</option>
          <option value="PSPF LAB">PSPF LAB</option>
          <option value="WEB TECH">WEB TECH</option>
          <option value="WEB TECH LAB">WEB TECH LAB</option>
        </select>
      </div>

      {/* Display selected class */}
      <p>You selected: {selectedClass || "No class selected"}</p>

      <div className="gpa-dashboard">
        {/* Scatter graph */}
        <div className="scatter-graph">
          <Scatter data={scatterData} options={options} />
        </div>

        {/* GPA info boxes */}
        <div className="gpa-info-box">
          <div className="gpa-box highest-gpa">
            <h3>Highest GPA</h3>
            <p>{highestGpaStudent.name} ({highestGpaStudent.gpa})</p>
          </div>
          <div className="gpa-box average-gpa">
            <h3>Average Class GPA</h3>
            <p>{averageGpa}</p>
          </div>
          <div className="gpa-box lowest-gpa">
            <h3>Lowest GPA</h3>
            <p>{lowestGpaStudent.name} ({lowestGpaStudent.gpa})</p>
          </div>
        </div>
      </div>

      {/* Table for students' data */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll</th>
            <th>Attendance</th>
            <th>GPA</th>
            <th>Quizzes</th>
            <th>Mid Exam</th>
            <th>Final Exam</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((student, index) => (
            <tr
              key={index}
              className={parseFloat(student.attendance.replace('%', '')) < 50 ? "low-attendance" : ""}
            >
              <td>{student.name}</td>
              <td>{student.roll}</td>
              <td>{student.attendance}</td>
              <td>{student.gpa}</td>
              <td>{student.quizzes}</td>
              <td>{student.midExam}</td>
              <td>{student.finalExam}</td>
              <td>{calculateTotal(student.quizzes, student.midExam, student.finalExam)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressReport;
