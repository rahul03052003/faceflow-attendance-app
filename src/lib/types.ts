import { FieldValue } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Admin' | 'User';
};

export type AttendanceRecord = {
  id:string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  status: 'Present' | 'Absent';
  emotion: 'Happy' | 'Sad' | 'Neutral' | 'Surprised' | 'N/A';
  timestamp?: FieldValue | Date;
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};


export const DEMO_USERS: User[] = [
    {
      id: 'demo-user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://i.pravatar.cc/150?u=john.doe@example.com',
      role: 'Admin',
    },
    {
      id: 'demo-user-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://i.pravatar.cc/150?u=jane.smith@example.com',
      role: 'User',
    },
     {
      id: 'demo-user-3',
      name: 'Peter Jones',
      email: 'peter.jones@example.com',
      avatar: 'https://i.pravatar.cc/150?u=peter.jones@example.com',
      role: 'User',
    },
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
    {
        id: 'rec1',
        userId: 'demo-user-1',
        userName: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?u=john.doe@example.com',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Happy',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
        id: 'rec2',
        userId: 'demo-user-2',
        userName: 'Jane Smith',
        userAvatar: 'https://i.pravatar.cc/150?u=jane.smith@example.com',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Neutral',
        timestamp: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
        id: 'rec3',
        userId: 'demo-user-3',
        userName: 'Peter Jones',
        userAvatar: 'https://i.pravatar.cc/150?u=peter.jones@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Surprised',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
     {
        id: 'rec4',
        userId: 'demo-user-1',
        userName: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?u=john.doe@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Neutral',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25)
    }
];
