
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
import { query, where, writeBatch, collection, getDocs, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { BellPlus, Loader2, RefreshCw } from 'lucide-react';
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
import { useFirestore } from '@/firebase';

export default function ReportsPage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  const firestore = useFirestore();
  const [isNotifying, setIsNotifying] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRefreshAlertOpen, setIsRefreshAlertOpen] = useState(false);
  const { toast } = useToast();

  const { data: allUsers, isLoading: isLoadingUsers, setData: setAllUsers } = useCollection<User>('users');

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

  const { data: allAttendance, isLoading: isLoadingRecords, setData: setAllAttendance } = useCollection<AttendanceRecord>(
    currentUser ? 'attendance' : null,
    { buildQuery: attendanceQuery }
  );
  
  const handleRefresh = (clearData = false) => {
    setIsRefreshAlertOpen(false);
    if (clearData) {
      handleArchiveAndClearAllRecords();
      return;
    }
    if (allAttendance) setAllAttendance([...allAttendance]);
    if (allUsers) setAllUsers([...allUsers]);
    toast({
      title: 'Data Refreshed',
      description: 'The latest attendance data has been loaded.',
    });
  };

  const handleArchiveAndClearAllRecords = async () => {
    toast({
        title: 'Archiving & Clearing Data...',
        description: 'Archiving records before clearing the log.',
    });
    try {
        const attendanceRef = collection(firestore, 'attendance');
        const querySnapshot = await getDocs(attendanceRef);
        
        if (querySnapshot.empty) {
            toast({
                title: 'No Records to Archive',
                description: 'The attendance log is already empty.',
            });
            return;
        }

        const archiveBatch = writeBatch(firestore);
        const deleteBatch = writeBatch(firestore);
        const archiveTimestamp = serverTimestamp();

        querySnapshot.forEach((docSnapshot) => {
            // 1. Archive the record
            const recordData = docSnapshot.data();
            const archiveRef = doc(collection(firestore, 'attendance_archive'));
            archiveBatch.set(archiveRef, { 
                ...recordData, 
                archivedAt: archiveTimestamp 
            });
            
            // 2. Add the original record to the delete batch
            deleteBatch.delete(docSnapshot.ref);
        });

        // First, commit the archive batch to ensure data is saved
        await archiveBatch.commit();
        
        // Then, commit the delete batch
        await deleteBatch.commit();

        toast({
            title: 'Archive & Clear Complete',
            description: `${querySnapshot.size} records have been archived and the log has been cleared.`,
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Error During Operation',
            description: e.message || 'Could not archive and clear attendance records.',
        });
    }
  }

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
        <div className="flex items-center gap-2">
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
             <Button variant="outline" onClick={() => setIsRefreshAlertOpen(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
            </Button>
        </div>
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

      <AlertDialog open={isRefreshAlertOpen} onOpenChange={setIsRefreshAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh or Archive Data?</AlertDialogTitle>
            <AlertDialogDescription>
              You can reload the latest data, or archive all current attendance records and clear the log. This is useful for clearing data at the end of a term while keeping a historical copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRefresh(false)}>
              Just Refresh
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleRefresh(true)} className="bg-destructive hover:bg-destructive/90">
              Archive and Clear Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
