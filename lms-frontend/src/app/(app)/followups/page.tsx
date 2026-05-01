'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, PenLine, Plus, Search, Trash2 } from 'lucide-react';
import AddFollowUpForm, { FollowUpFormData } from '@/components/followups/AddFollowUpForm';
import Modal from '@/components/ui/Modal';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { exportRowsToCsv } from '@/lib/export';
import { formatDate } from '@/lib/utils';
import { addFollowUp, deleteFollowUp, fetchFollowUps, updateFollowUp } from '@/store/slices/followUpsSlice';
import { fetchLeads } from '@/store/slices/leadsSlice';
import { FollowUpRecord } from '@/types';

function followUpToFormData(item: FollowUpRecord): FollowUpFormData {
  return {
    leadId: item.leadId,
    leadName: item.leadName,
    company: item.company,
    owner: item.owner,
    type: item.type,
    status: item.status,
    priority: item.priority,
    dueAt: new Date(item.dueAt).toISOString().slice(0, 16),
    notes: item.notes,
    nextAction: item.nextAction,
  };
}

function toFollowUpPayload(data: FollowUpFormData, existing?: FollowUpRecord): FollowUpRecord {
  const now = new Date().toISOString();
  const normalizedDueAt = data.dueAt ? new Date(data.dueAt).toISOString() : now;
  const computedStatus =
    data.status === 'Completed'
      ? 'Completed'
      : data.status === 'Rescheduled'
        ? 'Rescheduled'
        : new Date(normalizedDueAt) < new Date()
          ? 'Overdue'
          : 'Pending';

  return {
    id: existing?.id ?? `f${Date.now()}`,
    leadId: data.leadId,
    leadName: data.leadName,
    company: data.company,
    owner: data.owner,
    type: data.type,
    status: computedStatus,
    priority: data.priority,
    dueAt: normalizedDueAt,
    completedAt: computedStatus === 'Completed' ? (existing?.completedAt ?? now) : undefined,
    notes: data.notes,
    nextAction: data.nextAction,
    createdAt: existing?.createdAt ?? now,
  };
}

export default function FollowUpsPage() {
  const dispatch = useAppDispatch();
  const followUps = useAppSelector((state) => state.followUps.items);
  const leads = useAppSelector((state) => state.leads.leads);
  const [searchVal, setSearchVal] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);

  useEffect(() => {
    dispatch(fetchFollowUps({ limit: 100 }));
    dispatch(fetchLeads({ limit: 100 }));
  }, [dispatch]);

  const filtered = useMemo(() => followUps
    .filter((item) => {
      const q = searchVal.toLowerCase();
      return !q
        || item.leadName.toLowerCase().includes(q)
        || item.company.toLowerCase().includes(q)
        || item.nextAction.toLowerCase().includes(q)
        || item.owner.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()), [followUps, searchVal]);

  const total = filtered.length;
  const overdue = filtered.filter((item) => item.status === 'Overdue').length;
  const today = filtered.filter((item) => new Date(item.dueAt).toDateString() === new Date().toDateString()).length;
  const completed = filtered.filter((item) => item.status === 'Completed').length;

  const exportFollowUps = () => {
    exportRowsToCsv(
      'follow-up-records.csv',
      ['Lead', 'Company', 'Owner', 'Type', 'Status', 'Priority', 'Due At', 'Next Action', 'Notes'],
      filtered.map((item) => [
        item.leadName,
        item.company,
        item.owner,
        item.type,
        item.status,
        item.priority,
        new Date(item.dueAt).toLocaleString(),
        item.nextAction,
        item.notes,
      ])
    );
  };

  const handleAddFollowUp = (data: FollowUpFormData) => {
    dispatch(addFollowUp(toFollowUpPayload(data)));
    setIsAddOpen(false);
  };

  const handleUpdateFollowUp = (data: FollowUpFormData) => {
    if (!editingFollowUp) return;
    dispatch(updateFollowUp(toFollowUpPayload(data, editingFollowUp)));
    setEditingFollowUp(null);
  };

  const defaultLead = leads[0];
  const initialAddData: Partial<FollowUpFormData> | undefined = defaultLead
    ? {
        leadId: defaultLead.id,
        leadName: defaultLead.name,
        company: defaultLead.company,
        owner: defaultLead.assignedTo,
        nextAction: defaultLead.nextAction || '',
      }
    : undefined;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="mt-1 text-sm text-gray-500">
            This is now a dedicated activity table, so one lead can have multiple scheduled follow-ups over time.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportFollowUps} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={14} /> Add Follow Up
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total Follow Ups', total, 'text-gray-900'],
          ['Overdue', overdue, 'text-red-600'],
          ['Due Today', today, 'text-amber-600'],
          ['Completed', completed, 'text-green-600'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
            <div className={`mt-2 text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Search size={14} className="text-gray-400" />
        <input
          value={searchVal}
          onChange={(event) => setSearchVal(event.target.value)}
          placeholder="Search by lead, company, owner, or next action"
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-gray-50">
              <tr>
                {['Lead', 'Company', 'Owner', 'Type', 'Status', 'Priority', 'Due At', 'Next Action', 'Notes', 'Actions'].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-indigo-50/30">
                  <td className="px-4 py-4">
                    <Link href={`/leads/${item.leadId}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                      {item.leadName}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.company}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.owner}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4"><PriorityBadge priority={item.priority} /></td>
                  <td className="px-4 py-4 text-sm text-gray-700">{new Date(item.dueAt).toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.nextAction}</td>
                  <td className="max-w-xs px-4 py-4 text-sm text-gray-600">{item.notes}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingFollowUp(item)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                        <PenLine size={14} />
                      </button>
                      <button onClick={() => dispatch(deleteFollowUp(item.id))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    No follow-ups matched the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="" subtitle="" size="lg">
        <AddFollowUpForm onSave={handleAddFollowUp} onClose={() => setIsAddOpen(false)} initialData={initialAddData} />
      </Modal>

      <Modal open={!!editingFollowUp} onClose={() => setEditingFollowUp(null)} title="" subtitle="" size="lg">
        {editingFollowUp && (
          <AddFollowUpForm
            mode="edit"
            initialData={followUpToFormData(editingFollowUp)}
            onSave={handleUpdateFollowUp}
            onClose={() => setEditingFollowUp(null)}
          />
        )}
      </Modal>
    </div>
  );
}
