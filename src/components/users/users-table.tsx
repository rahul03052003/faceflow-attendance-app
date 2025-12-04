
'use client';
import type { User, Subject } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { EditUserDialog } from './edit-user-dialog';

type UsersTableProps = {
  users: User[];
  subjects: Subject[];
  onEditUser: (userId: string, updatedUser: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }) => void;
  onDeleteUser: (userId: string) => void;
  isAdmin?: boolean;
};

export function UsersTable({ users, subjects, onEditUser, onDeleteUser, isAdmin = false }: UsersTableProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const getSubjectNames = (subjectIds: string[] = []) => {
    if (!subjectIds || subjectIds.length === 0) return 'N/A';
    return subjectIds.map(id => {
      const subject = subjects.find(s => s.id === id);
      return subject ? subject.title : 'Unknown';
    }).join(', ');
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      toast({
        title: 'User Deleted',
        description: `${userToDelete.name} has been removed from the system.`,
      });
    }
    setIsAlertOpen(false);
    setUserToDelete(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Register No.</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.registerNo || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Teacher' ? 'secondary' : 'outline'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{getSubjectNames(user.subjects)}</TableCell>
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
                    <EditUserDialog user={user} subjects={subjects} onEditUser={onEditUser}>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                         Edit
                       </DropdownMenuItem>
                    </EditUserDialog>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(user)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 4 : 5} className="h-24 text-center">
                {isAdmin ? "No teachers found. Add one to get started." : "No students found."}
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
              account of {userToDelete?.name}.
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
