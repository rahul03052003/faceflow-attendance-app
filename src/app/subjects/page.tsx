
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
import type { Subject } from '@/lib/types';
import { useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DEMO_SUBJECTS } from '@/lib/types';

export default function SubjectsPage() {
  const firestore = useFirestore();
  const {
    data: subjectsData,
    isLoading,
    error,
  } = useCollection<Subject>('subjects');

  const useDemoData = (!subjectsData || subjectsData.length === 0) && !isLoading;
  const subjects = useDemoData ? DEMO_SUBJECTS : subjectsData;

  const handleAddSubject = (
    newSubject: Omit<Subject, 'id'>
  ) => {
    if (useDemoData) {
      alert("Cannot add subjects when in demo mode. Please connect to Firebase to add real data.");
      return;
    }
    const collectionRef = collection(firestore, 'subjects');
    addDoc(collectionRef, newSubject).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: newSubject,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (useDemoData) {
      alert("Cannot delete subjects when in demo mode. Please connect to Firebase to add real data.");
      return;
    }
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
    if (isLoading && !useDemoData) {
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

    return <SubjectsTable subjects={subjects || []} onDeleteSubject={handleDeleteSubject} isDemo={useDemoData} />;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage subjects for attendance.
          </p>
        </div>
        <AddSubjectDialog onAddSubject={handleAddSubject} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>
            A list of all subjects in the system.
             {useDemoData && <span className="text-yellow-600 dark:text-yellow-400 font-semibold"> (Demo Data)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
