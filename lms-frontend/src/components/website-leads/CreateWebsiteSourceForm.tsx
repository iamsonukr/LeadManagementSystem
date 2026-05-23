'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, Info } from 'lucide-react';
import { CreateWebsiteSourcePayload, CustomFieldMapping, WebsiteSource } from '@/services/websiteLeadsService';

interface Props {
  onSave: (payload: CreateWebsiteSourcePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<WebsiteSource>;
}

const LMS_FIELD_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'location', label: 'Location' },
  { value: 'industry', label: 'Industry' },
  { value: 'budget', label: 'Budget' },
  { value: 'services', label: 'Services Interested' },
  { value: 'metadata.courseInterest', label: 'Course Interest' },
  { value: 'metadata.referral', label: 'Referral Source' },
  { value: 'metadata.custom', label: 'Custom (store in metadata)' },
];

export default function CreateWebsiteSourceForm({ onSave, onCancel, isSubmitting, initialData }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [domains, setDomains] = useState<string[]>(initialData?.allowedDomains ?? ['']);
  const [nameField, setNameField] = useState(initialData?.nameField ?? 'name');
  const [emailField, setEmailField] = useState(initialData?.emailField ?? 'email');
  const [phoneField, setPhoneField] = useState(initialData?.phoneField ?? 'phone');
  const [messageField, setMessageField] = useState(initialData?.messageField ?? 'message');
  const [leadSource, setLeadSource] = useState(initialData?.leadSource ?? 'Website');
  const [acceptUnknown, setAcceptUnknown] = useState(initialData?.acceptUnknownDomains ?? true);
  const [customFields, setCustomFields] = useState<CustomFieldMapping[]>(
    initialData?.customFields ?? [],
  );

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200';
  const labelCls = 'mb-1 block text-xs font-semibold text-gray-600';

  const handleDomainChange = (idx: number, value: string) => {
    setDomains((prev) => prev.map((d, i) => (i === idx ? value : d)));
  };

  const addDomain = () => setDomains((prev) => [...prev, '']);
  const removeDomain = (idx: number) => setDomains((prev) => prev.filter((_, i) => i !== idx));

  const addCustomField = () =>
    setCustomFields((prev) => [...prev, { websiteField: '', lmsField: 'metadata.custom', label: '' }]);

  const updateCustomField = (idx: number, key: keyof CustomFieldMapping, value: string) =>
    setCustomFields((prev) => prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f)));

  const removeCustomField = (idx: number) =>
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    await onSave({
      name,
      allowedDomains: domains.map((d) => d.trim()).filter(Boolean),
      nameField: nameField || 'name',
      emailField: emailField || 'email',
      phoneField: phoneField || 'phone',
      messageField: messageField || 'message',
      customFields: customFields.filter((f) => f.websiteField.trim()),
      leadSource,
      acceptUnknownDomains: acceptUnknown,
    });
  };

  const isEdit = !!initialData?._id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {isEdit ? 'Edit Website Source' : 'Add Website Source'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Configure which domains can submit leads and how form fields map to your pipeline.
        </p>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Source Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yoga Website, Landing Page" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Lead Source Label</label>
          <input value={leadSource} onChange={(e) => setLeadSource(e.target.value)}
            placeholder="Website" className={inputCls} />
          <p className="mt-1 text-[11px] text-gray-400">Label shown in your leads pipeline.</p>
        </div>
      </div>

      {/* Domain whitelist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}>Allowed Domains</label>
          <button onClick={addDomain}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            <Plus size={12} /> Add Domain
          </button>
        </div>
        <div className="space-y-2">
          {domains.map((domain, idx) => (
            <div key={idx} className="flex gap-2">
              <input value={domain} onChange={(e) => handleDomainChange(idx, e.target.value)}
                placeholder="e.g. yogafitness.com" className={inputCls} />
              {domains.length > 1 && (
                <button onClick={() => removeDomain(idx)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input type="checkbox" id="acceptUnknown" checked={acceptUnknown}
            onChange={(e) => setAcceptUnknown(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
          <label htmlFor="acceptUnknown" className="text-xs text-gray-600">
            Accept leads from unlisted domains (flagged as "Unknown Source")
          </label>
        </div>
      </div>

      {/* Standard field mapping */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Standard Field Mapping</h3>
          <div className="group relative">
            <Info size={13} className="text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-5 z-10 hidden group-hover:block w-64 rounded-lg bg-gray-900 p-2.5 text-[11px] text-white shadow-lg">
              Enter the exact field name your website form sends in the POST body.
              e.g. if your form has &lt;input name="your_name"&gt;, enter "your_name".
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Name field', value: nameField, set: setNameField, placeholder: 'name' },
            { label: 'Email field', value: emailField, set: setEmailField, placeholder: 'email' },
            { label: 'Phone field', value: phoneField, set: setPhoneField, placeholder: 'phone' },
            { label: 'Message field', value: messageField, set: setMessageField, placeholder: 'message' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)}
                placeholder={placeholder} className={inputCls} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          These are the keys in your website's form POST body. Leave as default if your form uses standard field names.
        </p>
      </div>

      {/* Custom field mapping */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Custom Fields</h3>
          <button onClick={addCustomField}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            <Plus size={12} /> Add Field
          </button>
        </div>

        {customFields.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">
            No custom fields. Click "Add Field" to map additional form fields like course interest, budget, etc.
          </p>
        ) : (
          <div className="space-y-2">
            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className={labelCls}>Website Field Name</label>}
                  <input value={field.websiteField}
                    onChange={(e) => updateCustomField(idx, 'websiteField', e.target.value)}
                    placeholder="e.g. course_interest" className={inputCls} />
                </div>
                <div className="flex-1">
                  {idx === 0 && <label className={labelCls}>Label (shown in dashboard)</label>}
                  <input value={field.label}
                    onChange={(e) => updateCustomField(idx, 'label', e.target.value)}
                    placeholder="e.g. Course Interest" className={inputCls} />
                </div>
                <div className="flex-1">
                  {idx === 0 && <label className={labelCls}>Map to LMS Field</label>}
                  <select value={field.lmsField}
                    onChange={(e) => updateCustomField(idx, 'lmsField', e.target.value)}
                    className={inputCls}>
                    {LMS_FIELD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => removeCustomField(idx)}
                  className="mb-0 rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Add Source'}
        </button>
      </div>
    </div>
  );
}
