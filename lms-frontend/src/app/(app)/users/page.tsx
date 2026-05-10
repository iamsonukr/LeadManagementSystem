"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddUserForm, { UserFormData } from "@/components/users/AddUserForm";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUserRecord,
  changeUserPassword,
} from "@/store/slices/usersSlice";
import { fetchTeamMembers } from "@/store/slices/teamMembersSlice";
import { UserRecord, ProjectRecord } from "@/types";
import { usersService } from "@/services";
import { Pencil, FolderOpen, KeyRound, Trash2 } from "lucide-react";

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
  const { items: departments, isLoading: isDepartmentsLoading } = useAppSelector((state) => state.teamMembers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserRecord | null>(null);
  const [projectsUser, setProjectsUser] = useState<UserRecord | null>(null);
  const [userProjects, setUserProjects] = useState<ProjectRecord[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const departmentOptions = departments
    .map((department) => department.fullName.trim())
    .filter((department, index, options) => department && options.indexOf(department) === index);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchTeamMembers());
    console.log("users", users);
  }, [dispatch]);

  const handleUpdateUser = (data: UserFormData) => {
    if (!selectedUser) return;

    dispatch(updateUserRecord({
      ...selectedUser,
      ...formToUserPayload(data),
    }));
    setSelectedUser(null);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    dispatch(deleteUser(deletingUser.id));
    setDeletingUser(null);
  };

  const handleViewProjects = async (user: UserRecord) => {
    setProjectsUser(user);
    setLoadingProjects(true);
    try {
      const projects = await usersService.getProjectsForUser(user.id);
      setUserProjects(projects);
    } catch (err) {
      console.error("Error fetching user projects:", err);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Users</h1>
          <p className="mt-1 text-sm text-gray-500">Login accounts for dashboard access. Departments are managed separately.</p>
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
                {["Name", "Access Role", "Email", "Department", "Status", "Lead Count", "Actions"].map(h => (
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        title="Edit User"
                        className="p-2 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleViewProjects(u)}
                        title="View Projects"
                        className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                      >
                        <FolderOpen size={16} />
                      </button>

                      <button
                        onClick={() => setPasswordUser(u)}
                        title="Change Password"
                        className="p-2 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                      >
                        <KeyRound size={16} />
                      </button>

                      <button
                        onClick={() => setDeletingUser(u)}
                        title="Delete User"
                        className="p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
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
          departments={departmentOptions}
          isDepartmentsLoading={isDepartmentsLoading}
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
            departments={departmentOptions}
            isDepartmentsLoading={isDepartmentsLoading}
            onSave={handleUpdateUser}
            onClose={() => setSelectedUser(null)}
            initialData={userToFormData(selectedUser)}
            mode="edit"
          />
        )}
      </Modal>
      <Modal open={!!projectsUser} onClose={() => setProjectsUser(null)} title={`Projects for ${projectsUser?.name}`} subtitle="View all projects assigned to this user" size="lg">
        <div className="space-y-3">
          {loadingProjects ? (
            <div className="text-center py-6 text-gray-500">Loading projects...</div>
          ) : userProjects.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No projects assigned to this user.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userProjects.map(project => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{project.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Status: <span className="font-medium text-gray-700">{project.status}</span></p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${project.priority === 'High' ? 'bg-red-50 text-red-700' :
                        project.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-green-50 text-green-700'
                      }`}>
                      {project.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p className="font-medium text-gray-700">${project.budget?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount Received:</span>
                      <p className="font-medium text-gray-700">${project.amountReceived?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                  {project.services && project.services.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500">Services:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.services.map((service, idx) => (
                          <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deletingUser}
        title="Delete Dashboard User"
        description={`Delete ${deletingUser?.name ?? 'this user'}'s dashboard access? Existing lead ownership will keep its current text value.`}
        isWorking={isSubmitting}
        onConfirm={handleDeleteUser}
        onClose={() => setDeletingUser(null)}
      />
      <ChangePasswordModal
        isOpen={!!passwordUser}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        isSubmitting={isSubmitting}
        onSubmit={(password) => {
          if (passwordUser) {
            dispatch(changeUserPassword({ id: passwordUser.id, password })).then(() => {
              setPasswordUser(null);
            });
          }
        }}
      />
    </div>
  );
}
