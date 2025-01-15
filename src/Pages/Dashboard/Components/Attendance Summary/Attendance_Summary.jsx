import React from 'react';
import './Attendance_Summary.css';

const Attendance_Summary = () => {
  const data = [27, 32, 30, 34, 22];
  const maxHeight = 150;

  return (
    <div className='main-div'>
        <p>Attendance Summary</p>
            <div>
                <p style={{fontSize: "10px", fontWeight: "600"}}>Weekly Chart</p>
                
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

    </div>
  );
};

export default Attendance_Summary;