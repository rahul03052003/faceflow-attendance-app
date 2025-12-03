
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
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateFacialFeatures } from '@/ai/flows/generate-facial-features';
import { useMemo } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export default function UsersPage() {
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isLoadingUser } = useUser();
  const {
    data: allUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useCollection<User>('users');
  const { 
    data: allSubjects, 
    isLoading: isLoadingSubjects 
  } = useCollection<Subject>('subjects');
  const { toast } = useToast();
  
  const isLoading = isLoadingUser || isLoadingUsers || isLoadingSubjects;

  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const assignableSubjects = useMemo(() => {
    if (isLoadingSubjects || !allSubjects) return [];
    if (isAdmin || currentUser?.role === 'Teacher') {
      return allSubjects;
    }
    return [];
  }, [allSubjects, currentUser, isAdmin, isLoadingSubjects]);

  const filteredUsers = useMemo(() => {
    if (isLoading || !allUsers || !currentUser) return [];

    if (isAdmin) {
      // Admins see all users except themselves for safety. They manage teachers.
      return allUsers.filter(u => u.id !== currentUser.uid && u.role === 'Teacher');
    }
    
    // Teachers see all students.
    if (currentUser.role === 'Teacher') {
      return allUsers.filter(u => u.role === 'Student');
    }

    return [];
  }, [allUsers, currentUser, isAdmin, isLoading]);


  const handleAddUser = async (
    newUser: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }
  ) => {
    
    const userToAdd = {
      name: newUser.name,
      email: newUser.email,
      registerNo: newUser.registerNo,
      avatar: newUser.photoPreview || `https://i.pravatar.cc/150?u=${newUser.email}`,
      role: 'Student' as const,
      subjects: newUser.subjects || [],
      facialFeatures: null,
    };

    const collectionRef = collection(firestore, 'users');
    
    try {
        const docRef = await addDoc(collectionRef, userToAdd);

        toast({
          title: 'User Added',
          description: `${newUser.name} has been added to the database.`,
        });

        if (newUser.photoPreview) {
            toast({
              title: 'Analyzing Photo...',
              description: 'Generating facial features for recognition. This may take a moment.',
            });
            try {
                const { vector } = await generateFacialFeatures({ photoDataUri: newUser.photoPreview });
                await updateDoc(docRef, { facialFeatures: vector });
                 toast({
                    title: 'AI Analysis Complete',
                    description: `Facial features for ${newUser.name} have been saved.`,
                });
            } catch (e) {
                console.error("Failed to generate facial features:", e);
                toast({
                    variant: "destructive",
                    title: "AI Analysis Failed",
                    description: "Could not analyze the user's photo. The user has been added, but recognition may fail."
                })
            }
        }
    } catch (serverError) {
         const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: userToAdd,
          });
         errorEmitter.emit('permission-error', permissionError);
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
    if (updatedUser.photoPreview) {
        userToUpdate.avatar = updatedUser.photoPreview;
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
                const { vector } = await generateFacialFeatures({ photoDataUri: updatedUser.photoPreview! });
                await updateDoc(docRef, { facialFeatures: vector });
                toast({
                    title: 'AI Analysis Complete',
                    description: `New facial features for ${updatedUser.name} have been saved.`,
                });
            } catch(e) {
                 console.error("Failed to re-generate facial features:", e);
                 toast({
                    variant: "destructive",
                    title: "AI Analysis Failed",
                    description: "Could not analyze the new photo. User details were updated, but recognition may fail with the new image."
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
      // NOTE: This uses a hardcoded password. In a real app, this should be handled securely
      // (e.g., by sending a password reset email or a temporary password).
      const userCredential = await createUserWithEmailAndPassword(auth, newTeacher.email, 'teacher123');
      const teacherId = userCredential.user.uid;

      const teacherToAdd = {
        name: newTeacher.name,
        email: newTeacher.email,
        avatar: `https://i.pravatar.cc/150?u=${newTeacher.email}`,
        role: 'Teacher' as const,
        subjects: newTeacher.subjects || [],
        registerNo: '', // Not applicable to teachers
      };
      
      const userDocRef = doc(firestore, 'users', teacherId);
      await setDoc(userDocRef, teacherToAdd);

      toast({
        title: 'Teacher Added',
        description: `${newTeacher.name} has been created and assigned to subjects.`,
      });

    } catch (error: any) {
       console.error("Error creating teacher:", error);
       if (error.code === 'auth/email-already-in-use') {
         toast({
            variant: "destructive",
            title: "Failed to Add Teacher",
            description: "This email address is already in use by another account.",
          });
       } else if (error.name === 'FirestorePermissionError') {
          errorEmitter.emit('permission-error', error);
       } else {
          toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not create the teacher account. See the console for details.",
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

    return <UsersTable users={filteredUsers} isAdmin={isAdmin} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} subjects={allSubjects || []} />;
  };

  const pageTitle = isAdmin ? "Teacher Management" : "Student Management";
  const pageDescription = isAdmin
    ? "Add and manage all teachers in the system."
    : "View and manage students in the system.";
  const cardTitle = isAdmin ? "Teacher List" : "Student List";
  const cardDescription = isAdmin
    ? "A list of all teachers in the system."
    : "A list of all students in the system.";

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
          {isAdmin ? (
            <AddTeacherDialog onAddTeacher={handleAddTeacher} subjects={assignableSubjects} />
          ) : (
            <AddUserDialog onAddUser={handleAddUser} subjects={assignableSubjects} />
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
