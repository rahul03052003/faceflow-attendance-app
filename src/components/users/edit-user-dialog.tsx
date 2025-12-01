
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { UserPlus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Subject } from '@/lib/types';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '../ui/checkbox';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  registerNo: z.string().min(1, { message: 'Register number is required.' }),
  subjects: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one subject.',
  }),
  photo: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditUserDialogProps = {
  user: User;
  subjects: Subject[];
  onEditUser: (userId: string, user: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }) => void;
  children: React.ReactNode;
};

export function EditUserDialog({ user, subjects = [], onEditUser, children }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.avatar);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      registerNo: user.registerNo,
      subjects: user.subjects || [],
    },
  });
  
  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      registerNo: user.registerNo,
      subjects: user.subjects || [],
    });
    setPhotoPreview(user.avatar);
  }, [user, form]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: FormValues) => {
      onEditUser(user.id, { ...values, photo: photoFile || undefined, photoPreview: photoPreview || undefined });
      toast({
        title: 'User Updated',
        description: `${values.name}'s details are being updated.`,
      });
      handleOpenChange(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        registerNo: user.registerNo,
        subjects: user.subjects || [],
      });
      setPhotoPreview(user.avatar);
      setPhotoFile(null);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update the details for {user.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview || undefined} alt="User photo" />
                  <AvatarFallback>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                  <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                </Button>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
              control={form.control}
              name="registerNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Register No.</FormLabel>
                  <FormControl>
                      <Input placeholder="R001" {...field} />
                  </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjects"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Assign Subjects</FormLabel>
                  </div>
                  {subjects.length > 0 ? (
                    subjects.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="subjects"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.title} ({item.code})
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No subjects available to assign.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
