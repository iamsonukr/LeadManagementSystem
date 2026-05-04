"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import AddUserForm, { UserFormData } from "@/components/users/AddUserForm";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUserRecord,
} from "@/store/slices/usersSlice";
import { UserRecord } from "@/types";

function userToFormData(user: UserRecord): UserFormData {
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    department: user.department,
    phone: user.phone,
    status: user.status,
    leads: user.leads,
  };
}

function formToUserPayload(data: UserFormData): Omit<UserRecord, "id" | "createdAt" | "updatedAt"> {
  return {
    name: data.name,
    email: data.email,
    role: data.role as UserRecord["role"],
    department: data.department,
    phone: data.phone,
    status: data.status as UserRecord["status"],
    leads: data.leads,
  };
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { items: users, isLoading, isSubmitting, error } = useAppSelector((state) => state.users);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleUpdateUser = (data: UserFormData) => {
    if (!selectedUser) return;

    dispatch(updateUserRecord({
      ...selectedUser,
      ...formToUserPayload(data),
    }));
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Delete this user?")) {
      dispatch(deleteUser(userId));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <button
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          onClick={() => setIsAddOpen(true)}
          disabled={isSubmitting}
        >
          + Add User
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50/60 border-b border-gray-100">
              <tr>
                {["Name", "Role", "Email", "Department", "Status", "Assigned Leads", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{u.name[0] || "U"}</div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.department || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{u.leads}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        onClick={() => setSelectedUser(u)}
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
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading users...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add User" subtitle="Create a new user account" size="lg">
        <AddUserForm
          onSave={(data: UserFormData) => {
            dispatch(addUser({
              ...formToUserPayload(data),
              password: data.password,
            }));
            setIsAddOpen(false);
          }}
          onClose={() => setIsAddOpen(false)}
        />
      </Modal>
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Edit User" subtitle="Update user information" size="lg">
        {selectedUser && (
          <AddUserForm
            onSave={handleUpdateUser}
            onClose={() => setSelectedUser(null)}
            initialData={userToFormData(selectedUser)}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}
