import React, { useState } from 'react';
import './Filter_Dropdown.css';

function Filter_Dropdown({ onBatchChange, selectedBatch }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state
  
    // Toggle dropdown visibility
    const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };
  
    // Handle selection
    const handleSelect = (batch) => {
      onBatchChange(batch);  // Pass selected batch to parent
      setIsDropdownOpen(false); // Close dropdown after selection
    };

    return (
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
    );
}

export default Filter_Dropdown;