'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, RefreshCw, Trash2, PenLine, CheckCircle2,
  XCircle, Clock, AlertCircle, Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CreateCampaignForm from '@/components/google-ads/CreateCampaignForm';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchCampaigns,
  createCampaign,
  deleteCampaign,
  syncCampaign,
  updateCampaign,
} from '@/store/slices/googleAdsSlice';
import { GoogleAdsCampaign } from '@/services/googleAdsService';
import { formatDate, formatRelativeTime } from '@/lib/utils';

// ─── Sync status badge ────────────────────────────────────────────────────────
function SyncBadge({ status }: { status: GoogleAdsCampaign['syncStatus'] }) {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle2 size={11} /> Synced
        </span>
      );
    case 'syncing':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
          <Loader2 size={11} className="animate-spin" /> Syncing…
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
          <XCircle size={11} /> Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          <Clock size={11} /> Never synced
        </span>
      );
  }
}

export default function CampaignListPage() {
  const dispatch = useAppDispatch();
  const { campaigns, isLoading, isSubmitting, error, isSyncing, syncResults } =
    useAppSelector((s) => s.googleAds);

  const [createOpen, setCreateOpen]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const deletingCampaign = campaigns.find((c) => c._id === deletingId);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const handleCreate = async (payload: Parameters<typeof createCampaign>[0]) => {
    await dispatch(createCampaign(payload)).unwrap();
    setCreateOpen(false);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    dispatch(deleteCampaign(deletingId));
    setDeletingId(null);
  };

  const handleSync = (id: string) => {
    dispatch(syncCampaign(id));
  };

  const handleToggleActive = (campaign: GoogleAdsCampaign) => {
    dispatch(updateCampaign({ id: campaign._id, payload: { isActive: !campaign.isActive } }));
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Google Ads — Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect Google Sheets that collect campaign leads. Leads are synced every 15 minutes automatically.
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Campaigns</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{campaigns.length}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active Campaigns</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{campaigns.filter((c) => c.isActive).length}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Leads Imported</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {campaigns.reduce((sum, c) => sum + (c.totalLeadsImported ?? 0), 0)}
          </div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Plus size={20} className="text-gray-400" />
            </div>
            <p className="text-sm">No campaigns yet. Create one to start importing campaign leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Client', 'Campaign', 'Lead Source', 'Sync Status', 'Last Synced', 'Leads Imported', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const syncing = isSyncing[campaign._id] || campaign.syncStatus === 'syncing';
                  const lastResult = syncResults[campaign._id];
                  return (
                    <tr key={campaign._id} className="border-t border-gray-100 hover:bg-indigo-50/30 align-middle">
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{campaign.clientName}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/google-ads/campaigns/${campaign._id}/leads`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          {campaign.campaignName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {campaign.leadSource}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <SyncBadge status={syncing ? 'syncing' : campaign.syncStatus as GoogleAdsCampaign['syncStatus']} />
                          {campaign.syncStatus === 'error' && campaign.lastSyncError && (
                            <div className="text-[10px] text-red-500 max-w-[180px] truncate" title={campaign.lastSyncError}>
                              {campaign.lastSyncError}
                            </div>
                          )}
                          {lastResult && (
                            <div className="text-[10px] text-gray-400">
                              +{lastResult.imported} new, {lastResult.skipped} skipped
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500" suppressHydrationWarning>
                        {campaign.lastSyncedAt
                          ? formatRelativeTime(campaign.lastSyncedAt)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {campaign.totalLeadsImported ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(campaign)}
                          className={`transition-colors ${campaign.isActive ? 'text-indigo-600' : 'text-gray-300'}`}
                          title={campaign.isActive ? 'Deactivate auto-sync' : 'Activate auto-sync'}
                        >
                          {campaign.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/google-ads/campaigns/${campaign._id}/leads`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            title="View Leads"
                          >
                            <PenLine size={14} />
                          </Link>
                          <button
                            onClick={() => handleSync(campaign._id)}
                            disabled={syncing}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-40"
                            title="Sync now"
                          >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                          </button>
                          <button
                            onClick={() => setDeletingId(campaign._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                            title="Delete campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create campaign modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="" subtitle="" size="lg">
        <CreateCampaignForm
          onSave={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        title="Delete Campaign"
        description={`Delete campaign "${deletingCampaign?.campaignName}"? The campaign config will be removed. Imported leads will NOT be deleted — they remain in your lead pipeline.`}
        confirmLabel="Delete Campaign"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
