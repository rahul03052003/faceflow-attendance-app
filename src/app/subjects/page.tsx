
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubjectsTable } from '@/components/subjects/subjects-table';
import { AddSubjectDialog } from '@/components/subjects/add-subject-dialog';
import type { Subject, User } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCallback, useMemo } from 'react';

export default function SubjectsPage() {
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>('users');

  const subjectsQuery = useCallback((ref: any) => {
    if (!currentUser?.uid) return query(ref, where('teacherId', '==', '')); // Empty query
    if (currentUser.role === 'Admin') return ref; // Admins see all
    return query(ref, where('teacherId', '==', currentUser.uid)); // Teachers see their own
  }, [currentUser?.uid, currentUser?.role]);

  const {
    data: allSubjects,
    isLoading: isLoadingSubjects,
    error,
  } = useCollection<Subject>(
    currentUser?.uid ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );

  const isLoading = isLoadingUser || isLoadingSubjects || isLoadingUsers;

  const isAdmin = useMemo(() => currentUser?.role === 'Admin', [currentUser]);

  const subjectsToDisplay = useMemo(() => {
    if (isLoading || !allSubjects) return [];
    return allSubjects;
  }, [allSubjects, isLoading]);


  const handleAddSubject = (
    newSubject: Omit<Subject, 'id'> & {teacherId?: string}
  ) => {
    if (!currentUser) return;
    const subjectWithTeacher = { ...newSubject, teacherId: currentUser.uid };
    const collectionRef = collection(firestore, 'subjects');
    addDoc(collectionRef, subjectWithTeacher).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: subjectWithTeacher,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    const docRef = doc(firestore, 'subjects', subjectId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error loading subjects: {error.message}</p>;
    }

    return <SubjectsTable subjects={subjectsToDisplay} users={allUsers || []} isAdmin={isAdmin} onDeleteSubject={handleDeleteSubject} />;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "View, add, and manage all subjects." : "View, add, and manage subjects you teach."}
          </p>
        </div>
        <AddSubjectDialog onAddSubject={handleAddSubject} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? "All Subjects" : "Your Subject List"}
          </CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all subjects in the system." : "A list of all subjects you are assigned to teach."}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

    