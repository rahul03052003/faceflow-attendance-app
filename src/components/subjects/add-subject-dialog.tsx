
'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Subject, User } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';

type AddSubjectDialogProps = {
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
};

export function AddSubjectDialog({ onAddSubject }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const { data: allUsers } = useCollection<User>('users');

  const isAdmin = useMemo(() => currentUser?.role === 'Admin', [currentUser]);

  const teachers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.role === 'Teacher');
  }, [allUsers]);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const code = formData.get('code') as string;

    if (!title || !code) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }
    
    let teacherId = currentUser?.uid;
    if (isAdmin) {
      if (!selectedTeacherId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a teacher for the subject.',
        });
        return;
      }
      teacherId = selectedTeacherId;
    }

    if (!teacherId) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not determine the teacher. Please try again.',
      });
      return;
    }

    onAddSubject({ title, code, teacherId });
    toast({
      title: 'Subject Added',
      description: `${title} is being added to the database.`,
    });
    setOpen(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      formRef.current?.reset();
      setSelectedTeacherId('');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <BookPlus className="mr-2 h-4 w-4" />
          Add New Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Enter the details for the new subject. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" name="title" placeholder="e.g., Computer Science 101" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input id="code" name="code" placeholder="e.g., CS101" className="col-span-3" required />
            </div>
            {isAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">
                  Teacher
                </Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Save Subject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
