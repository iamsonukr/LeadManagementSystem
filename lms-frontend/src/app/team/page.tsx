"use client";

import AddTeamMemberForm, { TeamFormData } from "@/components/team/AddTeamMember";
import Modal from "@/components/ui/Modal";
import { PenLine, Plus } from "lucide-react";
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  joiningDate: string;
  currentProject: string;
  status: string;
}

const initialUsers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    role: "Frontend Developer",
    email: "john@example.com",
    department: "Development",
    joiningDate: "2024-01-12",
    currentProject: "CRM Dashboard",
    status: "Active",
  },
  {
    id: "2",
    name: "Rohit Sharma",
    role: "UI/UX Designer",
    email: "priya@example.com",
    department: "Design",
    joiningDate: "2024-03-08",
    currentProject: "Website Redesign",
    status: "Active",
  },
  {
    id: "3",
    name: "Mike Johnson",
    role: "Video Editor",
    email: "mike@example.com",
    department: "Media",
    joiningDate: "2023-02-20",
    currentProject: "Promo Video",
    status: "On Leave",
  },
  {
    id: "4",
    name: "Ravi Kumar",
    role: "Backend Developer",
    email: "ravi@example.com",
    department: "Development",
    joiningDate: "2024-04-15",
    currentProject: "API Integration",
    status: "Active",
  },
  {
    id: "5",
    name: "Anjali Mehta",
    role: "SEO Specialist",
    email: "anjali@example.com",
    department: "Marketing",
    joiningDate: "2024-06-01",
    currentProject: "SEO Campaign",
    status: "Inactive",
  },
];

function formatJoiningDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function memberToFormData(member: TeamMember): TeamFormData {
  return {
    fullName: member.name,
    email: member.email,
    role: member.role,
    department: member.department,
    joiningDate: member.joiningDate,
    currentProject: member.currentProject,
    status: member.status,
  };
}

export default function TeamPage() {
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [users, setUsers] = useState<TeamMember[]>(initialUsers);

  const handleAddMember = (data: TeamFormData) => {
    setUsers((prev) => [
      {
        id: Date.now().toString(),
        name: data.fullName,
        role: data.role,
        email: data.email,
        department: data.department,
        joiningDate: data.joiningDate,
        currentProject: data.currentProject,
        status: data.status,
      },
      ...prev,
    ]);
    setOpen(false);
  };

  const handleEditMember = (data: TeamFormData) => {
    if (!editingMember) return;

    setUsers((prev) =>
      prev.map((member) =>
        member.id === editingMember.id
          ? {
              ...member,
              name: data.fullName,
              role: data.role,
              email: data.email,
              department: data.department,
              joiningDate: data.joiningDate,
              currentProject: data.currentProject,
              status: data.status,
            }
          : member
      )
    );
    setEditingMember(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Team Members</h1>

        <button
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          onClick={() => setOpen(true)}
        >
          <Plus size={14} />
          Add Member
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr>
              {[
                "Name",
                "Role",
                "Email",
                "Department",
                "Joining Date",
                "Current Project",
                "Status",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {user.name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{user.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {user.role}
                  </span>
                </td>

                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatJoiningDate(user.joiningDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.currentProject}</td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : user.status === "On Leave"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingMember(user)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                  >
                    <PenLine size={13} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Add Team Member" open={open} onClose={() => setOpen(false)} size="lg">
        <AddTeamMemberForm
          onSave={handleAddMember}
          onClose={() => setOpen(false)}
        />
      </Modal>

      <Modal title="Edit Team Member" open={!!editingMember} onClose={() => setEditingMember(null)} size="lg">
        {editingMember && (
          <AddTeamMemberForm
            mode="edit"
            initialData={memberToFormData(editingMember)}
            onSave={handleEditMember}
            onClose={() => setEditingMember(null)}
          />
        )}
      </Modal>
    </div>
  );
}
