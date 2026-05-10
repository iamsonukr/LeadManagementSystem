'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  PenLine,
  Plus,
  Search,
  Trash2,
  Filter,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCcw,
  ListTodo,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import AddFollowUpForm, { FollowUpFormData } from '@/components/followups/AddFollowUpForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { exportRowsToCsv } from '@/lib/export';
import { formatDate } from '@/lib/utils';
import { addFollowUp, deleteFollowUp, fetchFollowUps, updateFollowUp } from '@/store/slices/followUpsSlice';
import { fetchLeads } from '@/store/slices/leadsSlice';
import { fetchTeamMembers } from '@/store/slices/teamMembersSlice';
import { FollowUpRecord } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── types ───────────────────────────────────────────────────────────────────

type StatusTab = 'All' | 'Pending' | 'Overdue' | 'Completed' | 'Rescheduled';
type SortField = 'dueAt' | 'leadName' | 'priority' | 'owner';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

// ─── sub-components ──────────────────────────────────────────────────────────

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

const STATUS_TABS: { key: StatusTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'All', label: 'All', icon: <ListTodo size={14} />, color: 'text-gray-600' },
  { key: 'Pending', label: 'Pending', icon: <Clock size={14} />, color: 'text-amber-600' },
  { key: 'Overdue', label: 'Overdue', icon: <AlertTriangle size={14} />, color: 'text-red-600' },
  { key: 'Rescheduled', label: 'Rescheduled', icon: <RefreshCcw size={14} />, color: 'text-blue-600' },
  { key: 'Completed', label: 'Completed', icon: <CheckCircle2 size={14} />, color: 'text-green-600' },
];

// ─── main page ───────────────────────────────────────────────────────────────

export default function FollowUpsPage() {
  const dispatch = useAppDispatch();
  const followUps = useAppSelector((state) => state.followUps.items);
  const leads = useAppSelector((state) => state.leads.leads);
  const teamMemberNames = useAppSelector((state) =>
    state.teamMembers.items.filter((m) => m.status === 'Active').map((m) => m.fullName),
  );

  // ── filter state ──
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('All');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDueDate, setFilterDueDate] = useState<'today' | 'week' | 'overdue' | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('dueAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── modal state ──
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUpRecord | null>(null);

  useEffect(() => {
    dispatch(fetchFollowUps({ limit: 100 }));
    dispatch(fetchLeads({ limit: 100 }));
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  // ── derived filter options ──
  const ownerOptions = useMemo(() => [...new Set(followUps.map((f) => f.owner))].sort(), [followUps]);
  const typeOptions = useMemo(() => [...new Set(followUps.map((f) => f.type))].sort(), [followUps]);
  const priorityOptions = ['High', 'Medium', 'Low'];

  // ── counts per tab ──
  const tabCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = { All: 0, Pending: 0, Overdue: 0, Completed: 0, Rescheduled: 0 };
    followUps.forEach((f) => {
      counts.All++;
      if (f.status in counts) counts[f.status as StatusTab]++;
    });
    return counts;
  }, [followUps]);

  // ── filtered + sorted list ──
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return followUps
      .filter((item) => {
        // tab
        if (activeTab !== 'All' && item.status !== activeTab) return false;

        // search
        const q = searchVal.toLowerCase();
        if (q && ![item.leadName, item.company, item.nextAction, item.owner].some((s) => s.toLowerCase().includes(q)))
          return false;

        // dropdown filters
        if (filterOwner && item.owner !== filterOwner) return false;
        if (filterType && item.type !== filterType) return false;
        if (filterPriority && item.priority !== filterPriority) return false;

        // due date quick filter
        const due = new Date(item.dueAt);
        if (filterDueDate === 'today' && due.toDateString() !== todayStr) return false;
        if (filterDueDate === 'week' && (due < now || due > weekEnd)) return false;
        if (filterDueDate === 'overdue' && due >= now) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'dueAt') cmp = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        else if (sortField === 'leadName') cmp = a.leadName.localeCompare(b.leadName);
        else if (sortField === 'owner') cmp = a.owner.localeCompare(b.owner);
        else if (sortField === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [followUps, activeTab, searchVal, filterOwner, filterType, filterPriority, filterDueDate, sortField, sortDir]);

  // ── active filter count for badge ──
  const activeFilterCount = [filterOwner, filterType, filterPriority, filterDueDate].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterOwner('');
    setFilterType('');
    setFilterPriority('');
    setFilterDueDate('');
    setSearchVal('');
  };

  // ── stat cards ──
  const today = followUps.filter((f) => new Date(f.dueAt).toDateString() === new Date().toDateString()).length;

  // ── sort toggle ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };
  const SortIndicator = ({ field }: { field: SortField }) =>
    sortField === field ? (
      <span className="ml-1 text-indigo-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-gray-300">↕</span>
    );

  // ── export ──
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
      ]),
    );
  };

  // ── CRUD ──
  const handleAddFollowUp = (data: FollowUpFormData) => {
    dispatch(addFollowUp(toFollowUpPayload(data)));
    setIsAddOpen(false);
  };
  const handleUpdateFollowUp = (data: FollowUpFormData) => {
    if (!editingFollowUp) return;
    dispatch(updateFollowUp(toFollowUpPayload(data, editingFollowUp)));
    setEditingFollowUp(null);
  };
  const handleDeleteFollowUp = () => {
    if (!deletingFollowUp) return;
    dispatch(deleteFollowUp(deletingFollowUp.id));
    setDeletingFollowUp(null);
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track and manage all scheduled follow-up activities across leads.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportFollowUps}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={14} /> Add Follow-Up
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { label: 'Total', value: tabCounts.All, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'Overdue', value: tabCounts.Overdue, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Due Today', value: today, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Completed', value: tabCounts.Completed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        ] as const).map(({ label, value, color, bg, border }) => (
          <div key={label} className={`flex items-center justify-between rounded-xl border ${border} ${bg} px-5 py-4`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
        {STATUS_TABS.map(({ key, label, icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={activeTab === key ? color : ''}>{icon}</span>
            {label}
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {tabCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm min-w-[200px]">
          <Search size={14} className="shrink-0 text-gray-400" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search lead, company, owner, next action…"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          {searchVal && (
            <button onClick={() => setSearchVal('')} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Due date quick filters */}
        <div className="flex gap-1">
          {([['today', 'Today'], ['week', 'This Week'], ['overdue', 'Overdue']] as const).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilterDueDate(filterDueDate === val ? '' : val)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-sm transition-colors ${
                filterDueDate === val
                  ? 'border-indigo-300 bg-indigo-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={11} />
              {lbl}
            </button>
          ))}
        </div>

        {/* Clear all */}
        {(activeFilterCount > 0 || searchVal) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* ── Expandable Filter Panel ── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Filter size={12} /> Filters
          </span>
          <SelectFilter label="Owner" value={filterOwner} options={ownerOptions} onChange={setFilterOwner} />
          <SelectFilter label="Type" value={filterType} options={typeOptions} onChange={setFilterType} />
          <SelectFilter label="Priority" value={filterPriority} options={priorityOptions} onChange={setFilterPriority} />
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        {/* result count */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <span className="text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{filtered.length}</span> follow-up{filtered.length !== 1 ? 's' : ''}
            {activeTab !== 'All' && (
              <span className="ml-1 text-gray-400">· {activeTab}</span>
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed">
            <colgroup>
              <col className="w-36" />
              <col className="w-32" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-22" />
              <col className="w-36" />
              <col className="w-52" />
              <col className="w-52" />
              <col className="w-20" />
            </colgroup>
            <thead className="bg-gray-50/80">
              <tr>
                {(
                  [
                    ['Lead', 'leadName'],
                    ['Company', null],
                    ['Owner', 'owner'],
                    ['Type', null],
                    ['Status', null],
                    ['Priority', 'priority'],
                    ['Due At', 'dueAt'],
                    ['Next Action', null],
                    ['Notes', null],
                    ['Actions', null],
                  ] as [string, SortField | null][]
                ).map(([header, field]) => (
                  <th
                    key={header}
                    onClick={field ? () => toggleSort(field) : undefined}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                      field ? 'cursor-pointer select-none hover:text-gray-700' : ''
                    }`}
                  >
                    {header}
                    {field && <SortIndicator field={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const isOverdue = item.status === 'Overdue';
                const isCompleted = item.status === 'Completed';
                return (
                  <tr
                    key={item.id}
                    className={`group transition-colors hover:bg-indigo-50/30 ${isOverdue ? 'bg-red-50/30' : ''} ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/leads/${item.leadId}`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {item.leadName}
                      </Link>
                    </td>
                    <td className="truncate px-4 py-3.5 text-sm text-gray-600">{item.company}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{item.owner}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm ${isOverdue ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                        {new Date(item.dueAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="ml-1.5 text-xs text-gray-400">
                        {new Date(item.dueAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">
                      <p className="truncate">{item.nextAction}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      <p className="truncate">{item.notes}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditingFollowUp(item)}
                          title="Edit"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        >
                          <PenLine size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingFollowUp(item)}
                          title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ListTodo size={28} className="opacity-40" />
                      <p className="text-sm font-medium">No follow-ups found</p>
                      <p className="text-xs">Try adjusting your filters or search query.</p>
                      {(activeFilterCount > 0 || searchVal) && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="" subtitle="" size="lg">
        <AddFollowUpForm
          onSave={handleAddFollowUp}
          onClose={() => setIsAddOpen(false)}
          initialData={initialAddData}
          teamMembers={teamMemberNames}
        />
      </Modal>

      <Modal open={!!editingFollowUp} onClose={() => setEditingFollowUp(null)} title="" subtitle="" size="lg">
        {editingFollowUp && (
          <AddFollowUpForm
            mode="edit"
            initialData={followUpToFormData(editingFollowUp)}
            onSave={handleUpdateFollowUp}
            onClose={() => setEditingFollowUp(null)}
            teamMembers={teamMemberNames}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingFollowUp}
        title="Delete Follow-Up"
        description={`Delete this follow-up for ${deletingFollowUp?.leadName ?? 'this lead'}?`}
        onConfirm={handleDeleteFollowUp}
        onClose={() => setDeletingFollowUp(null)}
      />
    </div>
  );
}