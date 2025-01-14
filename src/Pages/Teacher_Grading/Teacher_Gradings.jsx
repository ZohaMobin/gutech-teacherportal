import React, { useState } from "react";
import Table from "../../Components/Table";
import "./Teacher_Gradings.css";

const GradingPage = () => {
  const [subject, setSubject] = useState("Subject");

  const quizzes = [
    {
      stdName: "Ahsan",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
    {
      stdName: "Sultan",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
    {
      stdName: "Bilal",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
  ];

  const assignments = [
    {
      stdName: "Ahsan",
      course: "Discrete",
      batch: "fall-25",
      assignmentNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
    {
      stdName: "Sultan",
      course: "Discrete",
      batch: "fall-25",
      assignmentNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
    {
      stdName: "Bilal",
      course: "Discrete",
      batch: "fall-25",
      assignmentNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
  ];

  return (
    <div className="grading-page">
      <div className="header">
        <button className="header-button">View grades</button>
        <button className="header-button">Upload grades</button>
        <div className="search">
          <input type="text" placeholder="Search std_name" />
          <input type="text" placeholder="Search std_id" />
        </div>
        <div className="dropdown">
          <button className="dropdown-button">Select your course</button>
          {/* Dropdown content for course */}
        </div>
        <div className="dropdown">
          <button className="dropdown-button">Select your batch</button>
          {/* Dropdown content for batch */}
        </div>
      </div>
      <h1>Grades of {subject}</h1>
      <main>
        <Table
          title="QUIZES"
          data={quizzes}
          columns={[
            { label: "Std_name", key: "stdName" },
            { label: "Course", key: "course" },
            { label: "Batch", key: "batch" },
            { label: "Quiz no.", key: "quizNo" },
            { label: "Marks", key: "marks" },
            { label: "Weightage", key: "weightage" },
            { label: "Action", key: "action" },
          ]}
        />
        <Table
          title="ASSIGNMENTS"
          data={assignments}
          columns={[
            { label: "Std_name", key: "stdName" },
            { label: "Course", key: "course" },
            { label: "Batch", key: "batch" },
            { label: "Assignment no.", key: "assignmentNo" },
            { label: "Marks", key: "marks" },
            { label: "Weightage", key: "weightage" },
            { label: "Action", key: "action" },
          ]}
        />
      </main>
    </div>
  );
};

export default GradingPage;
