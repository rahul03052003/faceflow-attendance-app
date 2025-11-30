
import { FieldValue, Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  registerNo: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Student' | 'Teacher';
  subjects?: string[]; // For students: array of subject IDs
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
  subjectId: string;
  subjectName: string;
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
