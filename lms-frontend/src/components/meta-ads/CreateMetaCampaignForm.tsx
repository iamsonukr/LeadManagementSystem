'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CreateMetaCampaignPayload, MetaAdsCampaign } from '@/services/metaAdsService';

interface Props {
  onSave: (payload: CreateMetaCampaignPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<MetaAdsCampaign>;
}

export default function CreateMetaCampaignForm({ onSave, onCancel, isSubmitting, initialData }: Props) {
  const [clientName, setClientName] = useState(initialData?.clientName ?? '');
  const [campaignName, setCampaignName] = useState(initialData?.campaignName ?? '');
  const [pageId, setPageId] = useState(initialData?.pageId ?? '');
  const [formId, setFormId] = useState(initialData?.formId ?? '');
  const [adAccountId, setAdAccountId] = useState(initialData?.adAccountId ?? '');
  const [leadSource, setLeadSource] = useState(initialData?.leadSource ?? 'Meta Ads');

  const handleSubmit = async () => {
    await onSave({ clientName, campaignName, pageId, formId, adAccountId, leadSource });
  };

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200';

  const saveLabel = initialData?._id ? 'Save Campaign' : 'Connect Campaign';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {initialData?._id ? 'Edit Meta Campaign' : 'Connect Meta Lead Ads'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Link your Facebook Page to automatically capture leads from Meta Lead Ad forms.
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
        <strong>How it works:</strong> Facebook sends lead data to your webhook in real-time.
        You can also manually sync to pull existing leads from the Graph API.
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Client Name *</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Yoga and Fitness" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Campaign Name *</label>
          <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Summer 2026 Leads" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Facebook Page ID *</label>
          <input value={pageId} onChange={(e) => setPageId(e.target.value)}
            placeholder="e.g. 100683081627074" className={inputCls} />
          <p className="mt-1 text-[11px] text-gray-400">
            Found in your Facebook Page settings or at developers.facebook.com → /me/accounts
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Lead Form ID <span className="text-gray-400 font-normal">(optional)</span></label>
          <input value={formId} onChange={(e) => setFormId(e.target.value)}
            placeholder="Leave blank to capture leads from all forms" className={inputCls} />
          <p className="mt-1 text-[11px] text-gray-400">
            Specific form ID to filter. Leave blank to capture from all forms on the page.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Ad Account ID <span className="text-gray-400 font-normal">(optional)</span></label>
          <input value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)}
            placeholder="e.g. act_123456789" className={inputCls} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Lead Source Label</label>
          <input value={leadSource} onChange={(e) => setLeadSource(e.target.value)}
            placeholder="Meta Ads" className={inputCls} />
          <p className="mt-1 text-[11px] text-gray-400">
            Label shown as the lead source in your pipeline.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            disabled={!clientName.trim() || !campaignName.trim() || !pageId.trim() || isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
