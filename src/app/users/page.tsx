'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UsersTable } from '@/components/users/users-table';
import { AddUserDialog } from '@/components/users/add-user-dialog';
import { USERS } from '@/lib/data';
import type { User } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(USERS);

  const handleAddUser = (newUser: Omit<User, 'id' | 'avatar' | 'role'> & { photo?: File }) => {
    const userToAdd: User = {
      id: (users.length + 1).toString(),
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.photo ? URL.createObjectURL(newUser.photo) : `https://i.pravatar.cc/150?u=${newUser.email}`,
      role: 'User', // Default role
    };
    setUsers((prevUsers) => [userToAdd, ...prevUsers]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage user profiles.
          </p>
        </div>
        <AddUserDialog onAddUser={handleAddUser} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            A list of all users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} onDeleteUser={handleDeleteUser} />
        </CardContent>
      </Card>
    </div>
  );
}
