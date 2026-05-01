'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddUserForm, { UserFormData } from '@/components/users/AddUserForm';

interface UserRow {
  id: string;
  name: string;
  role: string;
  email: string;
  leads: number;
  department: string;
}

export default function UsersPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userList, setUserList] = useState<UserRow[]>([
    { id: '1', name: 'John Doe', role: 'Admin', email: 'john@example.com', leads: 15, department: 'Sales' },
    { id: '2', name: 'Rohit Sharma', role: 'Sales Executive', email: 'priya@example.com', leads: 22, department: 'Sales' },
    { id: '3', name: 'Mike Johnson', role: 'Sales Manager', email: 'mike@example.com', leads: 18, department: 'Enterprise' },
    { id: '4', name: 'Ravi Kumar', role: 'Sales Executive', email: 'ravi@example.com', leads: 12, department: 'Sales' },
  ]);

  const handleEditUser = (user: UserRow) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleUpdateUser = (data: UserFormData) => {
    if (selectedUser) {
      setUserList(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, ...data }
          : u
      ));
      setIsEditOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUserList(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <button
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          onClick={() => setIsAddOpen(true)}
        >
          + Add User
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              {['Name', 'Role', 'Email', 'Department', 'Assigned Leads', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{u.name[0]}</div>
                    <span className="text-sm font-medium text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.department}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">{u.leads}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      onClick={() => handleEditUser(u)}
                    >
                      Edit
                    </button>
                    <span className="text-gray-300 mx-1">|</span>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add User" subtitle="Create a new user account" size="lg">
        <AddUserForm onSave={(data: UserFormData) => {
          const newUser: UserRow = {
            id: `u${Date.now()}`,
            name: data.name,
            email: data.email,
            role: data.role,
            department: data.department,
            leads: data.leads,
          };
          setUserList(prev => [newUser, ...prev]);
          setIsAddOpen(false);
        }} onClose={() => setIsAddOpen(false)} />
      </Modal>
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User" subtitle="Update user information" size="lg">
        <AddUserForm
          onSave={handleUpdateUser}
          onClose={() => setIsEditOpen(false)}
          initialData={selectedUser || undefined}
          mode="edit"
        />
      </Modal>
    </div>
  );
}
