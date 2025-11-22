
'use client';
import type { Subject } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, Ban } from 'lucide-react';
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

type SubjectsTableProps = {
  subjects: Subject[];
  onDeleteSubject: (subjectId: string) => void;
  isDemo?: boolean;
};

export function SubjectsTable({ subjects, onDeleteSubject, isDemo = false }: SubjectsTableProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (subject: Subject) => {
    if (isDemo) {
        toast({
            variant: "destructive",
            title: "Demo Mode",
            description: "Deleting subjects is disabled in demo mode.",
        });
        return;
    }
    setSubjectToDelete(subject);
    setIsAlertOpen(true);
  };
  
  const handleEditClick = () => {
    if (isDemo) {
        toast({
            variant: "destructive",
            title: "Demo Mode",
            description: "Editing subjects is disabled in demo mode.",
        });
        return;
    }
    // In a real app, this would open an edit dialog.
     toast({
        title: "Coming Soon!",
        description: "Editing functionality is not yet implemented.",
    });
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
                    <DropdownMenuItem onClick={handleEditClick} disabled={isDemo}>
                       {isDemo && <Ban className="mr-2 h-4 w-4" />}
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(subject)}
                       disabled={isDemo}
                    >
                       {isDemo && <Ban className="mr-2 h-4 w-4" />}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
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
