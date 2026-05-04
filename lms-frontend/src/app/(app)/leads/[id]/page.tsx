'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, Phone, Plus, Star, Trash2 } from 'lucide-react';
import LogCallForm, { CallFormData } from '@/components/calls/LogCallForm';
import Modal from '@/components/ui/Modal';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { formatCurrency, formatDate } from '@/lib/utils';
import { addCall } from '@/store/slices/callsSlice';
import { updateLead } from '@/store/slices/leadsSlice';
import { fetchTeamMembers } from '@/store/slices/teamMembersSlice';
import { CallLog } from '@/types';

export default function LeadDetailPage() {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const lead = useAppSelector((state) => state.leads.leads.find((item) => item.id === id));
  const calls = useAppSelector((state) => state.calls.calls.filter((call) => call.leadId === id));
  const teamMemberNames = useAppSelector((state) =>
    state.teamMembers.items.filter((member) => member.status === 'Active').map((member) => member.fullName),
  );
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  if (!lead) {
    return (
      <div className="p-6">
        <Link href="/leads" className="mb-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
          <ArrowLeft size={14} /> Back to Leads
        </Link>
        <div className="rounded-xl bg-white p-10 text-center text-gray-400">Lead not found.</div>
      </div>
    );
  }

  const handleSaveCall = (data: CallFormData) => {
    const now = data.callDate ? new Date(data.callDate).toISOString() : new Date().toISOString();
    const newCall: CallLog = {
      id: `c${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      leadCompany: lead.company,
      status: data.status,
      direction: data.direction,
      duration: data.duration,
      calledBy: data.calledBy,
      callDate: data.callDate ? new Date(data.callDate).toISOString() : now,
      discussionPoints: data.discussionPoints,
      nextAction: data.nextAction,
      followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
      callbackDate: data.callbackDate ? new Date(`${data.callbackDate}T00:00:00`).toISOString() : undefined,
      notes: data.notes,
      createdAt: now,
    };

    dispatch(addCall(newCall));
    dispatch(updateLead({
      ...lead,
      callCount: lead.callCount + 1,
      lastCallDate: now,
      lastContactedAt: now,
      lastActivityAt: now,
      nextAction: data.nextAction || lead.nextAction,
      nextFollowUp: data.followUpDate ? new Date(data.followUpDate).toISOString() : lead.nextFollowUp,
      updatedAt: now,
    }));
    setIsLogCallOpen(false);
  };

  const initialCallForm: Partial<CallFormData> = {
    leadId: lead.id,
    leadName: lead.name,
    leadCompany: lead.company,
    calledBy: lead.assignedTo,
    callDate: new Date().toISOString().slice(0, 16),
    followUpDate: lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0, 16) : '',
    nextAction: lead.nextAction || '',
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Link href="/leads" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
          <ArrowLeft size={14} /> Back to Leads
        </Link>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            <Edit size={13} /> Edit
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white">
                  {lead.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
                  <p className="text-sm text-gray-500">{lead.company}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={lead.status} />
                    <PriorityBadge priority={lead.priority} />
                    <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-600">
                      <Star size={11} className="fill-yellow-500" /> {lead.aiScore}/10
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLogCallOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                >
                  <Phone size={12} /> Log Call
                </button>
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                >
                  <Mail size={12} /> Send Email
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-800">Lead Details</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Email', lead.email],
                ['Phone', lead.phone],
                ['Source', lead.source],
                ['Industry', lead.industry || '-'],
                ['Company Size', lead.companySize || '-'],
                ['Budget', lead.budget ? formatCurrency(lead.budget, lead.currency) : '-'],
                ['Assigned To', lead.assignedTo || '-'],
                ['Department', lead.department || '-'],
                ['Tags', lead.tags.join(', ') || '-'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-0.5 text-xs text-gray-400">{label}</div>
                  <div className="text-sm font-medium text-gray-700">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Call History ({calls.length})</h3>
              <button
                onClick={() => setIsLogCallOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
              >
                <Plus size={12} /> Log Call
              </button>
            </div>
            {calls.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No calls logged yet. Use the `Log Call` button to add one.</p>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <div key={call.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${call.status === 'Connected' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Phone size={14} className={call.status === 'Connected' ? 'text-green-600' : 'text-red-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{call.status}</span>
                        <span className="text-xs text-gray-400">{formatDate(call.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{call.notes}</p>
                      {call.discussionPoints && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">Discussed: {call.discussionPoints}</p>
                      )}
                      {call.nextAction && (
                        <p className="mt-1 line-clamp-2 text-xs text-indigo-600">Next action: {call.nextAction}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] text-gray-400">{call.direction} · {call.duration} min · {call.calledBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Address</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {lead.address.line1}<br />
              {lead.address.city}, {lead.address.state} {lead.address.postalCode}<br />
              {lead.address.country}
            </p>
          </div>

          {lead.notes && (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Notes</h3>
              <p className="text-sm text-gray-600">{lead.notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Quick Stats</h3>
            <div className="space-y-2">
              {[
                ['Total Calls', lead.callCount],
                ['Created', formatDate(lead.createdAt)],
                ['Last Updated', formatDate(lead.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={isLogCallOpen} onClose={() => setIsLogCallOpen(false)} title="" subtitle="" size="lg">
        <LogCallForm onSave={handleSaveCall} initialData={initialCallForm} teamMembers={teamMemberNames} />
      </Modal>
    </div>
  );
}
