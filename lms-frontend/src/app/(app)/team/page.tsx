"use client";

import { useEffect, useState } from "react";
import AddTeamMemberForm, { TeamFormData } from "@/components/team/AddTeamMember";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  addTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  updateTeamMember,
} from "@/store/slices/teamMembersSlice";
import { TeamMemberRecord } from "@/types";
import { PenLine, Plus, Trash2 } from "lucide-react";

function formatJoiningDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function memberToFormData(member: TeamMemberRecord): TeamFormData {
  return {
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    department: member.department,
    joiningDate: member.joiningDate,
    currentProject: member.currentProject,
    status: member.status,
  };
}

function formToMemberPayload(data: TeamFormData): Omit<TeamMemberRecord, "id" | "createdAt" | "updatedAt"> {
  return {
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    department: data.department,
    joiningDate: data.joiningDate,
    currentProject: data.currentProject,
    status: data.status as TeamMemberRecord["status"],
  };
}

export default function TeamPage() {
  const dispatch = useAppDispatch();
  const { items: members, isLoading, isSubmitting, error } = useAppSelector((state) => state.teamMembers);
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberRecord | null>(null);

  useEffect(() => {
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  const handleAddMember = (data: TeamFormData) => {
    dispatch(addTeamMember(formToMemberPayload(data)));
    setOpen(false);
  };

  const handleEditMember = (data: TeamFormData) => {
    if (!editingMember) return;

    dispatch(updateTeamMember({
      ...editingMember,
      ...formToMemberPayload(data),
    }));
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Delete this team member?")) {
      dispatch(deleteTeamMember(id));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
          onClick={() => setOpen(true)}
          disabled={isSubmitting}
        >
          <Plus size={14} />
          Add Member
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
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
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {member.fullName[0] || "T"}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{member.fullName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {member.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatJoiningDate(member.joiningDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.currentProject}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.status === "Active"
                          ? "bg-green-50 text-green-700"
                          : member.status === "On Leave"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                      >
                        <PenLine size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        aria-label={`Delete ${member.fullName}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && members.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    No team members found.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading team members...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
