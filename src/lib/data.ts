import type { User, AttendanceRecord } from './types';

export const USERS: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/150?u=bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'https://i.pravatar.cc/150?u=charlie@example.com', role: 'User' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', avatar: 'https://i.pravatar.cc/150?u=diana@example.com', role: 'User' },
  { id: '5', name: 'v rahul', email: 'vrahul@example.com', avatar: 'https://i.pravatar.cc/150?u=vrahul@example.com', role: 'User' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', avatar: 'https://i.pravatar.cc/150?u=fiona@example.com', role: 'User' },
];

function getISODate(dayOffset: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
}

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 'rec1', userId: '1', userName: 'Alice Johnson', userAvatar: 'https://i.pravatar.cc/150?u=alice@example.com', date: getISODate(), status: 'Present', emotion: 'Happy' },
  { id: 'rec2', userId: '2', userName: 'Bob Williams', userAvatar: 'https://i.pravatar.cc/150?u=bob@example.com', date: getISODate(), status: 'Present', emotion: 'Neutral' },
  { id: 'rec3', userId: '3', userName: 'Charlie Brown', userAvatar: 'https://i.pravatar.cc/150?u=charlie@example.com', date: getISODate(), status: 'Absent', emotion: 'N/A' },
  { id: 'rec4', userId: '4', userName: 'Diana Miller', userAvatar: 'https://i.pravatar.cc/150?u=diana@example.com', date: getISODate(), status: 'Present', emotion: 'Happy' },
  { id: 'rec5', userId: '5', userName: 'v rahul', userAvatar: 'https://i.pravatar.cc/150?u=vrahul@example.com', date: getISODate(), status: 'Present', emotion: 'Sad' },
  { id: 'rec6', userId: '6', userName: 'Fiona Garcia', userAvatar: 'https://i.pravatar.cc/150?u=fiona@example.com', date: getISODate(), status: 'Absent', emotion: 'N/A' },
  { id: 'rec7', userId: '1', userName: 'Alice Johnson', userAvatar: 'https://i.pravatar.cc/150?u=alice@example.com', date: getISODate(-1), status: 'Present', emotion: 'Neutral' },
  { id: 'rec8', userId: '2', userName: 'Bob Williams', userAvatar: 'https://i.pravatar.cc/150?u=bob@example.com', date: getISODate(-1), status: 'Present', emotion: 'Happy' },
  { id: 'rec9', userId: '3', userName: 'Charlie Brown', userAvatar: 'https://i.pravatar.cc/150?u=charlie@example.com', date: getISODate(-1), status: 'Present', emotion: 'Surprised' },
  { id: 'rec10', userId: '4', userName: 'Diana Miller', userAvatar: 'https://i.pravatar.cc/150?u=diana@example.com', date: getISODate(-1), status: 'Present', emotion: 'Neutral' },
  { id: 'rec11', userId: '5', userName: 'v rahul', userAvatar: 'https://i.pravatar.cc/150?u=vrahul@example.com', date: getISODate(-1), status: 'Absent', emotion: 'N/A' },
  { id: 'rec12', userId: '6', userName: 'Fiona Garcia', userAvatar: 'https://i.pravatar.cc/150?u=fiona@example.com', date: getISODate(-1), status: 'Present', emotion: 'Happy' },
  { id: 'rec13', userId: '1', userName: 'Alice Johnson', userAvatar: 'https://i.pravatar.cc/150?u=alice@example.com', date: getISODate(-2), status: 'Present', emotion: 'Happy' },
  { id: 'rec14', userId: '2', userName: 'Bob Williams', userAvatar: 'https://i.pravator.cc/150?u=bob@example.com', date: getISODate(-2), status: 'Absent', emotion: 'N/A' },
  { id: 'rec15', userId: '3', userName: 'Charlie Brown', userAvatar: 'https://i.pravatar.cc/150?u=charlie@example.com', date: getISODate(-2), status: 'Present', emotion: 'Sad' },
  { id: 'rec16', userId: '4', userName: 'Diana Miller', userAvatar: 'https://i.pravatar.cc/150?u=diana@example.com', date: getISODate(-2), status: 'Present', emotion: 'Happy' },
];

    