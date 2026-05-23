'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Filter, Globe, Loader2,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchSourceLeads } from '@/store/slices/websiteLeadsSlice';
import LeadCard from '@/components/leads/LeadCard';

const STATUS_OPTIONS = ['', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High'];

export default function WebsiteSourceLeadsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { activeSourceLeads, leadsLoading, error } = useAppSelector((s) => s.websiteLeads);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [domain, setDomain] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const load = (overrides?: Record<string, unknown>) => {
    dispatch(fetchSourceLeads({
      id,
      filters: { page, limit: 50, search, status, priority, domain, ...overrides },
    }));
  };

  useEffect(() => { load(); }, [id, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load({ page: 1, search, status, priority, domain });
  };

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === 'status') setStatus(value);
    if (key === 'priority') setPriority(value);
    if (key === 'domain') setDomain(value);
    load({ page: 1, search, status, priority, domain, [key]: value });
  };

  const source = activeSourceLeads?.source;
  const leads = activeSourceLeads?.data ?? [];
  const totalPages = activeSourceLeads?.totalPages ?? 1;
  const total = activeSourceLeads?.total ?? 0;

  // Collect unique domains from leads for domain filter
  const uniqueDomains = Array.from(
    new Set(leads.map((l) => l.metadata?.originDomain).filter(Boolean))
  );

  const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400';

  return (
    <div className="space-y-5 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push('/website-leads')}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-indigo-500 shrink-0" />
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {source?.name ?? 'Website Source'}
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} lead{total !== 1 ? 's' : ''} received
            {source?.allowedDomains?.length ? ` · ${source.allowedDomains.join(', ')}` : ''}
          </p>
        </div>
        <button onClick={() => load()}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400" />
          </div>
          <button type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Search
          </button>
        </form>
        <button onClick={() => setShowFilters((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <Filter size={14} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Status</label>
            <select value={status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Priority</label>
            <select value={priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className={selectCls}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
            </select>
          </div>
          {uniqueDomains.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Domain</label>
              <select value={domain} onChange={(e) => handleFilterChange('domain', e.target.value)} className={selectCls}>
                <option value="">All Domains</option>
                {uniqueDomains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => {
            setStatus(''); setPriority(''); setDomain(''); setSearch(''); setPage(1);
            load({ page: 1, search: '', status: '', priority: '', domain: '' });
          }} className="self-end rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-100">
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Leads */}
      {leadsLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading leads…
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-20 text-gray-400">
          <Globe size={36} className="text-gray-200" />
          <p className="text-sm">No leads yet from this source.</p>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            Once your website form starts posting to the webhook URL, leads will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} · {total} leads
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
