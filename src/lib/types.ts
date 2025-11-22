import { FieldValue } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  registerNo: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Student' | 'Teacher';
  subjects?: string[];
};

export type Subject = {
  id: string;
  title: string;
  code: string;
  teacherId?: string;
};

export type AttendanceRecord = {
  id: string;
  subjectId: string;
  date: string;
  present: { [userId: string]: { detectedBy: 'face' | 'manual'; emotion: string; timestamp: FieldValue } };
  absent: string[];
  takenBy: string;
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
  },
  {
    id: 'demo-user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    registerNo: 'R002',
    avatar: 'https://i.pravatar.cc/150?u=jane.smith@example.com',
    role: 'Student',
  },
  {
    id: 'demo-user-3',
    name: 'Peter Jones',
    email: 'peter.jones@example.com',
    registerNo: 'R003',
    avatar: 'https://i.pravatar.cc/150?u=peter.jones@example.com',
    role: 'Student',
  },
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
    // This demo data structure needs to be updated to match the new schema.
    // For now, we will leave it empty as the old structure is incompatible.
];

export const DEMO_SUBJECTS: Subject[] = [
    { id: 'demo-subj-1', title: 'Computer Science 101', code: 'CS101', teacherId: 'demo-user-1' },
    { id: 'demo-subj-2', title: 'Mathematics 203', code: 'MA203', teacherId: 'demo-user-1' },
];
