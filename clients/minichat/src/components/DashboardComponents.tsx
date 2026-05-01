// src/components/DashboardComponents.tsx
import React from 'react';
import { Container, Card, Heading, Text, Button, Section } from './shared/UIComponents';
import { Colors } from '../types/ColorTypes';

interface User {
  id: string;
  username: string;
}

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export const DashboardContainer: React.FC<{ colors: Colors; children: React.ReactNode }> =
  ({ colors, children }) => <Container className="dashboard-container">{children}</Container>;

export const DashboardHeader: React.FC<{ colors: Colors; children: React.ReactNode }> =
  ({ colors, children }) => <Section className="dashboard-header">{children}</Section>;

export const DashboardWelcome: React.FC<{ username: string; colors: Colors }> =
  ({ username, colors }) => (
    <Section className="dashboard-welcome">
      <Heading level={1}>Welcome, {username}</Heading>
      <Text variant="secondary">Your P2P messaging hub</Text>
    </Section>
  );

export const DashboardContent: React.FC<{ colors: Colors; children: React.ReactNode }> =
  ({ colors, children }) => <div className="dashboard-content">{children}</div>;

export const DashboardSidebar: React.FC<{ colors: Colors; children: React.ReactNode; isMobileLayout?: boolean }> =
  ({ colors, children, isMobileLayout }) => <aside className={`dashboard-sidebar ${isMobileLayout ? 'sidebar-mobile' : ''}`}>{children}</aside>;


export const DashboardUserInfo: React.FC<{ user: User | null; colors: Colors }> =
  ({ user, colors }) => (
    <Card className="dashboard-user-info">
      <Text variant="secondary" className="hide-on-mobile">Logged in as</Text>
      <Heading level={3} className="hide-on-mobile">{user?.username || 'User'}</Heading>
      <span className="show-on-mobile" title="Profile" style={{ fontSize: '24px' }}>👤</span>
    </Card>
  );

export const DashboardCreateRoomButton: React.FC<{
  onClick: () => void;
  isLoading: boolean;
  colors: Colors;
}> = ({ onClick, isLoading, colors }) => (
  <Button onClick={onClick} loading={isLoading} className="create-room-btn">
    <span className="show-on-mobile">+</span>
    <span className="hide-on-mobile">+ New Room</span>
  </Button>
);

export const DashboardRoomList: React.FC<{ rooms: Room[]; colors: Colors }> =
  ({ rooms, colors }) => (
    <Card className="dashboard-room-list">
      <Heading level={3} className="hide-on-mobile">Rooms</Heading>
      {rooms.length === 0 ? (
        <Text variant="secondary" className="hide-on-mobile">No rooms yet. Create one to get started!</Text>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.id} className="room-item hide-on-mobile">
              <Text>{room.name}</Text>
            </li>
          ))}
        </ul>
      )}
      <span className="show-on-mobile" title="Rooms">🔗</span>
    </Card>
  );

export const DashboardLogoutButton: React.FC<{ onClick: () => void; colors: Colors }> =
  ({ onClick, colors }) => (
    <Button onClick={onClick} variant="danger" className="logout-btn">
      <span className="hide-on-mobile">Logout</span>
      <span className="show-on-mobile" title="Logout">⏻</span>
    </Button>
  );



