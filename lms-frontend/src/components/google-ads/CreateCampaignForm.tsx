'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import googleAdsService, {
  ColumnMapping,
  CreateCampaignPayload,
  GoogleAdsCampaign,
} from '@/services/googleAdsService';

interface Props {
  onSave: (payload: CreateCampaignPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<GoogleAdsCampaign>;
}

const LEAD_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Lead Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'services', label: 'Services' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'department', label: 'Department' },
  { key: 'leadValue', label: 'Lead Value' },
  { key: 'stageProbability', label: 'Stage Probability' },
  { key: 'expectedCloseDate', label: 'Expected Close Date' },
  { key: 'lastActivityAt', label: 'Last Activity At' },
  { key: 'lastContactedAt', label: 'Last Contacted At' },
  { key: 'nextAction', label: 'Next Action' },
  { key: 'location', label: 'Location' },
  { key: 'industry', label: 'Industry' },
  { key: 'companySize', label: 'Company Size' },
  { key: 'budget', label: 'Budget' },
  { key: 'currency', label: 'Currency' },
  { key: 'address', label: 'Address' },
  { key: 'tags', label: 'Tags' },
  { key: 'aiScore', label: 'AI Score' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'callCount', label: 'Call Count' },
  { key: 'lastCallDate', label: 'Last Call Date' },
  { key: 'nextFollowUp', label: 'Next Follow Up' },
  { key: 'notes', label: 'Notes' },
];

type Step = 'details' | 'mapping';

export default function CreateCampaignForm({
  onSave,
  onCancel,
  isSubmitting,
  initialData,
}: Props) {
  const [step, setStep] = useState<Step>('details');

  const [clientName, setClientName] = useState(initialData?.clientName ?? '');
  const [campaignName, setCampaignName] = useState(initialData?.campaignName ?? '');
  const [sheetLink, setSheetLink] = useState(initialData?.sheetLink ?? initialData?.sheetUrl ?? '');
  const [formLink, setFormLink] = useState(initialData?.formLink ?? '');
  const [leadSource, setLeadSource] = useState(initialData?.leadSource ?? 'Google Ads');

  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [headersError, setHeadersError] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>(initialData?.columnMapping ?? {});

  const handleNextStep = async () => {
    if (!clientName.trim() || !campaignName.trim() || !sheetLink.trim()) return;

    setLoadingHeaders(true);
    setHeadersError('');

    try {
      const { headers } = await googleAdsService.previewHeaders(sheetLink);
      setSheetHeaders(headers);

      const fuzzy = (needle: RegExp) => headers.find((h) => needle.test(h)) ?? '';
      const autoMapping: ColumnMapping = {
        name: fuzzy(/name|full.?name/i),
        email: fuzzy(/email|e.?mail/i),
        phone: fuzzy(/phone|mobile|contact.?no/i),
        company: fuzzy(/company|organisation|organization/i),
        notes: fuzzy(/message|notes?|description|query/i),
      };

      setMapping((prev) => (Object.keys(prev).length ? prev : autoMapping));
      setStep('mapping');
    } catch (e) {
      setHeadersError((e as Error).message || 'Could not load sheet headers');
    } finally {
      setLoadingHeaders(false);
    }
  };

  const handleSubmit = async () => {
    await onSave({
      clientName,
      campaignName,
      sheetUrl: sheetLink,
      sheetLink,
      formLink,
      leadSource,
      columnMapping: mapping,
    });
  };

  const targetForHeader = (header: string) =>
    Object.entries(mapping).find(([, mappedHeader]) => mappedHeader === header)?.[0] ?? '';

  const setHeaderTarget = (header: string, target: string) => {
    setMapping((prev) => {
      const next: ColumnMapping = { ...prev };
      Object.entries(next).forEach(([field, mappedHeader]) => {
        if (mappedHeader === header || field === target) delete next[field];
      });
      if (target) next[target] = header;
      return next;
    });
  };

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200';
  const saveLabel = initialData?._id ? 'Save Campaign' : 'Create Campaign';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {step === 'details' ? (initialData?._id ? 'Edit Campaign' : 'New Campaign') : 'Map Sheet Columns'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {step === 'details'
            ? 'Connect the Google Sheet and optional Google Form used by this campaign.'
            : 'Map each sheet column to any field in the Leads schema.'}
        </p>
      </div>

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
              {i === 0 && step === 'mapping' ? 'OK' : i + 1}
            </div>
            <span className={`text-xs ${step === s ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
              {s === 'details' ? 'Campaign Details' : 'Column Mapping'}
            </span>
            {i === 0 && <span className="text-gray-300">/</span>}
          </div>
        ))}
      </div>

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
              placeholder="e.g. Summer 2026 Lead Gen"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Sheet Link *</label>
            <input
              value={sheetLink}
              onChange={(e) => setSheetLink(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Share the sheet publicly or publish it as CSV from Google Sheets.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Google Form Link</label>
            <input
              value={formLink}
              onChange={(e) => setFormLink(e.target.value)}
              placeholder="https://docs.google.com/forms/d/..."
              className={inputCls}
            />
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
              Used as the default source for imported leads unless the source field is mapped.
            </p>
          </div>

          {headersError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
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
              disabled={!clientName.trim() || !campaignName.trim() || !sheetLink.trim() || loadingHeaders}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingHeaders ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Loading headers...
                </>
              ) : (
                'Next: Map Columns'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          {sheetHeaders.length === 0 ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              No headers detected. You can still create the campaign and rely on auto-detection during sync.
            </div>
          ) : (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              Found <strong>{sheetHeaders.length}</strong> sheet columns. Choose the lead field each column should fill.
            </div>
          )}

          {sheetHeaders.length > 0 && (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {sheetHeaders.map((header) => (
                <div key={header} className="grid grid-cols-[minmax(0,1fr)_minmax(160px,220px)] items-center gap-3">
                  <div className="truncate rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700" title={header}>
                    {header}
                  </div>
                  <select
                    value={targetForHeader(header)}
                    onChange={(e) => setHeaderTarget(header, e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Skip this column</option>
                    {LEAD_FIELDS.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}{field.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                saveLabel
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
