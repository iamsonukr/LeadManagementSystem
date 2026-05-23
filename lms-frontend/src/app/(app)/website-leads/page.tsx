'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Trash2, PenLine, Globe, Users, AlertCircle,
  Loader2, ToggleLeft, ToggleRight, Copy, CheckCheck,
  TrendingUp, Clock,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CreateWebsiteSourceForm from '@/components/website-leads/CreateWebsiteSourceForm';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchWebsiteSources,
  createWebsiteSource,
  updateWebsiteSource,
  deleteWebsiteSource,
  fetchDashboardStats,
} from '@/store/slices/websiteLeadsSlice';
import { WebsiteSource } from '@/services/websiteLeadsService';
import { formatRelativeTime } from '@/lib/utils';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="ml-1 rounded p-1 text-gray-400 hover:text-indigo-600 transition-colors"
      title="Copy">
      {copied ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

function WebhookUrl({ sourceId }: { sourceId: string }) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${base}/website-leads/sources/${sourceId}/submit`;
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="truncate font-mono text-[11px] text-indigo-600">{url}</span>
      <CopyButton text={url} />
    </div>
  );
}

export default function WebsiteLeadsDashboard() {
  const dispatch = useAppDispatch();
  const { sources, isLoading, isSubmitting, error, dashboardStats, statsLoading } =
    useAppSelector((s) => s.websiteLeads);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<WebsiteSource | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [integrationSource, setIntegrationSource] = useState<WebsiteSource | null>(null);

  const deletingSource = sources.find((s) => s._id === deletingId);

  useEffect(() => {
    dispatch(fetchWebsiteSources());
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const handleCreate = async (payload: Parameters<typeof createWebsiteSource>[0]) => {
    await dispatch(createWebsiteSource(payload)).unwrap();
    setCreateOpen(false);
    dispatch(fetchDashboardStats());
  };

  const handleUpdate = async (payload: Parameters<typeof createWebsiteSource>[0]) => {
    if (!editingSource) return;
    await dispatch(updateWebsiteSource({ id: editingSource._id, payload })).unwrap();
    setEditingSource(null);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    dispatch(deleteWebsiteSource(deletingId));
    setDeletingId(null);
  };

  const handleToggle = (source: WebsiteSource) => {
    dispatch(updateWebsiteSource({ id: source._id, payload: { isActive: !source.isActive } }));
  };

  const totalLeads = sources.reduce((s, src) => s + (src.totalLeadsReceived ?? 0), 0);
  const activeSources = sources.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Website Sources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Capture leads from any website by posting form data to your unique webhook URL.
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus size={14} /> Add Website Source
        </button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Website Sources', value: sources.length, icon: Globe, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Sources', value: activeSources, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Total Leads Received', value: totalLeads, icon: Users, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-800 mb-1">How it works</p>
        <p className="text-xs text-blue-700">
          Each website source gets a unique <span className="font-mono font-semibold">POST</span> endpoint.
          Configure your website form to submit to that URL. Leads appear in your pipeline instantly —
          tagged with the source domain, and mapped using the field names you define.
        </p>
      </div>

      {/* Sources grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading sources…
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-20 text-gray-400">
          <Globe size={36} className="text-gray-200" />
          <p className="text-sm">No website sources yet.</p>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={14} /> Add your first source
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => {
            const stat = dashboardStats?.sources.find((s) => s.source._id === source._id);
            const topDomain = stat?.byDomain?.[0];
            return (
              <div key={source._id}
                className={`rounded-xl border bg-white shadow-sm transition-all ${source.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>

                {/* Card header */}
                <div className="flex items-start justify-between p-4 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${source.isActive ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                      <Globe size={16} className={source.isActive ? 'text-indigo-600' : 'text-gray-400'} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{source.name}</p>
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {source.leadSource}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(source)}
                    className={`shrink-0 transition-colors ${source.isActive ? 'text-indigo-500' : 'text-gray-300'}`}>
                    {source.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>

                {/* Webhook URL */}
                <div className="mx-4 mb-3 rounded-lg border border-indigo-50 bg-indigo-50 px-2.5 py-1.5">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">POST Endpoint</p>
                  <WebhookUrl sourceId={source._id} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 px-4 mb-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total Leads</p>
                    <p className="text-lg font-bold text-gray-900">{source.totalLeadsReceived ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Top Domain</p>
                    <p className="truncate text-xs font-semibold text-gray-700 mt-1">
                      {topDomain ? topDomain._id : '—'}
                    </p>
                  </div>
                </div>

                {/* Domains */}
                {source.allowedDomains.length > 0 && (
                  <div className="px-4 mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Whitelisted Domains</p>
                    <div className="flex flex-wrap gap-1">
                      {source.allowedDomains.slice(0, 3).map((d) => (
                        <span key={d} className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-600">
                          {d}
                        </span>
                      ))}
                      {source.allowedDomains.length > 3 && (
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500">
                          +{source.allowedDomains.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Last lead */}
                {source.lastLeadAt && (
                  <div className="px-4 mb-3 flex items-center gap-1.5 text-[11px] text-gray-400" suppressHydrationWarning>
                    <Clock size={11} />
                    Last lead {formatRelativeTime(source.lastLeadAt)}
                  </div>
                )}

                {/* Unknown domain tag */}
                {source.acceptUnknownDomains && (
                  <div className="px-4 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                      ⚠ Unknown domains flagged as "Unknown Source"
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 border-t border-gray-100 p-3">
                  <button onClick={() => setIntegrationSource(source)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                    Integration Guide
                  </button>
                  <Link href={`/website-leads/${source._id}/leads`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                    <Users size={12} /> View Leads
                  </Link>
                  <button onClick={() => setEditingSource(source)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100">
                    <PenLine size={13} />
                  </button>
                  <button onClick={() => setDeletingId(source._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-50 bg-red-50 text-red-400 hover:bg-red-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="" subtitle="" size="xl">
        <CreateWebsiteSourceForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} isSubmitting={isSubmitting} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingSource} onClose={() => setEditingSource(null)} title="" subtitle="" size="xl">
        {editingSource && (
          <CreateWebsiteSourceForm key={editingSource._id} initialData={editingSource}
            onSave={handleUpdate} onCancel={() => setEditingSource(null)} isSubmitting={isSubmitting} />
        )}
      </Modal>

      {/* Integration guide modal */}
      <Modal open={!!integrationSource} onClose={() => setIntegrationSource(null)} title="" subtitle="" size="lg">
        {integrationSource && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Integration Guide</h2>
              <p className="text-xs text-gray-500 mt-0.5">How to connect <strong>{integrationSource.name}</strong> to your LMS</p>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Your POST Endpoint</p>
              <div className="flex items-center gap-1">
                <code className="break-all text-xs text-indigo-600">
                  {process.env.NEXT_PUBLIC_API_URL}/website-leads/sources/{integrationSource._id}/submit
                </code>
                <CopyButton text={`${process.env.NEXT_PUBLIC_API_URL}/website-leads/sources/${integrationSource._id}/submit`} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Option 1 — HTML Form</p>
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] text-green-300">
{`<form action="${process.env.NEXT_PUBLIC_API_URL}/website-leads/sources/${integrationSource._id}/submit"
      method="POST">
  <input name="${integrationSource.nameField}" placeholder="Your Name" />
  <input name="${integrationSource.emailField}" placeholder="Email" />
  <input name="${integrationSource.phoneField}" placeholder="Phone" />
  <textarea name="${integrationSource.messageField}"></textarea>
  ${integrationSource.customFields.map((f) => `<input name="${f.websiteField}" placeholder="${f.label}" />`).join('\n  ')}
  <button type="submit">Submit</button>
</form>`}
              </pre>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Option 2 — JavaScript Fetch</p>
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] text-green-300">
{`fetch("${process.env.NEXT_PUBLIC_API_URL}/website-leads/sources/${integrationSource._id}/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ${integrationSource.nameField}: "John Doe",
    ${integrationSource.emailField}: "john@example.com",
    ${integrationSource.phoneField}: "+91 9876543210",
    ${integrationSource.messageField}: "Interested in yoga classes",
    ${integrationSource.customFields.map((f) => `${f.websiteField}: "value"`).join(',\n    ')}
  })
})`}
              </pre>
            </div>

            <div className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800">
              <strong>CORS:</strong> Make sure your NestJS backend has CORS enabled for your website domain.
              Leads arrive in your pipeline instantly once the form is submitted.
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deletingId} title="Delete Website Source"
        description={`Delete "${deletingSource?.name}"? The source config will be removed. Leads already in your pipeline will remain.`}
        confirmLabel="Delete Source" onConfirm={handleDelete} onClose={() => setDeletingId(null)} />
    </div>
  );
}
