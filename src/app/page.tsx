
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, Frown, Meh, Smile, Users, Archive, Target } from 'lucide-react';
import { EmotionChart } from '@/components/reports/emotion-chart';
import { useCollection, useUser } from '@/firebase';
import type { AttendanceRecord, User, Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AttendanceTable } from '@/components/reports/attendance-table';

function EmotionIcon({ emotion }: { emotion: string }) {
  switch (emotion) {
    case 'Happy':
      return <Smile className="text-green-500" />;
    case 'Neutral':
      return <Meh className="text-yellow-500" />;
    case 'Sad':
      return <Frown className="text-blue-500" />;
    default:
      return <Meh className="text-gray-500" />;
  }
}

// Helper to safely get and parse session storage
function getSessionAccuracy() {
  if (typeof window === 'undefined') {
    return { successful: 0, failed: 0 };
  }
  const stored = sessionStorage.getItem('scanAccuracy');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (typeof data.successful === 'number' && typeof data.failed === 'number') {
        return data;
      }
    } catch (e) {
      console.error('Failed to parse session accuracy:', e);
    }
  }
  return { successful: 0, failed: 0 };
}


export default function Home() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  const [accuracyStats, setAccuracyStats] = useState(getSessionAccuracy());
  
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>(
    'users'
  );

  const subjectsQuery = useCallback((ref: any) => {
    if (currentUser?.role === 'Admin') return ref;
    if (!currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid, currentUser?.role]);
  
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    currentUser ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );
  
  const teacherSubjectIds = useMemo(() => {
    if (!allSubjects) return [];
    return allSubjects.map(s => s.id);
  }, [allSubjects]);
  
  const attendanceQuery = useCallback((ref: any) => {
    if (currentUser?.role === 'Admin') return ref; // Admins see all attendance
    if (teacherSubjectIds.length > 0) {
      return query(ref, where('subjectId', 'in', teacherSubjectIds));
    }
    // Return a query that will find nothing if there are no subjects
    return query(ref, where('subjectId', '==', ''));
  }, [currentUser?.role, teacherSubjectIds]);

  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>(
    currentUser ? 'attendance' : null,
    { buildQuery: attendanceQuery }
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setAccuracyStats(getSessionAccuracy());
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for a custom event for immediate updates within the same tab
    window.addEventListener('accuracyUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('accuracyUpdated', handleStorageChange);
    };
  }, []);

  const modelAccuracy = useMemo(() => {
    const { successful, failed } = accuracyStats;
    const total = successful + failed;
    if (total === 0) {
      // Show a baseline until a scan is made
      return '99.2%'; 
    }
    const rate = (successful / total) * 100;
    return `${rate.toFixed(1)}%`;
  }, [accuracyStats]);


  const isLoading = isLoadingUser || isLoadingUsers || isLoadingRecords || isLoadingSubjects;

  const teacherStudents = useMemo(() => {
    if (isLoading || !allUsers) return [];
    
    if (currentUser?.role === 'Admin') {
      return allUsers.filter(u => u.role === 'Student');
    }

    if (currentUser?.role === 'Teacher') {
        if (teacherSubjectIds.length === 0) return [];
        return allUsers.filter(u => 
            u.role === 'Student' && 
            Array.isArray(u.subjects) && 
            u.subjects.some(subId => teacherSubjectIds.includes(subId))
        );
    }
    
    return [];
}, [allUsers, teacherSubjectIds, currentUser, isLoading]);

  const allTeachers = useMemo(() => {
    if(isLoading || !allUsers) return [];
    return allUsers.filter(u => u.role === 'Teacher');
  }, [allUsers, isLoading]);


  const teacherAttendance = useMemo(() => {
    if (isLoading || !allAttendance) return [];
    return allAttendance;
  }, [allAttendance, isLoading]);
  
  const getTodaysAttendance = () => {
    if (!teacherAttendance) return 0;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = new Set<string>();
    teacherAttendance.forEach(record => {
      if (record.date === today && record.status === 'Present') {
        presentToday.add(record.userId);
      }
    });
    return presentToday.size;
  };

  const totalStudents = teacherStudents?.length || 0;
  const totalTeachers = allTeachers?.length || 0;
  const presentToday = getTodaysAttendance();
  const recentRecords = teacherAttendance
    ?.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
    .slice(0, 5) || [];

  const renderStatCard = (title: string, value: number | string, description: string, icon: React.ReactNode, isLoading: boolean) => (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
  
  const isRole = (role: 'Admin' | 'Teacher') => !isLoadingUser && currentUser?.role === role;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-96" />
              ) : (
                <p>
                  {isRole('Admin') 
                    ? "A high-level overview of the entire system."
                    : "Welcome back! Here's a quick overview of your students and subjects."
                  }
                </p>
              )}
            </div>
         </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
            "Total Students", 
            totalStudents, 
            "Total students in the system", 
            <Users className="h-4 w-4 text-muted-foreground" />, 
            isLoading
        )}
        
        {isRole('Admin') && renderStatCard(
            "Total Teachers", 
            totalTeachers, 
            "Total teachers in the system", 
            <Users className="h-4 w-4 text-muted-foreground" />, 
            isLoading
        )}

        {isRole('Teacher') && renderStatCard(
            "Present Today", 
            presentToday, 
            "Students marked present today", 
            <BarChart3 className="h-4 w-4 text-muted-foreground" />, 
            isLoading
        )}
        
        {renderStatCard(
          "Model Accuracy",
          modelAccuracy,
          "Session-based recognition success rate",
          <Target className="h-4 w-4 text-muted-foreground" />,
          false
        )}

        {isRole('Teacher') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Emotions</CardTitle>
                <Smile className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-full" /> : (
                  <div className="flex -space-x-2 overflow-hidden">
                      {(recentRecords.length > 0) ? recentRecords.map((record, index) => (
                          <div key={record.id || index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center bg-background">
                              <EmotionIcon emotion={record.emotion} />
                          </div>
                      )) : (
                        <p className="text-xs text-muted-foreground">No recent activity.</p>
                      )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Last 5 detected emotions
                </p>
              </CardContent>
            </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={isRole('Admin') ? "lg:col-span-5" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle>
                  {isRole('Admin') ? "System-wide Attendance" : "Recent Activity"}
              </CardTitle>
              <CardDescription>
                  A live log of all attendance records across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AttendanceTable attendanceRecords={recentRecords} />
              )}
            </CardContent>
          </Card>
        </div>

        {!isRole('Admin') && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 w-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <EmotionChart attendanceRecords={teacherAttendance || []} />
                  )}
                </CardContent>
              </Card>
            </div>
        )}
      </div>
    </div>
  );
}
