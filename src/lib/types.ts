export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Admin' | 'User';
};

export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  status: 'Present' | 'Absent';
  emotion: 'Happy' | 'Sad' | 'Neutral' | 'Surprised' | 'N/A';
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};
