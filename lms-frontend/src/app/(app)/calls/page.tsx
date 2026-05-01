'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Download, Phone, Plus, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import LogCallForm, { CallFormData } from '@/components/calls/LogCallForm';
import { StatusBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { exportRowsToCsv } from '@/lib/export';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { addCall, deleteCall, fetchCalls, updateCall } from '@/store/slices/callsSlice';
import { CallLog } from '@/types';

function toCallPayload(data: CallFormData, existing?: CallLog): CallLog {
  const createdAt = data.callDate ? new Date(data.callDate).toISOString() : existing?.createdAt ?? new Date().toISOString();

  return {
    id: existing?.id ?? `c${Date.now()}`,
    leadId: data.leadId,
    leadName: data.leadName,
    leadCompany: data.leadCompany,
    status: data.status,
    direction: data.direction,
    duration: data.duration,
    calledBy: data.calledBy,
    callDate: data.callDate ? new Date(data.callDate).toISOString() : undefined,
    discussionPoints: data.discussionPoints,
    nextAction: data.nextAction,
    followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
    callbackDate: data.callbackDate ? new Date(`${data.callbackDate}T00:00:00`).toISOString() : undefined,
    notes: data.notes,
    createdAt,
  };
}

function callToFormData(call: CallLog): CallFormData {
  return {
    leadId: call.leadId,
    leadName: call.leadName,
    leadCompany: call.leadCompany || '',
    status: call.status,
    direction: call.direction,
    duration: call.duration,
    calledBy: call.calledBy,
    callDate: call.callDate ? new Date(call.callDate).toISOString().slice(0, 16) : new Date(call.createdAt).toISOString().slice(0, 16),
    discussionPoints: call.discussionPoints || '',
    nextAction: call.nextAction || '',
    followUpDate: call.followUpDate ? new Date(call.followUpDate).toISOString().slice(0, 16) : '',
    callbackDate: call.callbackDate ? new Date(call.callbackDate).toISOString().slice(0, 10) : '',
    notes: call.notes,
  };
}

export default function CallsPage() {
  const dispatch = useAppDispatch();
  const calls = useAppSelector((state) => state.calls.calls);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    dispatch(fetchCalls({ limit: 100 }));
  }, [dispatch]);

  const filteredCalls = useMemo(() => calls.filter((call) => {
    const q = searchVal.toLowerCase();
    return !q
      || call.leadName.toLowerCase().includes(q)
      || (call.leadCompany || '').toLowerCase().includes(q)
      || call.calledBy.toLowerCase().includes(q)
      || call.nextAction.toLowerCase().includes(q);
  }), [calls, searchVal]);

  const exportCalls = () => {
    exportRowsToCsv(
      'call-logs.csv',
      ['Lead', 'Company', 'Status', 'Direction', 'Duration', 'Called By', 'Call Time', 'Discussion', 'Next Action', 'Follow Up', 'Notes'],
      filteredCalls.map((call) => [
        call.leadName,
        call.leadCompany || '',
        call.status,
        call.direction,
        call.duration,
        call.calledBy,
        call.callDate ? new Date(call.callDate).toLocaleString() : formatDate(call.createdAt),
        call.discussionPoints,
        call.nextAction,
        call.followUpDate ? new Date(call.followUpDate).toLocaleString() : '',
        call.notes,
      ])
    );
  };

  const handleSaveCall = (data: CallFormData) => {
    dispatch(addCall(toCallPayload(data)));
    setIsAddOpen(false);
  };

  const handleEditCall = (call: CallLog) => {
    setSelectedCall(call);
    setIsEditOpen(true);
  };

  const handleUpdateCall = (data: CallFormData) => {
    if (!selectedCall) return;
    dispatch(updateCall(toCallPayload(data, selectedCall)));
    setIsEditOpen(false);
    setSelectedCall(null);
  };

  const handleDeleteCall = (callId: string) => {
    dispatch(deleteCall(callId));
  };

  const stats = [
    { label: 'Total Calls', value: calls.length, icon: Phone, color: 'text-indigo-500 bg-indigo-50' },
    { label: 'Connected', value: calls.filter((call) => call.status === 'Connected').length, icon: Phone, color: 'text-green-500 bg-green-50' },
    { label: 'Callbacks Due', value: calls.filter((call) => call.status === 'Callback Scheduled').length, icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
    { label: 'Next Actions Open', value: calls.filter((call) => !!call.nextAction).length, icon: Clock, color: 'text-blue-500 bg-blue-50' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Capture when the call happened, what was discussed, and what the team promised to do next.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCalls}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={14} /> Log Call
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Search size={14} className="text-gray-400" />
        <input
          value={searchVal}
          onChange={(event) => setSearchVal(event.target.value)}
          placeholder="Search by lead, company, caller, or next action"
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr>
              {['Lead', 'Status', 'Direction', 'Duration', 'Called By', 'Discussion', 'Next Action', 'Follow Up', 'Logged', 'Actions'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCalls.map((call) => (
              <tr key={call.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">{call.leadName}</div>
                  <div className="text-xs text-gray-400">{call.leadCompany || 'No company'}</div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={call.status} /></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${call.direction === 'Outgoing' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {call.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{call.duration > 0 ? `${call.duration} min` : '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{call.calledBy}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-gray-500">{call.discussionPoints || '-'}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-gray-500">{call.nextAction || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {call.followUpDate ? new Date(call.followUpDate).toLocaleString() : call.callbackDate ? formatDate(call.callbackDate) : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  <div>{call.callDate ? new Date(call.callDate).toLocaleString() : formatDate(call.createdAt)}</div>
                  <div>{formatRelativeTime(call.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      onClick={() => handleEditCall(call)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteCall(call.id)}
                    >
                      Delete
                    </button>
                    {call.leadId && <Link href={`/leads/${call.leadId}`} className="text-sm font-medium text-gray-600 hover:text-gray-800">Lead</Link>}
                  </div>
                </td>
              </tr>
            ))}
            {filteredCalls.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                  No call logs matched the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Call" subtitle="Add a new call log" size="lg">
        <LogCallForm onSave={handleSaveCall} />
      </Modal>
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Call" subtitle="Update call information" size="lg">
        <LogCallForm
          onSave={handleUpdateCall}
          initialData={selectedCall ? callToFormData(selectedCall) : undefined}
          mode="edit"
        />
      </Modal>
    </div>
  );
}
