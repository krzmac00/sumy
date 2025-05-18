// src/layouts/MainLayout.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useSidebarState } from '../hooks/useSidebarState';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Use custom hook with persistence, default to closed sidebar
  const [sidebarOpen, setSidebarOpen] = useSidebarState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="main-layout">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="content-container">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MainLayout;