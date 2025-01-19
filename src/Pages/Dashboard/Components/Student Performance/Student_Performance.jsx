import React, { useState } from 'react';
import './Student_Performance.css';
import './Components/Filter_Dropdown.jsx';
import Filter_Dropdown from './Components/Filter_Dropdown.jsx';

const Student_Performance = () => {
  const gpaData = {
    "Batch 01": [1.2, 1.3, 1.4, 1.5, 1.5, 1.6, 1.7, 1.8, 2.0, 2.1, 2.2, 2.3, 2.3, 2.3, 2.4, 2.4, 2.4, 2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 2.8, 2.9, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.4, 3.6, 3.7, 3.7, 4.0, 4.0],
    "Batch 02": [1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.7, 2.8, 3.0, 3.1, 3.0, 3.2, 3.3, 3.4, 3.4, 3.5, 3.5, 3.7, 3.8, 3.9, 4.0],
    "Batch 03": [1.7, 1.8, 1.9, 2.0, 2.1, 2.3, 2.4, 2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.3, 3.5, 3.6, 3.8, 3.0, 3.2, 3.1, 2.8, 3.0, 2.7, 2.6, 3.2, 3.4]
  };

  const [selectedBatch, setSelectedBatch] = useState("Batch 01");
  const [gpas, setGpas] = useState(gpaData[selectedBatch]);

  const maxHeight = 150;
  const numIntervals = 4;

  const gpaBrackets = [
    { min: 1.0, max: 1.4 },
    { min: 1.5, max: 1.9 },
    { min: 2.0, max: 2.4 },
    { min: 2.5, max: 2.9 },
    { min: 3.0, max: 3.4 },
    { min: 3.5, max: 3.9 },
    { min: 4.0, max: 4.0 }
  ];

  const countGpasInBracket = (gpas, bracket) => {
    return gpas.filter(gpa => gpa >= bracket.min && gpa <= bracket.max).length;
  };

  const gpaCounts = gpaBrackets.map(bracket => countGpasInBracket(gpas, bracket));

  const maxCount = Math.max(...gpaCounts);

  const yAxisIntervals = Array.from({ length: numIntervals + 1 }, (_, index) =>
    Math.round((maxCount / numIntervals) * index)
  ).reverse();

  const maxValue = Math.max(...gpas);
  const minValue = Math.min(...gpas);
  const averageValue = Math.ceil((gpas.reduce((sum, value) => sum + value, 0) / gpas.length) * 10) / 10;

  const handleBatchChange = (batch) => {
    setSelectedBatch(batch);
    setGpas(gpaData[batch]);
  };

  return (
    <div className="main-studentPerformance-div">
      <p style={{fontFamily: "Poppins-Medium", fontSize: 20, margin: 0, padding: 0}}>Student Performance</p>
      <div className="second-studentPerformance-div"> {/* Div containing chart and summary */}

        {/* Weekly chart */}
        <div className="chart-main">
          <div className="header-and-button"> {/* Header and filter button */}
            <p style={{ fontSize: "11px", fontFamily: "Poppins-SemiBold" }}>Class GPA</p>
            <Filter_Dropdown onBatchChange={handleBatchChange} selectedBatch={selectedBatch} />
          </div>
          {/* Bar chart */}
          <div className="chart-area">
            <p className="y-axis-label">Number of Students</p>
            {/* Dynamic Y-axis */}
            <div className="chart-y-axis">
              {yAxisIntervals.map((value, index) => (
                <p key={index} style={{ fontSize: 11 }}>{value}</p>
              ))}
            </div>
            <div>
              <div className="chart-bars">
                {/* Display bars with counts */}
                {gpaCounts.map((count, index) => (
                  <div
                    key={index}
                    className="bar"
                    style={{
                      height: `${(count / maxCount) * maxHeight}px`,
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>{count}</span>
                  </div>
                ))}
              </div>
              {/* X-axis */}
              <ul className="chart-x-axis">
                {gpaBrackets.map((bracket, index) => (
                    <li key={index} className="x-axis-interval-values">
                    {index === gpaBrackets.length - 1 ? bracket.max : `${bracket.min} - ${bracket.max}`}
                    </li>
                ))}
                </ul>
              <p className="x-axis-label">Class GPA</p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="summary-main">
          <div className="stat-div" style={{ backgroundColor: "#E9F7EC" }}>
            <p style={{ fontFamily: "Poppins-Medium" }}>Highest GPA</p>
            <span style={{ fontFamily: "Poppins-SemiBold", fontSize: 18 }}>{maxValue}</span>
          </div>
          <div className="stat-div" style={{ backgroundColor: "#E6F1FF" }}>
            <p style={{ fontFamily: "Poppins-Medium" }}>Avg. Class GPA</p>
            <span style={{ fontFamily: "Poppins-SemiBold", fontSize: 18 }}>{averageValue}</span>
          </div>
          <div className="stat-div" style={{ backgroundColor: "#FFF1F1" }}>
            <p style={{ fontFamily: "Poppins-Medium" }}>Lowest GPA</p>
            <span style={{ fontFamily: "Poppins-SemiBold", fontSize: 18 }}>{minValue}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Student_Performance;
