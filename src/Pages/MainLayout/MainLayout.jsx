// MainLayout.jsx - Using Tailwind CSS
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/sidebar/Sidebar';
import Topbar from '../topbar/topbar';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const location = useLocation();
  
  // Update activePage when the route changes
  useEffect(() => {
    // Extract the page ID from the path (without the leading slash)
    const currentPath = location.pathname.substring(1);
    if (currentPath) {
      setActivePage(currentPath);
    } else {
      setActivePage('dashboard'); // Default to dashboard if on root path
    }
  }, [location]);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    // On mobile, close sidebar after navigation
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gray-50 overflow-x-hidden">
      <Topbar
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1 w-full relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onNavClick={handleNavClick}
          activePage={activePage}
        />
        
        <div className={`flex-1 mt-16 min-h-[calc(100vh-4rem)] w-full transition-all duration-300 bg-white overflow-x-hidden ${
          isSidebarOpen ? 'md:w-[calc(100%-16rem)] md:ml-64' : ''
        }`}>
          <main className="p-5 w-full box-border lg:p-4 md:p-3 sm:p-2">
            <Outlet />
            {React.Children.map(children, child => {
              // Clone the child element and pass the activePage prop
              return child ? React.cloneElement(child, { activePage }) : null;
            })}
          </main>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;