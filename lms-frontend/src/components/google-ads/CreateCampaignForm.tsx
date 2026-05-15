'use client';

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import googleAdsService, { ColumnMapping, CreateCampaignPayload } from '@/services/googleAdsService';

interface Props {
  onSave: (payload: CreateCampaignPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OUR_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: 'name',    label: 'Lead Name',   required: true  },
  { key: 'email',   label: 'Email',       required: true  },
  { key: 'phone',   label: 'Phone',       required: false },
  { key: 'company', label: 'Company',     required: false },
  { key: 'message', label: 'Message / Notes', required: false },
];

type Step = 'details' | 'mapping';

export default function CreateCampaignForm({ onSave, onCancel, isSubmitting }: Props) {
  const [step, setStep] = useState<Step>('details');

  // Step 1: campaign details
  const [clientName,    setClientName]    = useState('');
  const [campaignName,  setCampaignName]  = useState('');
  const [sheetUrl,      setSheetUrl]      = useState('');
  const [leadSource,    setLeadSource]    = useState('Google Ads');

  // Step 2: column mapping
  const [sheetHeaders, setSheetHeaders]   = useState<string[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [headersError, setHeadersError]   = useState('');
  const [mapping, setMapping]             = useState<ColumnMapping>({});

  // ── Step 1 → 2: fetch sheet headers ────────────────────────────────
  const handleNextStep = async () => {
    if (!clientName.trim() || !campaignName.trim() || !sheetUrl.trim()) return;

    setLoadingHeaders(true);
    setHeadersError('');

    try {
      const { headers } = await googleAdsService.previewHeaders(sheetUrl);
      setSheetHeaders(headers);

      // Auto-populate mapping if backend auto-detected something
      const autoMapping: ColumnMapping = {};
      const fuzzy = (needle: RegExp) => headers.find((h) => needle.test(h)) ?? '';

      autoMapping.name    = fuzzy(/name|full.?name/i);
      autoMapping.email   = fuzzy(/email|e.?mail/i);
      autoMapping.phone   = fuzzy(/phone|mobile|contact.?no/i);
      autoMapping.company = fuzzy(/company|organisation|organization/i);
      autoMapping.message = fuzzy(/message|notes?|description|query/i);
      setMapping(autoMapping);

      setStep('mapping');
    } catch (e) {
      setHeadersError((e as Error).message || 'Could not load sheet headers');
    } finally {
      setLoadingHeaders(false);
    }
  };

  // ── Final submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    await onSave({ clientName, campaignName, sheetUrl, leadSource, columnMapping: mapping });
  };

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {step === 'details' ? 'New Campaign' : 'Map Sheet Columns'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {step === 'details'
            ? 'Connect a Google Sheet that collects campaign lead responses.'
            : 'Tell us which sheet column maps to each lead field. Auto-detected values are pre-filled.'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['details', 'mapping'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === s
                  ? 'bg-indigo-600 text-white'
                  : i === 0 && step === 'mapping'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i === 0 && step === 'mapping' ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${step === s ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
              {s === 'details' ? 'Campaign Details' : 'Column Mapping'}
            </span>
            {i === 0 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Details ──────────────────────────────────────── */}
      {step === 'details' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Client Name *</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Campaign Name *</label>
            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Summer 2025 Lead Gen"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Google Sheet URL *</label>
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Share the sheet publicly (View only) or publish it as CSV via File → Share → Publish to Web.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Lead Source Label</label>
            <input
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              placeholder="Google Ads"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              This value will be stored as the lead source for all imported leads.
            </p>
          </div>

          {headersError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
              {headersError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!clientName.trim() || !campaignName.trim() || !sheetUrl.trim() || loadingHeaders}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingHeaders ? (
                <><Loader2 size={14} className="animate-spin" /> Loading headers…</>
              ) : (
                'Next: Map Columns →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Column Mapping ───────────────────────────────── */}
      {step === 'mapping' && (
        <div className="space-y-4">
          {sheetHeaders.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
              No headers detected. The sheet may be empty. You can still create the campaign — columns will be auto-detected on first sync.
            </div>
          ) : (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-700">
              Found <strong>{sheetHeaders.length}</strong> columns: <span className="font-mono">{sheetHeaders.slice(0, 5).join(', ')}{sheetHeaders.length > 5 ? '…' : ''}</span>
            </div>
          )}

          <div className="space-y-3">
            {OUR_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="grid grid-cols-2 items-center gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  {required && <span className="ml-1 text-red-400 text-xs">*</span>}
                </div>
                <select
                  value={mapping[key] ?? ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— skip / auto-detect —</option>
                  {sheetHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Creating…</>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
