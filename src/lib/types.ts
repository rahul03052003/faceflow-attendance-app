
import { FieldValue, Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  registerNo: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Student' | 'Teacher';
  subjects?: string[];
  facialFeatures?: any;
};

export type Subject = {
  id: string;
  title: string;
  code: string;
  teacherId?: string;
};

// This represents the structure of the document in Firestore
export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  emotion: 'Happy' | 'Sad' | 'Neutral' | 'Surprised' | 'N/A';
  timestamp: Timestamp | FieldValue;
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
    registerNo: 'R001',
    avatar: 'https://i.pravatar.cc/150?u=john.doe@example.com',
    role: 'Admin',
    facialFeatures: {},
  },
  {
    id: 'demo-user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    registerNo: 'R002',
    avatar: 'https://i.pravatar.cc/150?u=jane.smith@example.com',
    role: 'Student',
    facialFeatures: {},
  },
  {
    id: 'demo-user-3',
    name: 'Peter Jones',
    email: 'peter.jones@example.com',
    registerNo: 'R003',
    avatar: 'https://i.pravatar.cc/150?u=peter.jones@example.com',
    role: 'Student',
    facialFeatures: {},
  },
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
    { 
        id: 'demo-att-1', 
        userId: 'demo-user-2', 
        userName: 'Jane Smith', 
        userAvatar: 'https://i.pravatar.cc/150?u=jane.smith@example.com',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Happy',
        timestamp: new Date() as any // Type casting for demo
    },
    { 
        id: 'demo-att-2', 
        userId: 'demo-user-3', 
        userName: 'Peter Jones', 
        userAvatar: 'https://i.pravatar.cc/150?u=peter.jones@example.com',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: 'Neutral',
        timestamp: new Date() as any
    },
];

export const DEMO_SUBJECTS: Subject[] = [
    { id: 'demo-subj-1', title: 'Computer Science 101', code: 'CS101', teacherId: 'demo-user-1' },
    { id: 'demo-subj-2', title: 'Mathematics 203', code: 'MA203', teacherId: 'demo-user-1' },
];
