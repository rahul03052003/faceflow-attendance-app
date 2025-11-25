
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
  timestamp: Timestamp | FieldValue | Date;
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};
