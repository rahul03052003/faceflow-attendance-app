
'use client';

import { useState, useRef } from 'react';
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
import { BookPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Subject } from '@/lib/types';

type AddSubjectDialogProps = {
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
};

export function AddSubjectDialog({ onAddSubject }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const code = formData.get('code') as string;

    if (title && code) {
      onAddSubject({ title, code });
      toast({
        title: 'Subject Added',
        description: `${title} is being added to the database.`,
      });
      setOpen(false);
    } else {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      formRef.current?.reset();
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
          </div>
          <DialogFooter>
            <Button type="submit">Save Subject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
