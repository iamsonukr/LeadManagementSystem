'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, RefreshCw, Trash2, PenLine,
  CheckCircle2, XCircle, Clock, AlertCircle, Loader2,
  ToggleLeft, ToggleRight, Wifi, Info,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CreateMetaCampaignForm from '@/components/meta-ads/CreateMetaCampaignForm';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchMetaCampaigns,
  createMetaCampaign,
  deleteMetaCampaign,
  syncMetaCampaign,
  updateMetaCampaign,
} from '@/store/slices/metaAdsSlice';
import { MetaAdsCampaign } from '@/services/metaAdsService';
import { formatRelativeTime } from '@/lib/utils';

function SyncBadge({ status }: { status: MetaAdsCampaign['syncStatus'] }) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <Wifi size={11} /> Active
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
          <Clock size={11} /> Idle
        </span>
      );
  }
}

export default function MetaCampaignListPage() {
  const dispatch = useAppDispatch();
  const { campaigns, isLoading, isSubmitting, error, isSyncing, syncResults } =
    useAppSelector((s) => s.metaAds);

  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<MetaAdsCampaign | null>(null);
  const [detailsCampaign, setDetailsCampaign] = useState<MetaAdsCampaign | null>(null);
  const deletingCampaign = campaigns.find((c) => c._id === deletingId);

  useEffect(() => { dispatch(fetchMetaCampaigns()); }, [dispatch]);

  const handleCreate = async (payload: Parameters<typeof createMetaCampaign>[0]) => {
    await dispatch(createMetaCampaign(payload)).unwrap();
    setCreateOpen(false);
  };

  const handleUpdate = async (payload: Parameters<typeof createMetaCampaign>[0]) => {
    if (!editingCampaign) return;
    await dispatch(updateMetaCampaign({ id: editingCampaign._id, payload })).unwrap();
    setEditingCampaign(null);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    dispatch(deleteMetaCampaign(deletingId));
    setDeletingId(null);
  };

  const handleSync = (id: string) => dispatch(syncMetaCampaign(id));

  const handleToggleActive = (campaign: MetaAdsCampaign) => {
    dispatch(updateMetaCampaign({ id: campaign._id, payload: { isActive: !campaign.isActive } }));
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''}/meta-ads/webhook`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Meta Ads — Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect Facebook Pages to capture leads from Meta Lead Ad forms in real-time.
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

      {/* Webhook URL info box */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Wifi size={15} className="mt-0.5 text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-800">Facebook Webhook URL</p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-indigo-600">{webhookUrl}</p>
            <p className="mt-1 text-[11px] text-indigo-500">
              Register this URL in your Facebook App → Webhooks → Page → leadgen field.
              Verify Token: <span className="font-mono font-semibold">yogalms_webhook_secret_2024</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Campaigns', value: campaigns.length },
          { label: 'Active Campaigns', value: campaigns.filter((c) => c.isActive).length },
          { label: 'Total Leads Imported', value: campaigns.reduce((s, c) => s + (c.totalLeadsImported ?? 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
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
            <p className="text-sm">No campaigns yet. Connect your Facebook Page to start capturing leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Client', 'Campaign', 'Page ID', 'Lead Source', 'Status', 'Last Lead', 'Leads', 'Active', 'Actions'].map((h) => (
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
                        <Link href={`/meta-ads/campaigns/${campaign._id}/leads`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                          {campaign.campaignName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{campaign.pageId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {campaign.leadSource}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <SyncBadge status={syncing ? 'syncing' : campaign.syncStatus as MetaAdsCampaign['syncStatus']} />
                          {campaign.syncStatus === 'error' && campaign.lastSyncError && (
                            <div className="text-[10px] text-red-500 max-w-[180px] truncate" title={campaign.lastSyncError}>
                              {campaign.lastSyncError}
                            </div>
                          )}
                          {lastResult && (
                            <div className="text-[10px] text-gray-400">+{lastResult.imported} new leads</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500" suppressHydrationWarning>
                        {campaign.lastSyncedAt ? formatRelativeTime(campaign.lastSyncedAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {campaign.totalLeadsImported ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(campaign)}
                          className={`transition-colors ${campaign.isActive ? 'text-indigo-600' : 'text-gray-300'}`}>
                          {campaign.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDetailsCampaign(campaign)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100" title="Details">
                            <Info size={14} />
                          </button>
                          <Link href={`/meta-ads/campaigns/${campaign._id}/leads`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="View Leads">
                            <PenLine size={14} />
                          </Link>
                          <button onClick={() => handleSync(campaign._id)} disabled={syncing}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-40" title="Pull leads from Facebook">
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                          </button>
                          <button onClick={() => setDeletingId(campaign._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Delete">
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

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="" subtitle="" size="lg">
        <CreateMetaCampaignForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} isSubmitting={isSubmitting} />
      </Modal>

      {/* Details modal */}
      <Modal open={!!detailsCampaign} onClose={() => setDetailsCampaign(null)} title="" subtitle="" size="md">
        {detailsCampaign && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Campaign Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Campaign', value: detailsCampaign.campaignName },
                { label: 'Client', value: detailsCampaign.clientName },
                { label: 'Page ID', value: detailsCampaign.pageId },
                { label: 'Form ID', value: detailsCampaign.formId || 'All forms' },
                { label: 'Ad Account', value: detailsCampaign.adAccountId || 'Not set' },
                { label: 'Lead Source', value: detailsCampaign.leadSource },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
                  <div className="truncate text-sm font-medium text-gray-800">{value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { setEditingCampaign(detailsCampaign); setDetailsCampaign(null); }}
              className="w-full rounded-lg border border-indigo-100 bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
              Edit Campaign
            </button>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingCampaign} onClose={() => setEditingCampaign(null)} title="" subtitle="" size="lg">
        {editingCampaign && (
          <CreateMetaCampaignForm key={editingCampaign._id} initialData={editingCampaign}
            onSave={handleUpdate} onCancel={() => setEditingCampaign(null)} isSubmitting={isSubmitting} />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deletingId} title="Delete Campaign"
        description={`Delete "${deletingCampaign?.campaignName}"? Campaign config will be removed. Imported leads remain in your pipeline.`}
        confirmLabel="Delete Campaign" onConfirm={handleDelete} onClose={() => setDeletingId(null)} />
    </div>
  );
}
