
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AttendanceTable } from '@/components/reports/attendance-table';
import { EmotionChart } from '@/components/reports/emotion-chart';
import { AiSummary } from '@/components/reports/ai-summary';
import { useCollection, useUser } from '@/firebase';
import type { AttendanceRecord, Subject, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useMemo, useState } from 'react';
import { query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { BellPlus, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { notifyAbsentees } from '@/ai/flows/notify-absent-students';

export default function ReportsPage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  const [isNotifying, setIsNotifying] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>('users');

  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const subjectsQuery = useCallback((ref: any) => {
    if (isAdmin || !currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid, isAdmin]);

  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    !isAdmin && currentUser ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );
  
  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const attendanceQuery = useCallback((ref: any) => {
    if (isAdmin) return ref; // Admins see all
    if (teacherSubjectIds.length > 0) {
      return query(ref, where('subjectId', 'in', teacherSubjectIds));
    }
    // For teachers with no subjects, return a query that finds nothing
    return query(ref, where('subjectId', '==', ''));
  }, [isAdmin, teacherSubjectIds]);

  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>(
    currentUser ? 'attendance' : null,
    { buildQuery: attendanceQuery }
  );

  const isLoading = isLoadingUser || isLoadingRecords || isLoadingUsers || (currentUser?.role === 'Teacher' && isLoadingSubjects);
  
  const filteredAttendance = useMemo(() => {
    if (isLoading || !allAttendance) return [];
    return allAttendance;
  }, [allAttendance, isLoading]);
  
  const todaysAbsentees = useMemo(() => {
    if (!filteredAttendance || !allUsers) return [];
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = filteredAttendance.filter(r => r.date === today && r.status === 'Absent');
    
    // Map record to include student email
    return todaysRecords.map(record => {
        const student = allUsers.find(u => u.id === record.userId);
        return {
            name: record.userName,
            email: student?.email || '',
            subjectName: record.subjectName,
            date: record.date
        }
    }).filter(a => a.email); // Only include those with an email

  }, [filteredAttendance, allUsers]);

  const handleNotify = async () => {
    setIsAlertOpen(false);
    if (todaysAbsentees.length === 0) {
        toast({ title: 'No absentees to notify.' });
        return;
    }
    setIsNotifying(true);
    toast({
        title: 'Sending Notifications...',
        description: `Notifying ${todaysAbsentees.length} absent students.`,
    });
    try {
        const result = await notifyAbsentees({ absentees: todaysAbsentees });
        if (result.success) {
            toast({
                title: 'Notifications Sent',
                description: result.message,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Send Notifications',
            description: e.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsNotifying(false);
    }
  }


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Reports
          </h1>
          <div className="text-muted-foreground">
            {isLoading ? <Skeleton className="h-5 w-72" /> : <p>{(isAdmin ? "View detailed attendance records for all classes." : "View detailed attendance records for your subjects.")}</p>}
          </div>
        </div>
        {todaysAbsentees.length > 0 && (
            <Button onClick={() => setIsAlertOpen(true)} disabled={isNotifying}>
                {isNotifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <BellPlus className="mr-2 h-4 w-4" />
                )}
                Notify Today's Absentees ({todaysAbsentees.length})
            </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-96" /> : (isAdmin ? "A detailed log of all attendance records across the system." : "A detailed log of all attendance records for your classes.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AttendanceTable attendanceRecords={filteredAttendance || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-64" /> : (isAdmin ? "Breakdown of detected emotions across all classes." : "Breakdown of detected emotions in your classes.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <EmotionChart attendanceRecords={filteredAttendance || []} />
              )}
            </CardContent>
          </Card>
          <AiSummary attendanceRecords={filteredAttendance || []} isLoading={isLoading}/>
        </div>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send email notifications to all {todaysAbsentees.length} students
              marked as absent today? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNotify}>
              Yes, Send Notifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
