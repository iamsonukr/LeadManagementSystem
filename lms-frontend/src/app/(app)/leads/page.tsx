'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Mail, PenLine, Phone, Plus, Search, Trash2 } from 'lucide-react';
import AddLeadForm, { LeadAssigneeOption, LeadFormData } from '@/components/leads/AddLeadForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useAuth } from '@/context/AuthContext';
import { leadSourceOptions, leadStatusOptions, normalizeServices } from '@/lib/crm';
import { exportRowsToCsv } from '@/lib/export';
import { canManageLeads, isAdmin } from '@/lib/rbac';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { addLead, deleteLeadThunk, fetchLeads, setFilter, updateLead, updateLeadStatus } from '@/store/slices/leadsSlice';
import { setAddLeadModal } from '@/store/slices/uiSlice';
import { usersService } from '@/services';
import { Lead, LeadStatus, UserRecord } from '@/types';

const mongoIdPattern = /^[a-f\d]{24}$/i;

const optionalMongoId = (value: string) => {
  const normalized = String(value || '').trim();
  return mongoIdPattern.test(normalized) ? normalized : undefined;
};

function toLeadPayload(data: LeadFormData, existing?: Lead): Partial<Lead> & { id: string } {
  const followUpDate = String(data.followUpDate || '');
  const followUpTime = String(data.followUpTime || '');
  const expectedCloseDate = String(data.expectedCloseDate || '');
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? Date.now().toString(),
    name: String(data.fullName || ''),
    email: String(data.email || ''),
    phone: String(data.phoneNumber || ''),
    company: String(data.company || ''),
    status: (data.leadStatus as LeadStatus) || 'New',
    source: (data.leadSource as Lead['source']) || 'Other',
    priority: (data.priority as Lead['priority']) || 'Medium',
    services: normalizeServices(String(data.services || '')),
    assignedTo: optionalMongoId(data.assignedTo),
    department: optionalMongoId(data.department),
    leadValue: Number(data.leadValue) || Number(data.budget) || 0,
    stageProbability: existing?.stageProbability ?? 30,
    expectedCloseDate: expectedCloseDate ? new Date(`${expectedCloseDate}T00:00:00`).toISOString() : existing?.expectedCloseDate,
    lastActivityAt: now,
    lastContactedAt: existing?.lastContactedAt,
    nextAction: String(data.nextAction || ''),
    location: [data.city, data.country].filter(Boolean).join(', '),
    industry: String(data.industry || ''),
    companySize: String(data.companySize || ''),
    budget: Number(data.budget) || 0,
    currency: String(data.currency || 'USD'),
    address: {
      line1: String(data.address1 || ''),
      line2: String(data.address2 || '') || undefined,
      city: String(data.city || ''),
      state: String(data.state || ''),
      postalCode: String(data.postal || ''),
      country: String(data.country || ''),
    },
    tags: String(data.tags || '').split(',').map((item) => item.trim()).filter(Boolean),
    aiScore: existing?.aiScore ?? Math.floor(Math.random() * 3) + 7,
    callCount: existing?.callCount ?? 0,
    lastCallDate: existing?.lastCallDate,
    nextFollowUp: followUpDate ? new Date(`${followUpDate}T${followUpTime || '00:00'}`).toISOString() : undefined,
    notes: String(data.notes || ''),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function leadToFormData(lead: Lead): LeadFormData {
  const followUp = lead.nextFollowUp ? new Date(lead.nextFollowUp) : null;
  const expectedClose = lead.expectedCloseDate ? new Date(lead.expectedCloseDate) : null;
  return {
    fullName: lead.name,
    phoneNumber: lead.phone,
    email: lead.email,
    company: lead.company,
    leadSource: lead.source,
    leadStatus: lead.status,
    priority: lead.priority,
    leadType: '',
    contactMethod: '',
    bestTime: '',
    doNotContact: false,
    emailOptIn: true,
    address1: lead.address.line1,
    address2: lead.address.line2 || '',
    city: lead.address.city,
    state: lead.address.state,
    postal: lead.address.postalCode,
    country: lead.address.country,
    industry: lead.industry,
    companySize: lead.companySize,
    budget: lead.budget ? String(lead.budget) : '',
    currency: lead.currency,
    leadValue: lead.leadValue ? String(lead.leadValue) : '',
    notes: lead.notes || '',
    followUpDate: followUp ? followUp.toISOString().slice(0, 10) : '',
    followUpTime: followUp ? followUp.toISOString().slice(11, 16) : '',
    assignedTo: lead.assignedTo,
    department: lead.department,
    expectedCloseDate: expectedClose ? expectedClose.toISOString().slice(0, 10) : '',
    services: lead.services.join(', '),
    nextAction: lead.nextAction || '',
    reminder: '',
    tags: lead.tags.join(', '),
    additionalInfo: '',
  };
}

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { leads, filters, error, isSubmitting } = useAppSelector((state) => state.leads);
  const addLeadOpen = useAppSelector((state) => state.ui.addLeadModalOpen);
  const [searchVal, setSearchVal] = useState('');
  const [assignableUsers, setAssignableUsers] = useState<UserRecord[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const canAssignLead = canManageLeads(user);
  const canDeleteLead = isAdmin(user);
  const currentUserId = user?.id;
  const currentUserName = user?.name;
  const assigneeOptions: LeadAssigneeOption[] = useMemo(
    () =>
      canAssignLead
        ? assignableUsers.map((member) => ({ id: member.id, name: member.name }))
        : currentUserId && currentUserName
          ? [{ id: currentUserId, name: currentUserName }]
          : [],
    [assignableUsers, canAssignLead, currentUserId, currentUserName],
  );
  const assigneeNameById = useMemo(
    () => new Map(assigneeOptions.map((member) => [member.id, member.name])),
    [assigneeOptions],
  );

  useEffect(() => {
    dispatch(fetchLeads({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (!canAssignLead) {
      return;
    }
    usersService
      .getAll()
      .then((users) =>
        setAssignableUsers(
          users
            .filter((item) => item.status === 'Active')
        ),
      )
      .catch(() => setAssignableUsers([]));
  }, [canAssignLead]);

  const filtered = useMemo(() => leads.filter((lead) => {
    const q = searchVal.toLowerCase();
    const matchesSearch =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.services.join(' ').toLowerCase().includes(q);

    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesSource = !filters.source || lead.source === filters.source;
    const matchesPriority = !filters.priority || lead.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesSource && matchesPriority;
  }), [filters.priority, filters.source, filters.status, leads, searchVal]);

  const exportLeads = () => {
    exportRowsToCsv(
      'leads-pipeline.csv',
      ['Lead', 'Company', 'Services', 'Status', 'Lead Value', 'Source', 'Priority', 'Owner', 'Next Follow Up', 'Expected Close', 'Next Action'],
      filtered.map((lead) => [
        lead.name,
        lead.company,
        lead.services.join(', '),
        lead.status,
        lead.leadValue,
        lead.source,
        lead.priority,
        lead.assignedTo,
        lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '',
        lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : '',
        lead.nextAction || '',
      ])
    );
  };

  const handleSaveLead = async (data: LeadFormData) => {
    await dispatch(addLead(toLeadPayload(data))).unwrap();
    dispatch(setAddLeadModal(false));
  };

  const handleUpdateLead = async (data: LeadFormData) => {
    if (!editingLead) return;
    await dispatch(updateLead(toLeadPayload(data, editingLead))).unwrap();
    setEditingLead(null);
  };

  const handleDeleteLead = () => {
    if (!deletingLead) return;
    dispatch(deleteLeadThunk(deletingLead.id));
    setDeletingLead(null);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Lead Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            Standard CRM coverage means every lead has an owner, pipeline stage, value, next action, and target close date.
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={exportLeads}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Export CSV
          </button>
          {canAssignLead && (
            <button
              onClick={() => dispatch(setAddLeadModal(true))}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={14} /> Add Lead
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Open Pipeline</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{filtered.length}</div>
          <div className="mt-1 text-xs text-gray-500">Active leads in qualification and conversion flow</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pipeline Value</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(filtered.reduce((sum, lead) => sum + lead.leadValue, 0))}
          </div>
          <div className="mt-1 text-xs text-gray-500">Estimated total deal value</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">High Priority</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{filtered.filter((lead) => lead.priority === 'High').length}</div>
          <div className="mt-1 text-xs text-gray-500">Leads needing close attention</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Needs Scheduling</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{filtered.filter((lead) => !lead.nextFollowUp).length}</div>
          <div className="mt-1 text-xs text-gray-500">Records missing the next follow-up</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 md:min-w-72">
          <Search size={14} className="text-gray-400" />
          <input
            value={searchVal}
            onChange={(event) => setSearchVal(event.target.value)}
            placeholder="Search by lead, company, email, or service"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none sm:w-auto"
          value={filters.status}
          onChange={(event) => dispatch(setFilter({ status: event.target.value }))}
        >
          <option value="">All Statuses</option>
          {leadStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none sm:w-auto"
          value={filters.source}
          onChange={(event) => dispatch(setFilter({ source: event.target.value }))}
        >
          <option value="">All Sources</option>
          {leadSourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none sm:w-auto"
          value={filters.priority}
          onChange={(event) => dispatch(setFilter({ priority: event.target.value }))}
        >
          <option value="">All Priorities</option>
          {['High', 'Medium', 'Low'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                {['Lead', 'Company', 'Services', 'Stage', 'Lead Value', 'Source', 'Priority', 'Owner', 'Next Follow Up', 'Expected Close', 'Next Action', 'Actions'].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-t border-gray-100 align-top hover:bg-indigo-50/30">
                  <td className="px-4 py-4">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                        {lead.name}
                      </Link>
                      <div className="mt-1 text-xs text-gray-400">{lead.email || lead.phone}</div>
                      <div className="mt-1 text-xs text-gray-400" suppressHydrationWarning>Updated {formatRelativeTime(lead.updatedAt)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div>{lead.company}</div>
                    <div className="mt-1 text-xs text-gray-400">{lead.industry || 'Unspecified industry'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{lead.services.join(', ') || 'Not captured'}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <select
                        value={lead.status}
                        disabled={lead.status === 'Won'}
                        onChange={(event) =>
                          dispatch(
                            updateLeadStatus({
                              id: lead.id,
                              status: event.target.value as LeadStatus,
                            }),
                          )
                        }
                        className={`min-w-40 rounded-full border px-3 py-1 text-xs font-medium outline-none ${lead.status === 'Won'
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'border-gray-200 bg-white text-gray-700'
                          }`}
                      >
                        {leadStatusOptions.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>

                      {/* <div className="text-xs text-gray-400">
      {lead.stageProbability}% close probability
    </div> */}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(lead.leadValue || lead.budget, lead.currency)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-4"><PriorityBadge priority={lead.priority} /></td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div>{assigneeNameById.get(lead.assignedTo) || lead.assignedTo || 'Unassigned'}</div>
                    <div className="mt-1 text-xs text-gray-400">{lead.department || 'No department'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : 'TBD'}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{lead.nextAction || 'No next action set'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        aria-label={`Edit ${lead.name}`}
                      >
                        <PenLine size={14} />
                      </button>
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                        aria-label={`Call ${lead.name}`}
                      >
                        <Phone size={14} />
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        aria-label={`Email ${lead.name}`}
                      >
                        <Mail size={14} />
                      </a>
                      <button
                        onClick={() => setDeletingLead(lead)}
                        disabled={!canDeleteLead || lead.status === 'Won' || isSubmitting}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          !canDeleteLead || lead.status === 'Won'
                            ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        aria-label={`Delete ${lead.name}`}
                        title={!canDeleteLead ? 'Only admins can delete leads' : lead.status === 'Won' ? 'Won leads cannot be deleted' : 'Delete lead'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                    No leads matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addLeadOpen} onClose={() => dispatch(setAddLeadModal(false))} title="" subtitle="" size="2xl">
        <AddLeadForm
          onSave={handleSaveLead}
          onReset={() => dispatch(setAddLeadModal(false))}
          teamMembers={assigneeOptions}
          canAssignLead={canAssignLead}
        />
      </Modal>

      <Modal open={!!editingLead} onClose={() => setEditingLead(null)} title="" subtitle="" size="2xl">
        {editingLead && (
          <AddLeadForm
            mode="edit"
            initialData={leadToFormData(editingLead)}
            onSave={handleUpdateLead}
            onReset={() => setEditingLead(null)}
            teamMembers={assigneeOptions}
            canAssignLead={canAssignLead}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingLead}
        title="Delete Lead"
        description={
          deletingLead?.status === 'Won'
            ? 'Won leads cannot be deleted. The backend also blocks leads linked to projects, follow-ups, or call logs.'
            : `Delete ${deletingLead?.name ?? 'this lead'}? This is permanent. Leads with projects, follow-ups, or call logs will be blocked by the backend.`
        }
        confirmLabel={!canDeleteLead || deletingLead?.status === 'Won' ? 'Blocked' : 'Delete'}
        isWorking={isSubmitting}
        onConfirm={!canDeleteLead || deletingLead?.status === 'Won' ? () => setDeletingLead(null) : handleDeleteLead}
        onClose={() => setDeletingLead(null)}
      />
    </div>
  );
}
