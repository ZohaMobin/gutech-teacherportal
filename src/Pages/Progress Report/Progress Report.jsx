import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";
import "./Progress Report.css";

// Register the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const ProgressReport = () => {
  const data = [
    { name: "Student 1", roll: "BCS-543", attendance: "90%", gpa: "3.8", quizzes: "10/10", midExam: "20/25", finalExam: "30/30" },
    { name: "Student 2", roll: "BCS-543", attendance: "85%", gpa: "3.5", quizzes: "9/10", midExam: "19/25", finalExam: "28/30" },
    { name: "Student 3", roll: "BCS-543", attendance: "75%", gpa: "2.9", quizzes: "8/10", midExam: "16/25", finalExam: "22/30" },
    { name: "Student 9", roll: "BCS-543", attendance: "45%", gpa: "3.3", quizzes: "10/10", midExam: "20/25", finalExam: "27/30" },
    { name: "Student 4", roll: "BCS-543", attendance: "80%", gpa: "3.2", quizzes: "7/10", midExam: "18/25", finalExam: "25/30" },
    { name: "Student 5", roll: "BCS-543", attendance: "90%", gpa: "3.7", quizzes: "10/10", midExam: "20/25", finalExam: "28/30" },
    { name: "Student 6", roll: "BCS-543", attendance: "70%", gpa: "2.5", quizzes: "5/10", midExam: "12/25", finalExam: "15/30" },
    { name: "Student 7", roll: "BCS-543", attendance: "95%", gpa: "3.9", quizzes: "10/10", midExam: "22/25", finalExam: "30/30" },
    { name: "Student 8", roll: "BCS-543", attendance: "80%", gpa: "3.0", quizzes: "9/10", midExam: "19/25", finalExam: "23/30" },
  ];

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

  const scatterData = {
    datasets: [
      {
        label: 'Students',
        data: data.map((student, index) => ({
          x: index + 1,
          y: parseFloat(student.gpa),
          label: student.name,
          backgroundColor: 'rgba(30, 197, 134,)',  // Ensure this is set
          borderColor: 'rgba(75, 192, 192, 0.6)',  // Border color for points
        })),
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
            <h3>Average GPA</h3>
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
            <tr key={index} className={parseFloat(student.attendance) < 50 ? "low-attendance" : ""}>
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
