
'use client';
import type { Subject, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EditSubjectDialog } from './edit-subject-dialog';


type SubjectsTableProps = {
  subjects: Subject[];
  users: User[];
  isAdmin?: boolean;
  onEditSubject: (subjectId: string, updatedData: Omit<Subject, 'id' | 'teacherId'>) => void;
  onDeleteSubject: (subjectId: string) => void;
};

export function SubjectsTable({ subjects, users, isAdmin = false, onEditSubject, onDeleteSubject }: SubjectsTableProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const { toast } = useToast();

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Unassigned';
    const teacher = users.find(u => u.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (subjectToDelete) {
      onDeleteSubject(subjectToDelete.id);
      toast({
        title: 'Subject Deleted',
        description: `${subjectToDelete.title} has been removed from the system.`,
      });
    }
    setIsAlertOpen(false);
    setSubjectToDelete(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Code</TableHead>
            {isAdmin && <TableHead>Teacher</TableHead>}
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.title}</TableCell>
              <TableCell>{subject.code}</TableCell>
              {isAdmin && <TableCell>{getTeacherName(subject.teacherId)}</TableCell>}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <EditSubjectDialog subject={subject} onEditSubject={onEditSubject}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                      </DropdownMenuItem>
                    </EditSubjectDialog>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(subject)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
           {subjects.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center">
                No subjects found. Add a new one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subject {subjectToDelete?.title}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
