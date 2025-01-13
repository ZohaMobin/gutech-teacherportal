import React from "react";
import "./Progress Report.css";

const ProgressReport = () => {
  const data = [
    { name: "Fatima", roll: "BCS-543", attendance: "90%", gpa: "3.5", quizzes: "10/10", midExam: "20/20", finalExam: "30/30", total: "100/100" },
    { name: "Barira Fatima", roll: "BCS-543", attendance: "90%", gpa: "3.5", quizzes: "10/10", midExam: "20/20", finalExam: "30/30", total: "100/100" },
    { name: "Yusra", roll: "BCS-543", attendance: "90%", gpa: "3.5", quizzes: "10/10", midExam: "20/25", finalExam: "30/20", total: "100/100" },
    { name: "Usability Test", roll: "BCS-543", attendance: "90%", gpa: "3.5", quizzes: "10/10", midExam: "20/20", finalExam: "30/30", total: "100/100" },
    { name: "Usability Test", roll: "BCS-543", attendance: "40%", gpa: "2.5", quizzes: "10/10", midExam: "20/20", finalExam: "30/30", total: "100/100" },
  ];

  return (
    <div className="table-container">
      <h2>Batch: 24-G</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll No.</th>
            <th>Attendance</th>
            <th>GPA</th>
            <th>Quizzes</th>
            <th>Mid Exam</th>
            <th>Final Exam</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={row.attendance === "40%" ? "highlight-row" : ""}>
              <td>{row.name}</td>
              <td>{row.roll}</td>
              <td>{row.attendance}</td>
              <td>{row.gpa}</td>
              <td>{row.quizzes}</td>
              <td>{row.midExam}</td>
              <td>{row.finalExam}</td>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressReport;