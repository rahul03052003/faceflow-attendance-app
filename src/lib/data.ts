import type { User, AttendanceRecord } from './types';

export const USERS: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: '/avatars/01.png', role: 'Admin' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', avatar: '/avatars/02.png', role: 'User' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: '/avatars/03.png', role: 'User' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', avatar: '/avatars/04.png', role: 'User' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', avatar: '/avatars/05.png', role: 'User' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', avatar: '/avatars/06.png', role: 'User' },
];

function getISODate(dayOffset: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
}

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 'rec1', userId: '1', userName: 'Alice Johnson', userAvatar: '/avatars/01.png', date: getISODate(), status: 'Present', emotion: 'Happy' },
  { id: 'rec2', userId: '2', userName: 'Bob Williams', userAvatar: '/avatars/02.png', date: getISODate(), status: 'Present', emotion: 'Neutral' },
  { id: 'rec3', userId: '3', userName: 'Charlie Brown', userAvatar: '/avatars/03.png', date: getISODate(), status: 'Absent', emotion: 'N/A' },
  { id: 'rec4', userId: '4', userName: 'Diana Miller', userAvatar: '/avatars/04.png', date: getISODate(), status: 'Present', emotion: 'Happy' },
  { id: 'rec5', userId: '5', userName: 'Ethan Davis', userAvatar: '/avatars/05.png', date: getISODate(), status: 'Present', emotion: 'Sad' },
  { id: 'rec6', userId: '6', userName: 'Fiona Garcia', userAvatar: '/avatars/06.png', date: getISODate(), status: 'Absent', emotion: 'N/A' },
  { id: 'rec7', userId: '1', userName: 'Alice Johnson', userAvatar: '/avatars/01.png', date: getISODate(-1), status: 'Present', emotion: 'Neutral' },
  { id: 'rec8', userId: '2', userName: 'Bob Williams', userAvatar: '/avatars/02.png', date: getISODate(-1), status: 'Present', emotion: 'Happy' },
  { id: 'rec9', userId: '3', userName: 'Charlie Brown', userAvatar: '/avatars/03.png', date: getISODate(-1), status: 'Present', emotion: 'Surprised' },
  { id: 'rec10', userId: '4', userName: 'Diana Miller', userAvatar: '/avatars/04.png', date: getISODate(-1), status: 'Present', emotion: 'Neutral' },
  { id: 'rec11', userId: '5', userName: 'Ethan Davis', userAvatar: '/avatars/05.png', date: getISODate(-1), status: 'Absent', emotion: 'N/A' },
  { id: 'rec12', userId: '6', userName: 'Fiona Garcia', userAvatar: '/avatars/06.png', date: getISODate(-1), status: 'Present', emotion: 'Happy' },
  { id: 'rec13', userId: '1', userName: 'Alice Johnson', userAvatar: '/avatars/01.png', date: getISODate(-2), status: 'Present', emotion: 'Happy' },
  { id: 'rec14', userId: '2', userName: 'Bob Williams', userAvatar: '/avatars/02.png', date: getISODate(-2), status: 'Absent', emotion: 'N/A' },
  { id: 'rec15', userId: '3', userName: 'Charlie Brown', userAvatar: '/avatars/03.png', date: getISODate(-2), status: 'Present', emotion: 'Sad' },
  { id: 'rec16', userId: '4', userName: 'Diana Miller', userAvatar: '/avatars/04.png', date: getISODate(-2), status: 'Present', emotion: 'Happy' },
];
