// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashboardContainer,
  DashboardHeader,
  DashboardWelcome,
  DashboardContent,
  DashboardSidebar,
  DashboardRoomList,
  DashboardCreateRoomButton,
  DashboardUserInfo,
  DashboardLogoutButton,
} from '../components/DashboardComponents';
import { ThemeToggle } from '../components/ThemeComponents';
import './DashboardPage.css';

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const { state, logout } = useAuth();
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = (): void => {
    logout();
    navigate('/login'); 
  };

  const handleCreateRoom = (): void => {
    // TODO: Implement room creation
    console.log('Create room');
  };

  if (state.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardContainer colors={colors}>
      <ThemeToggle />
      <DashboardHeader colors={colors}>
        <DashboardWelcome username={state.user?.username || 'User'} colors={colors} />
      </DashboardHeader>

      <div className="dashboard-main">
        <DashboardSidebar colors={colors} isMobileLayout={isMobileLayout}>
          <DashboardUserInfo user={state.user} colors={colors} />
          <DashboardCreateRoomButton onClick={handleCreateRoom} isLoading={isLoading} colors={colors} />
          <DashboardRoomList rooms={rooms} colors={colors} />
          <DashboardLogoutButton onClick={handleLogout} colors={colors} />
        </DashboardSidebar>

        <DashboardContent colors={colors}>
          <div className="dashboard-empty-state">
            <p>Select a room to start chatting</p>
          </div>
        </DashboardContent>
      </div>
    </DashboardContainer>
  );
};

export default DashboardPage;
