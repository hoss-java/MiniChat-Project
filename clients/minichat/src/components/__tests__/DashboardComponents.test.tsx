// src/components/__tests__/DashboardComponents.test.tsx

/**
 * DashboardComponents Test Suite
 *
 * This test file covers all dashboard-related UI components used in the main application interface.
 * Each component is tested for:
 * - Rendering with required props
 * - Proper child/content rendering
 * - Event handler callbacks
 * - Responsive layout handling (mobile vs desktop)
 * - Empty state display
 * - List rendering with data
 * - Theme/color prop application
 * - Conditional class application
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DashboardContainer,
  DashboardHeader,
  DashboardWelcome,
  DashboardContent,
  DashboardSidebar,
  DashboardUserInfo,
  DashboardCreateRoomButton,
  DashboardRoomList,
  DashboardLogoutButton,
} from '../DashboardComponents';

/**
 * Mock colors object used across all tests
 * Represents the color palette passed from ThemeContext
 */
const mockColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  border: '#e0e0e0',
  primary: '#007bff',
  text: '#000000',
  textSecondary: '#666666',
  error: '#dc3545',
};

// ============================================================================
// DASHBOARD CONTAINER COMPONENT TESTS
// ============================================================================
/**
 * DashboardContainer: A wrapper component that applies dashboard-specific styling
 * Scenarios:
 * 1. Renders children content
 * 2. Applies dashboard-container class for CSS styling
 * 3. Acts as main layout container
 */
describe('DashboardContainer', () => {
  const testCases = [
    {
      description: 'should render single child element',
      children: <div>Dashboard Content</div>,
      expectedText: 'Dashboard Content',
    },
    {
      description: 'should render multiple children elements',
      children: (
        <>
          <div>Header</div>
          <div>Body</div>
          <div>Footer</div>
        </>
      ),
      expectedTexts: ['Header', 'Body', 'Footer'],
    },
  ];

  testCases.forEach(({ description, children, expectedText, expectedTexts }) => {
    test(description, () => {
      const { container } = render(
        <DashboardContainer colors={mockColors}>{children}</DashboardContainer>
      );

      if (expectedText) {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
      if (expectedTexts) {
        expectedTexts.forEach((text) => {
          expect(screen.getByText(text)).toBeInTheDocument();
        });
      }
    });
  });

  test('should apply dashboard-container class for styling', () => {
    const { container } = render(
      <DashboardContainer colors={mockColors}>
        <span>Content</span>
      </DashboardContainer>
    );
    expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD HEADER COMPONENT TESTS
// ============================================================================
/**
 * DashboardHeader: Section component for header area
 * Scenarios:
 * 1. Renders children inside header
 * 2. Applies dashboard-header class
 * 3. Can contain various child elements
 */
describe('DashboardHeader', () => {
  const testCases = [
    {
      description: 'should render children inside header',
      children: <div>Header Content</div>,
      expectedText: 'Header Content',
    },
    {
      description: 'should wrap multiple header elements',
      children: (
        <>
          <h1>Dashboard</h1>
          <nav>Navigation</nav>
        </>
      ),
      expectedTexts: ['Dashboard', 'Navigation'],
    },
  ];

  testCases.forEach(({ description, children, expectedText, expectedTexts }) => {
    test(description, () => {
      const { container } = render(
        <DashboardHeader colors={mockColors}>{children}</DashboardHeader>
      );

      if (expectedText) {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
      if (expectedTexts) {
        expectedTexts.forEach((text) => {
          expect(screen.getByText(text)).toBeInTheDocument();
        });
      }
    });
  });

  test('should apply dashboard-header class', () => {
    const { container } = render(
      <DashboardHeader colors={mockColors}>
        <span>Content</span>
      </DashboardHeader>
    );
    expect(container.querySelector('.dashboard-header')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD WELCOME COMPONENT TESTS
// ============================================================================
/**
 * DashboardWelcome: Displays personalized welcome message
 * Scenarios:
 * 1. Renders with different usernames
 * 2. Shows welcome heading with username
 * 3. Shows secondary tagline
 * 4. Uses h1 for accessibility
 * 5. Handles special characters in username
 */
describe('DashboardWelcome', () => {
  const testCases = [
    {
      username: 'john_doe',
      expectedHeading: 'Welcome, john_doe',
      expectedTagline: 'Your P2P messaging hub',
    },
    {
      username: 'alice@example',
      expectedHeading: 'Welcome, alice@example',
      expectedTagline: 'Your P2P messaging hub',
    },
    {
      username: 'user-123',
      expectedHeading: 'Welcome, user-123',
      expectedTagline: 'Your P2P messaging hub',
    },
    {
      username: 'test@user#2024',
      expectedHeading: 'Welcome, test@user#2024',
      expectedTagline: 'Your P2P messaging hub',
    },
  ];

  testCases.forEach(({ username, expectedHeading, expectedTagline }) => {
    test(`should render welcome message for username "${username}"`, () => {
      render(<DashboardWelcome username={username} colors={mockColors} />);
      expect(screen.getByText(expectedHeading)).toBeInTheDocument();
      expect(screen.getByText(expectedTagline)).toBeInTheDocument();
    });
  });

  test('should render welcome heading as h1 for accessibility', () => {
    const { container } = render(
      <DashboardWelcome username="testuser" colors={mockColors} />
    );
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Welcome, testuser');
  });

  test('should apply dashboard-welcome class', () => {
    const { container } = render(
      <DashboardWelcome username="user" colors={mockColors} />
    );
    expect(container.querySelector('.dashboard-welcome')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD CONTENT COMPONENT TESTS
// ============================================================================
/**
 * DashboardContent: Container for main dashboard content
 * Scenarios:
 * 1. Renders children content
 * 2. Applies dashboard-content class
 * 3. Acts as flex/grid container
 */
describe('DashboardContent', () => {
  const testCases = [
    {
      description: 'should render single child',
      children: <div>Main Content</div>,
      expectedText: 'Main Content',
    },
    {
      description: 'should render multiple children',
      children: (
        <>
          <div>Sidebar</div>
          <div>Messages</div>
        </>
      ),
      expectedTexts: ['Sidebar', 'Messages'],
    },
  ];

  testCases.forEach(({ description, children, expectedText, expectedTexts }) => {
    test(description, () => {
      const { container } = render(
        <DashboardContent colors={mockColors}>{children}</DashboardContent>
      );

      if (expectedText) {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
      if (expectedTexts) {
        expectedTexts.forEach((text) => {
          expect(screen.getByText(text)).toBeInTheDocument();
        });
      }
    });
  });

  test('should apply dashboard-content class', () => {
    const { container } = render(
      <DashboardContent colors={mockColors}>
        <span>Content</span>
      </DashboardContent>
    );
    expect(container.querySelector('.dashboard-content')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD SIDEBAR COMPONENT TESTS
// ============================================================================
/**
 * DashboardSidebar: Aside element with responsive mobile layout support
 * Scenarios:
 * 1. Renders children inside sidebar
 * 2. Applies dashboard-sidebar class
 * 3. Applies sidebar-mobile class when isMobileLayout is true
 * 4. Does not apply sidebar-mobile class when isMobileLayout is false
 * 5. Defaults to desktop layout when isMobileLayout is undefined
 */
describe('DashboardSidebar', () => {
  const testCases = [
    {
      description: 'should render children inside sidebar (desktop)',
      isMobileLayout: false,
      children: <div>Sidebar Content</div>,
      expectedText: 'Sidebar Content',
      shouldHaveMobileClass: false,
    },
    {
      description: 'should render children inside sidebar (mobile)',
      isMobileLayout: true,
      children: <div>Mobile Sidebar</div>,
      expectedText: 'Mobile Sidebar',
      shouldHaveMobileClass: true,
    },
    {
      description: 'should render with default layout when isMobileLayout is undefined',
      isMobileLayout: undefined,
      children: <div>Default Layout</div>,
      expectedText: 'Default Layout',
      shouldHaveMobileClass: false,
    },
  ];

  testCases.forEach(
    ({
      description,
      isMobileLayout,
      children,
      expectedText,
      shouldHaveMobileClass,
    }) => {
      test(description, () => {
        const { container } = render(
          <DashboardSidebar colors={mockColors} isMobileLayout={isMobileLayout}>
            {children}
          </DashboardSidebar>
        );

        expect(screen.getByText(expectedText)).toBeInTheDocument();

        const sidebar = container.querySelector('.dashboard-sidebar');
        expect(sidebar).toBeInTheDocument();

        if (shouldHaveMobileClass) {
          expect(sidebar).toHaveClass('sidebar-mobile');
        } else {
          expect(sidebar).not.toHaveClass('sidebar-mobile');
        }
      });
    }
  );
});

// ============================================================================
// DASHBOARD USER INFO COMPONENT TESTS
// ============================================================================
/**
 * DashboardUserInfo: Displays logged-in user information
 * Scenarios:
 * 1. Renders user info with valid user object
 * 2. Displays "User" fallback when user is null
 * 3. Shows username in h3 heading (desktop)
 * 4. Shows profile icon emoji (mobile)
 * 5. Applies dashboard-user-info class
 * 6. Shows/hides elements based on screen size with CSS classes
 */
describe('DashboardUserInfo', () => {
  const testCases = [
    {
      description: 'should render user info with valid user object',
      user: { id: '1', username: 'john_doe' },
      expectedUsername: 'john_doe',
    },
    {
      description: 'should render user info with different username',
      user: { id: '2', username: 'alice_smith' },
      expectedUsername: 'alice_smith',
    },
    {
      description: 'should display "User" fallback when user is null',
      user: null,
      expectedUsername: 'User',
    },
    {
      description: 'should display "User" fallback when user object is empty',
      user: { id: '', username: '' },
      expectedUsername: 'User',
    },
  ];

  testCases.forEach(({ description, user, expectedUsername }) => {
    test(description, () => {
      const { container } = render(
        <DashboardUserInfo user={user} colors={mockColors} />
      );

      if (expectedUsername) {
        expect(screen.getByText(expectedUsername)).toBeInTheDocument();
      }
    });
  });

  test('should render profile icon emoji for mobile', () => {
    const { container } = render(
      <DashboardUserInfo
        user={{ id: '1', username: 'testuser' }}
        colors={mockColors}
      />
    );
    expect(screen.getByTitle('Profile')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  test('should apply dashboard-user-info class', () => {
    const { container } = render(
      <DashboardUserInfo
        user={{ id: '1', username: 'user' }}
        colors={mockColors}
      />
    );
    expect(container.querySelector('.dashboard-user-info')).toBeInTheDocument();
  });

  test('should have hide-on-mobile and show-on-mobile classes', () => {
    const { container } = render(
      <DashboardUserInfo
        user={{ id: '1', username: 'testuser' }}
        colors={mockColors}
      />
    );
    expect(container.querySelector('.hide-on-mobile')).toBeInTheDocument();
    expect(container.querySelector('.show-on-mobile')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD CREATE ROOM BUTTON COMPONENT TESTS
// ============================================================================
/**
 * DashboardCreateRoomButton: Button to create new messaging rooms
 * Scenarios:
 * 1. Calls onClick callback when clicked
 * 2. Shows "+" text on mobile
 * 3. Shows "+ New Room" text on desktop
 * 4. Disables button when isLoading is true
 * 5. Enables button when isLoading is false
 * 6. Applies create-room-btn class
 */
	const testCases = [
	  {
	    description: 'should call onClick callback when clicked (not loading)',
	    isLoading: false,
	    shouldCall: true,
	  },
	  {
	    description: 'should NOT call onClick when loading',
	    isLoading: true,
	    shouldCall: false,
	  },
	];
	testCases.forEach(({ description, isLoading, shouldCall }) => {
	  test(description, () => {
	    const mockOnClick = jest.fn();
	    render(
	      <DashboardCreateRoomButton
	        onClick={mockOnClick}
	        isLoading={isLoading}
	        colors={mockColors}
	      />
	    );

	    const button = screen.getByRole('button');
	    fireEvent.click(button);

	    if (shouldCall) {
	      expect(mockOnClick).toHaveBeenCalledTimes(1);
	    } else {
	      expect(mockOnClick).not.toHaveBeenCalled();
	    }
	  });

	const loadingTestCases = [
	  {
	    description: 'should show "+" on mobile',
	    expectedText: '+',
	    expectedClass: 'show-on-mobile',
	  },
	  {
	    description: 'should show "+ New Room" on desktop',
	    expectedText: '+ New Room',
	    expectedClass: 'hide-on-mobile',
	  },
	];

	loadingTestCases.forEach(({ description, expectedText, expectedClass }) => {
	  test(description, () => {
	    render(
	      <DashboardCreateRoomButton
	        onClick={jest.fn()}
	        isLoading={false}
	        colors={mockColors}
	      />
	    );

	    const element = screen.getByText(expectedText);
	    expect(element).toHaveClass(expectedClass);
	  });
	});

  test('should show "+ New Room" text on desktop', () => {
    render(
      <DashboardCreateRoomButton
        onClick={jest.fn()}
        isLoading={false}
        colors={mockColors}
      />
    );
    expect(screen.getByText('+ New Room')).toBeInTheDocument();
  });

  test('should apply create-room-btn class', () => {
    const { container } = render(
      <DashboardCreateRoomButton
        onClick={jest.fn()}
        isLoading={false}
        colors={mockColors}
      />
    );
    expect(container.querySelector('.create-room-btn')).toBeInTheDocument();
  });

  test('should have loading prop set correctly', () => {
    const { container, rerender } = render(
      <DashboardCreateRoomButton
        onClick={jest.fn()}
        isLoading={false}
        colors={mockColors}
      />
    );

    let button = container.querySelector('button');
    expect(button).toBeInTheDocument();

    // Rerender with loading true
    rerender(
      <DashboardCreateRoomButton
        onClick={jest.fn()}
        isLoading={true}
        colors={mockColors}
      />
    );

    button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD ROOM LIST COMPONENT TESTS
// ============================================================================
/**
 * DashboardRoomList: Displays list of messaging rooms
 * Scenarios:
 * 1. Renders "Rooms" heading
 * 2. Shows empty state message when rooms array is empty
 * 3. Renders list of rooms with room names
 * 4. Renders room item with correct room id as key
 * 5. Shows chain/link icon emoji on mobile
 * 6. Hides room items and heading on mobile (via CSS classes)
 * 7. Applies dashboard-room-list class
 */
describe('DashboardRoomList', () => {
  const mockRooms = [
    { id: '1', name: 'General Chat', createdAt: '2024-01-01' },
    { id: '2', name: 'Development', createdAt: '2024-01-02' },
    { id: '3', name: 'Random', createdAt: '2024-01-03' },
  ];

  const emptyRoomsTestCases = [
    {
      description: 'should display empty state when rooms array is empty',
      rooms: [],
      expectedEmptyMessage: 'No rooms yet. Create one to get started!',
      shouldShowHeading: false,
    },
  ];

  emptyRoomsTestCases.forEach(
    ({ description, rooms, expectedEmptyMessage, shouldShowHeading }) => {
      test(description, () => {
        render(<DashboardRoomList rooms={rooms} colors={mockColors} />);

        expect(screen.getByText(expectedEmptyMessage)).toBeInTheDocument();

        if (!shouldShowHeading) {
          // Empty state should still have heading but it's hidden on mobile
          const heading = screen.queryByText('Rooms');
          expect(heading).toBeInTheDocument();
        }
      });
    }
  );

  const populatedRoomsTestCases = [
    {
      description: 'should render single room in list',
      rooms: [{ id: '1', name: 'General', createdAt: '2024-01-01' }],
      expectedRoomNames: ['General'],
    },
    {
      description: 'should render multiple rooms in list',
      rooms: mockRooms,
      expectedRoomNames: ['General Chat', 'Development', 'Random'],
    },
    {
      description: 'should render rooms with special characters in names',
      rooms: [
        { id: '1', name: 'Room #1', createdAt: '2024-01-01' },
        { id: '2', name: 'Test-Room@Dev', createdAt: '2024-01-02' },
      ],
      expectedRoomNames: ['Room #1', 'Test-Room@Dev'],
    },
  ];

  populatedRoomsTestCases.forEach(
    ({ description, rooms, expectedRoomNames }) => {
      test(description, () => {
        render(<DashboardRoomList rooms={rooms} colors={mockColors} />);

        expectedRoomNames.forEach((roomName) => {
          expect(screen.getByText(roomName)).toBeInTheDocument();
        });
      });
    }
  );

  test('should render "Rooms" heading', () => {
    render(<DashboardRoomList rooms={mockRooms} colors={mockColors} />);
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });

  test('should render heading as h3 for accessibility', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );
    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toBe('Rooms');
  });

  test('should render room list items with correct structure', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );

    const listItems = container.querySelectorAll('li.room-item');
    expect(listItems.length).toBe(mockRooms.length);
  });

  test('should render room items with correct data attributes for accessibility', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );

    const listItems = container.querySelectorAll('li.room-item');
    listItems.forEach((item, index) => {
      expect(item.textContent).toContain(mockRooms[index].name);
    });
  });

  test('should show chain/link icon emoji on mobile', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );
    expect(screen.getByTitle('Rooms')).toBeInTheDocument();
    expect(screen.getByText('🔗')).toBeInTheDocument();
  });

  test('should apply dashboard-room-list class', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );
    expect(container.querySelector('.dashboard-room-list')).toBeInTheDocument();
  });

  test('should apply hide-on-mobile and show-on-mobile classes', () => {
    const { container } = render(
      <DashboardRoomList rooms={mockRooms} colors={mockColors} />
    );
    expect(container.querySelector('.hide-on-mobile')).toBeInTheDocument();
    expect(container.querySelector('.show-on-mobile')).toBeInTheDocument();
  });
});

// ============================================================================
// DASHBOARD LOGOUT BUTTON COMPONENT TESTS
// ============================================================================
/**
 * DashboardLogoutButton: Button to logout user from dashboard
 * Scenarios:
 * 1. Calls onClick callback when clicked
 * 2. Shows "Logout" text on desktop
 * 3. Shows power-off icon emoji on mobile
 * 4. Uses danger variant for styling
 * 5. Applies logout-btn class
 * 6. Has correct accessibility attributes
 */
describe('DashboardLogoutButton', () => {
  const testCases = [
    {
      description: 'should call onClick callback on first click',
      clickCount: 1,
      expectedCallCount: 1,
    },
    {
      description: 'should call onClick callback on multiple clicks',
      clickCount: 3,
      expectedCallCount: 3,
    },
  ];

  testCases.forEach(({ description, clickCount, expectedCallCount }) => {
    test(description, () => {
      const mockOnClick = jest.fn();
      render(
        <DashboardLogoutButton onClick={mockOnClick} colors={mockColors} />
      );

      const button = screen.getByRole('button');

      for (let i = 0; i < clickCount; i++) {
        fireEvent.click(button);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(expectedCallCount);
    });
  });

  test('should show "Logout" text on desktop', () => {
    render(<DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('should show power-off icon emoji on mobile', () => {
    render(<DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />);
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
    expect(screen.getByText('⏻')).toBeInTheDocument();
  });

  test('should apply logout-btn class', () => {
    const { container } = render(
      <DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />
    );
    expect(container.querySelector('.logout-btn')).toBeInTheDocument();
  });

	test('should use danger variant button style', () => {
	  const { container } = render(
	    <DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />
	  );
	  const button = container.querySelector('button');
	  expect(button).toHaveClass('btn-danger');
	});

  test('should have hide-on-mobile and show-on-mobile classes', () => {
    const { container } = render(
      <DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />
    );
    expect(container.querySelector('.hide-on-mobile')).toBeInTheDocument();
    expect(container.querySelector('.show-on-mobile')).toBeInTheDocument();
  });

  test('should render as a button element', () => {
    render(<DashboardLogoutButton onClick={jest.fn()} colors={mockColors} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

