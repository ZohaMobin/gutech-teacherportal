// Sidebar.jsx with Tailwind CSS
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, activePage, onNavClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  
  // Extract first letter of name for avatar
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'GU';
  };
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'marks', label: 'Marks', icon: '📄' },
    { id: 'marks2', label: 'Marks 2.0', icon: '📝' },
    { id: 'timetable', label: 'Timetable', icon: '📆' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  return (
    <aside className={`fixed top-0 left-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 
      transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-red-700 text-white rounded flex items-center justify-center font-bold mr-2">
            P
          </div>
          <span className="font-semibold text-gray-800">Portal</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-5 overflow-y-auto">
        {navigationItems.map(item => (
          <a 
            key={item.id}
            href="#"
            className={`flex items-center py-3 px-5 text-gray-600 transition-all duration-200 border-l-3 ${
              activePage === item.id 
                ? 'bg-red-50 text-red-700 font-medium border-l-red-700' 
                : 'border-l-transparent hover:bg-gray-50 hover:text-red-700'
            }`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${item.id}`);
              onNavClick(item.id);
            }}
          >
            <span className="mr-3 w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      
      {/* User Profile */}
      <div className="p-5 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold mr-3">
            {getInitial()}
          </div>
          <div>
            <div className="font-medium text-gray-800">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500">Teacher</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;