'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Download, Mail, PenLine, Phone,
  Plus, RefreshCw, Search, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import AddLeadForm, { LeadAssigneeOption, LeadFormData } from '@/components/leads/AddLeadForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useAuth } from '@/context/AuthContext';
import { leadStatusOptions, leadSourceOptions, normalizeServices } from '@/lib/crm';
import { exportRowsToCsv } from '@/lib/export';
import { canManageLeads, isAdmin } from '@/lib/rbac';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  deleteLeadThunk,
  updateLead,
  updateLeadStatus,
} from '@/store/slices/leadsSlice';
import {
  fetchCampaignLeads,
  syncCampaign,
} from '@/store/slices/googleAdsSlice';
import { usersService } from '@/services';
import { Lead, LeadStatus, UserRecord } from '@/types';

// ─── Re-use the same toLeadPayload/leadToFormData helpers from leads/page ────

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
    source: (data.leadSource as Lead['source']) || 'Google Form',
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
    currency: String(data.currency || 'INR'),
    address: {
      line1: String(data.address1 || ''),
      line2: String(data.address2 || '') || undefined,
      city: String(data.city || ''),
      state: String(data.state || ''),
      postalCode: String(data.postal || ''),
      country: String(data.country || ''),
    },
    tags: String(data.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    aiScore: existing?.aiScore ?? 0,
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
    fullName: lead.name, phoneNumber: lead.phone, email: lead.email,
    company: lead.company, leadSource: lead.source, leadStatus: lead.status,
    priority: lead.priority, leadType: '', contactMethod: '', bestTime: '',
    doNotContact: false, emailOptIn: true,
    address1: lead.address.line1, address2: lead.address.line2 || '',
    city: lead.address.city, state: lead.address.state,
    postal: lead.address.postalCode, country: lead.address.country,
    industry: lead.industry, companySize: lead.companySize,
    budget: lead.budget ? String(lead.budget) : '', currency: lead.currency,
    leadValue: lead.leadValue ? String(lead.leadValue) : '',
    notes: lead.notes || '',
    followUpDate: followUp ? followUp.toISOString().slice(0, 10) : '',
    followUpTime: followUp ? followUp.toISOString().slice(11, 16) : '',
    assignedTo: lead.assignedTo, department: lead.department,
    expectedCloseDate: expectedClose ? expectedClose.toISOString().slice(0, 10) : '',
    services: lead.services.join(', '), nextAction: lead.nextAction || '',
    reminder: '', tags: lead.tags.join(', '), additionalInfo: '',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignLeadsPage() {
  const dispatch = useAppDispatch();
  const { id: campaignId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { activeCampaignLeads, leadsLoading, leadsError, isSyncing } =
    useAppSelector((s) => s.googleAds);
  const { isSubmitting } = useAppSelector((s) => s.leads);

  const campaign = activeCampaignLeads?.campaign;
  const leads = activeCampaignLeads?.data ?? [];
  const syncing = isSyncing[campaignId] || campaign?.syncStatus === 'syncing';

  const [searchVal,    setSearchVal]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignableUsers, setAssignableUsers] = useState<UserRecord[]>([]);
  const [editingLead,  setEditingLead]  = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const canAssignLead = canManageLeads(user);
  const canDeleteLead = isAdmin(user);

  const assigneeOptions: LeadAssigneeOption[] = useMemo(
    () =>
      canAssignLead
        ? assignableUsers.map((m) => ({ id: m.id, name: m.name }))
        : user?.id && user?.name
        ? [{ id: user.id, name: user.name }]
        : [],
    [assignableUsers, canAssignLead, user],
  );

  const assigneeNameById = useMemo(
    () => new Map(assigneeOptions.map((m) => [m.id, m.name])),
    [assigneeOptions],
  );

  // Load campaign leads
  useEffect(() => {
    if (!campaignId) return;
    dispatch(fetchCampaignLeads({ id: campaignId }));
  }, [dispatch, campaignId]);

  // Load assignable users
  useEffect(() => {
    if (!canAssignLead) return;
    usersService.getAll()
      .then((users) => setAssignableUsers(users.filter((u) => u.status === 'Active')))
      .catch(() => setAssignableUsers([]));
  }, [canAssignLead]);

  // ── Filtered leads (client-side) ──────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchVal.toLowerCase();
    return leads.filter((lead) => {
      const matchSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.phone ?? '').includes(q);
      const matchStatus   = !statusFilter   || lead.status   === statusFilter;
      const matchSource   = !sourceFilter   || lead.source   === sourceFilter;
      const matchPriority = !priorityFilter || lead.priority === priorityFilter;
      return matchSearch && matchStatus && matchSource && matchPriority;
    });
  }, [leads, searchVal, statusFilter, sourceFilter, priorityFilter]);

  // ── Actions ────────────────────────────────────────────────────────
  const handleSync = () => dispatch(syncCampaign(campaignId));

  const handleUpdateLead = async (data: LeadFormData) => {
    if (!editingLead) return;
    await dispatch(updateLead(toLeadPayload(data, editingLead))).unwrap();
    setEditingLead(null);
    dispatch(fetchCampaignLeads({ id: campaignId }));
  };

  const handleDeleteLead = () => {
    if (!deletingLead) return;
    dispatch(deleteLeadThunk(deletingLead.id)).then(() => {
      dispatch(fetchCampaignLeads({ id: campaignId }));
    });
    setDeletingLead(null);
  };

  const exportLeads = () => {
    exportRowsToCsv(
      `${campaign?.campaignName ?? 'campaign'}-leads.csv`,
      ['Lead', 'Company', 'Phone', 'Email', 'Stage', 'Source', 'Priority', 'Owner', 'Next Follow Up', 'Notes'],
      filtered.map((l) => [
        l.name, l.company, l.phone, l.email, l.status, l.source, l.priority,
        l.assignedTo, l.nextFollowUp ? formatDate(l.nextFollowUp) : '', l.notes ?? '',
      ]),
    );
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Breadcrumb + header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/google-ads/campaigns"
            className="mb-1 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={12} /> Back to Campaigns
          </Link>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {campaign ? campaign.campaignName : 'Campaign Leads'}
          </h1>
          {campaign && (
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-500">Client: <strong>{campaign.clientName}</strong></span>
              <span className="text-xs text-gray-500">Source: <strong>{campaign.leadSource}</strong></span>
              {campaign.lastSyncedAt && (
                <span className="text-xs text-gray-400" suppressHydrationWarning>
                  Last synced {formatRelativeTime(campaign.lastSyncedAt)}
                </span>
              )}
              {campaign.syncStatus === 'error' && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                  <AlertCircle size={11} /> {campaign.lastSyncError}
                </span>
              )}
            </div>
          )}
          {leadsError && <p className="mt-1 text-xs text-red-600">{leadsError}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportLeads}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Leads</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{leads.length}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">New</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {leads.filter((l) => l.status === 'New').length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contacted</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {leads.filter((l) => l.status === 'Contacted').length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">High Priority</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {leads.filter((l) => l.priority === 'High').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 min-w-56 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search name, company, email, phone…"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Statuses</option>
          {leadStatusOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none"
        >
          <option value="">All Priorities</option>
          {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Leads table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {leadsLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading leads…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Lead', 'Company', 'Stage', 'Priority', 'Owner', 'Next Follow Up', 'Notes', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-t border-gray-100 align-top hover:bg-indigo-50/30">
                    {/* Lead name + contact */}
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                        {lead.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-gray-400">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                      <div className="mt-0.5 text-[10px] text-gray-300" suppressHydrationWarning>
                        {formatRelativeTime(lead.createdAt)}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3 text-sm text-gray-700">{lead.company}</td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        disabled={lead.status === 'Won'}
                        onChange={(e) =>
                          dispatch(updateLeadStatus({ id: lead.id, status: e.target.value as LeadStatus }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium outline-none ${
                          lead.status === 'Won'
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        {leadStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>

                    {/* Assigned to */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assigneeNameById.get(lead.assignedTo) || lead.assignedTo || 'Unassigned'}
                    </td>

                    {/* Next follow up */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}
                    </td>

                    {/* Notes preview */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="line-clamp-2 text-xs text-gray-500">{lead.notes || '—'}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          title="Edit lead"
                        >
                          <PenLine size={14} />
                        </button>
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                          title="Call"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Email"
                        >
                          <Mail size={14} />
                        </a>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                          title="View full lead"
                        >
                          <Plus size={14} />
                        </Link>
                        <button
                          onClick={() => setDeletingLead(lead)}
                          disabled={!canDeleteLead || lead.status === 'Won' || isSubmitting}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            !canDeleteLead || lead.status === 'Won'
                              ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      {leads.length === 0
                        ? 'No leads imported yet. Click "Sync Now" to pull leads from the sheet.'
                        : 'No leads matched the filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit lead modal */}
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingLead}
        title="Delete Lead"
        description={`Delete ${deletingLead?.name ?? 'this lead'}? Leads with follow-ups, call logs, or projects cannot be deleted.`}
        confirmLabel={!canDeleteLead || deletingLead?.status === 'Won' ? 'Blocked' : 'Delete'}
        isWorking={isSubmitting}
        onConfirm={!canDeleteLead || deletingLead?.status === 'Won' ? () => setDeletingLead(null) : handleDeleteLead}
        onClose={() => setDeletingLead(null)}
      />
    </div>
  );
}