import React from 'react';
import "./topbar.css";

export const Topbar = () => {
  return (
    <nav className="navbar">
      
      <div className="search-bar">
        <img src="./searchIcon.svg" alt="magnifying glass" width="30" />
        <input type="text" placeholder="Search..." />
      </div>
      <div className="nav-images">
        <button className='notifybtn'>
          <img src='./notify.svg' alt='notify' />
        </button>
        <img src='./user.svg' alt='user-img' className='userImg' />
        <p className='userName'> Ahmed </p>
      </div>
    </nav>
  );
};