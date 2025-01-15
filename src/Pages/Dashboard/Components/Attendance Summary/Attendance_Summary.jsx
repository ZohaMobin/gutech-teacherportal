import React, { useState } from 'react';
import './Attendance_Summary.css';

const Attendance_Summary = () => {
  const data = [28, 32, 30, 34, 30];
  const maxHeight = 150;
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state
  const [selectedBatch, setSelectedBatch] = useState("Batch 01"); // Selected option

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle selection
  const handleSelect = (batch) => {
    setSelectedBatch(batch);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  return (
    <div className='main-div'>
        <p style={{fontFamily: "Poppins-Semibold"}}>Attendance Summary</p>
            <div className='2nd-div'> {/*Div containing both chart divs*/}
                <div className='weekly-chart-main'> {/*Weekly chart*/}
                    <div className='header-and-button'> {/*Header and filter button*/}
                        <p style={{fontSize: "11px", fontFamily: "Poppins-SemiBold", color: "#4C4C4C"}}>Weekly Chart</p>
                        
                        <div className="dropdown-container"> {/*Filter dropdown*/}
                            <button className='chart-filter-button' onClick={toggleDropdown}>
                                {selectedBatch}
                                <img src='down-arrow.svg' alt='#error' style={{ paddingBottom: 1, width: 8}} />
                            </button>
                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <ul>
                                        <li onClick={() => handleSelect("Batch 01")}>Batch 01</li>
                                        <li onClick={() => handleSelect("Batch 02")}>Batch 02</li>
                                        <li onClick={() => handleSelect("Batch 03")}>Batch 03</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                    </div> {/*Bar chart*/}
                    <div className="chart-container">
                        <div className="bar" style={{ height: `${(data[0] / Math.max(...data)) * maxHeight}px` }}>
                            <span style={{fontSize: "12px"}}>{data[0]}</span>
                        </div>
                        <div className="bar" style={{ height: `${(data[1] / Math.max(...data)) * maxHeight}px` }}>
                            <span style={{fontSize: "12px"}}>{data[1]}</span>
                        </div>
                        <div className="bar" style={{ height: `${(data[2] / Math.max(...data)) * maxHeight}px` }}>
                            <span style={{fontSize: "12px"}}>{data[2]}</span>
                        </div>
                        <div className="bar" style={{ height: `${(data[3] / Math.max(...data)) * maxHeight}px` }}>
                            <span style={{fontSize: "12px"}}>{data[3]}</span>
                        </div>
                        <div className="bar" style={{ height: `${(data[4] / Math.max(...data)) * maxHeight}px` }}>
                            <span style={{fontSize: "12px"}}>{data[4]}</span>
                        </div>
                    </div>
                </div>

                <div className=''> {/*Daily Summary*/}

                </div>
            </div>

    </div>
  );
};

export default Attendance_Summary;