
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UsersTable } from '@/components/users/users-table';
import { AddUserDialog } from '@/components/users/add-user-dialog';
import { AddTeacherDialog } from '@/components/users/add-teacher-dialog';
import type { User, Subject } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateFacialFeatures } from '@/ai/flows/generate-facial-features';
import { useCallback, useMemo } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// NOTE: In a real production app, you would use a Cloud Function to set custom claims.
// This function simulates that backend operation for demonstration purposes. It does not
// actually set claims but serves as a placeholder for where that logic would be triggered.
async function setCustomUserClaims(uid: string, claims: object) {
  console.log(
    `SIMULATING setting custom claims for user ${uid}:`,
    claims,
    'In a real app, this would be a backend Cloud Function (e.g., httpsCallable) call.'
  );
  return Promise.resolve();
}


export default function UsersPage() {
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  
  const {
    data: allUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useCollection<User>('users');

  const subjectsQuery = useCallback((ref: any) => {
    if (currentUser?.role === 'Admin') return ref;
    if (!currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid, currentUser?.role]);
  
  const { 
    data: allSubjects, 
    isLoading: isLoadingSubjects 
  } = useCollection<Subject>(
    currentUser ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );

  const { toast } = useToast();
  
  const isLoading = isLoadingUser || isLoadingUsers || isLoadingSubjects;

  const isAdmin = useMemo(() => {
    if (isLoadingUser || !currentUser) return false;
    return currentUser.role === 'Admin';
  }, [currentUser, isLoadingUser]);
  
  const teacherSubjects = useMemo(() => {
    if (isLoadingSubjects || !allSubjects || !currentUser) return [];
    if (isAdmin) return allSubjects;
    return allSubjects.filter(s => s.teacherId === currentUser.uid);
  }, [allSubjects, isLoadingSubjects, currentUser, isAdmin]);
  
  const teacherSubjectIds = useMemo(() => teacherSubjects.map(s => s.id), [teacherSubjects]);

  const usersToDisplay = useMemo(() => {
    if (isLoading || !allUsers) return [];
    
    if (isAdmin) {
      // Admins see teachers and other admins
      return allUsers.filter(u => u.role !== 'Student');
    }
    
    // Teachers see only students in their subjects
    return allUsers.filter(u => 
      u.role === 'Student' &&
      Array.isArray(u.subjects) &&
      u.subjects.some(subId => teacherSubjectIds.includes(subId))
    );
  }, [allUsers, teacherSubjectIds, isAdmin, isLoading]);


  const handleAddUser = async (
    newUser: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }
  ) => {
    
    toast({
      title: 'Adding User...',
      description: `Analyzing photo and preparing to add ${newUser.name}.`,
    });

    try {
      // Step 1: Generate facial features first
      const { vector } = await generateFacialFeatures({ photoDataUri: newUser.photoPreview });

      // Step 2: Prepare user document with facial features included
      const userToAdd: Omit<User, 'id'> = {
        name: newUser.name,
        email: newUser.email,
        registerNo: newUser.registerNo,
        role: 'Student' as const,
        subjects: newUser.subjects || [],
        avatar: newUser.photoPreview || `https://picsum.photos/seed/${newUser.email}/150/150`,
        facialFeatures: vector,
      };

      // Step 3: Add the complete document to Firestore in one go
      const collectionRef = collection(firestore, 'users');
      addDoc(collectionRef, userToAdd).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: userToAdd,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
       toast({
        title: 'User Added Successfully',
        description: `${newUser.name} has been added with facial recognition data.`,
      });

    } catch (e: any) {
        console.error("Failed to add user:", e);
        toast({
            variant: "destructive",
            title: "Failed to Add User",
            description: e.message || "An error occurred during AI analysis or database writing."
        })
    }
  };

  const handleEditUser = async (
    userId: string,
    updatedUser: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }
  ) => {
    const docRef = doc(firestore, 'users', userId);
    const userToUpdate: any = {
      name: updatedUser.name,
      email: updatedUser.email,
      registerNo: updatedUser.registerNo,
      subjects: updatedUser.subjects || [],
    };
    
    let photoChanged = false;
    let newAvatarUrl = '';
    if (updatedUser.photoPreview) {
        userToUpdate.avatar = updatedUser.photoPreview;
        newAvatarUrl = updatedUser.photoPreview;
        photoChanged = true;
    }

    try {
        await updateDoc(docRef, userToUpdate);
         toast({
            title: 'User Updated',
            description: `${updatedUser.name}'s details have been updated.`,
        });

        if (photoChanged) {
            toast({
              title: 'Re-analyzing Photo...',
              description: 'Generating new facial features for recognition.',
            });
            try {
                const { vector } = await generateFacialFeatures({ photoDataUri: newAvatarUrl });
                await updateDoc(docRef, { facialFeatures: vector });
                toast({
                    title: 'AI Analysis Complete',
                    description: `New facial features for ${updatedUser.name} have been saved.`,
                });
            } catch(e: any) {
                 console.error("Failed to re-generate facial features:", e);
                 toast({
                    variant: "destructive",
                    title: "AI Analysis Failed",
                    description: e.message || "Could not analyze the new photo. User details were updated, but recognition may fail with the new image."
                })
            }
        }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: userToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  const handleAddTeacher = async (
    newTeacher: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures' | 'registerNo'> & { email: string, name: string, subjects?: string[] }
  ) => {
    const auth = getAuth();
    try {
      // Create the Firebase Auth user first
      const userCredential = await createUserWithEmailAndPassword(auth, newTeacher.email, 'teacher123');
      const teacherId = userCredential.user.uid;
      
      // Simulate setting custom claims (in a real app, this is a backend operation)
      await setCustomUserClaims(teacherId, { role: 'Teacher' });

      const teacherToAdd = {
        name: newTeacher.name,
        email: newTeacher.email,
        avatar: `https://i.pravatar.cc/150?u=${newTeacher.email}`,
        role: 'Teacher' as const,
        subjects: newTeacher.subjects || [],
        registerNo: '', // Not applicable to teachers
      };
      
      const userDocRef = doc(firestore, 'users', teacherId);

      // Now create the Firestore document, with proper error handling
      setDoc(userDocRef, teacherToAdd)
        .then(() => {
          toast({
            title: 'Teacher Added',
            description: `${newTeacher.name} has been created and assigned to subjects.`,
          });
        })
        .catch(async (serverError) => {
          // This is the new, specific error handling
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: teacherToAdd,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

    } catch (authError: any) {
      // Handle errors from createUserWithEmailAndPassword
      if (authError.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Failed to Add Teacher",
          description: "This email address is already in use by another account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: authError.message || "Could not create the teacher's auth account.",
        });
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    // Note: This only deletes the Firestore record, not the Auth user.
    // In a real app, you would need a Cloud Function to handle this.
    const docRef = doc(firestore, 'users', userId);
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

    if (usersError) {
      return <p className="text-destructive">Error loading users: {usersError.message}</p>;
    }

    return <UsersTable users={usersToDisplay} isAdmin={isAdmin} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} subjects={allSubjects || []} />;
  };

  const pageTitle = isAdmin ? "Teacher Management" : "Student Management";
  const pageDescription = isAdmin
    ? "Add and manage all teachers and admins in the system."
    : "View and manage all students in the system.";
  const cardTitle = isAdmin ? "User List" : "Student List";
  const cardDescription = isAdmin
    ? "A list of all teachers and admins in the system."
    : "A list of all students assigned to your subjects.";
    
  const assignableSubjects = isAdmin ? allSubjects : teacherSubjects;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <div className="flex gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-36" />
          ) : isAdmin ? (
            <AddTeacherDialog onAddTeacher={handleAddTeacher} subjects={allSubjects || []} />
          ) : (
            <AddUserDialog onAddUser={handleAddUser} subjects={teacherSubjects || []} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
