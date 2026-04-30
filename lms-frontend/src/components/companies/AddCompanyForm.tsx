'use client';

import { useState } from 'react';
import { Building2, Globe, Users, DollarSign, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompanyFormData {
  name: string;
  industry: string;
  size: string;
  website: string;
  address: string;
  totalLeads: number;
  revenue: number;
}

const defaultForm: CompanyFormData = {
  name: '',
  industry: '',
  size: '',
  website: '',
  address: '',
  totalLeads: 0,
  revenue: 0,
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white';

interface Props {
  onSave: (data: CompanyFormData) => void;
  onClose: () => void;
  initialData?: Partial<CompanyFormData>;
  mode?: 'add' | 'edit';
}

export default function AddCompanyForm({ onSave, onClose, initialData, mode = 'add' }: Props) {
  const [form, setForm] = useState<CompanyFormData>({
    ...defaultForm,
    ...initialData,
  });

  const isEdit = mode === 'edit';

  const set = (key: keyof CompanyFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [key]: key === 'totalLeads' || key === 'revenue' ? Number(e.target.value) : e.target.value }));
    };

  const handleReset = () => {
    setForm({ ...defaultForm, ...initialData });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit Company' : 'Add Company'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update company information' : 'Create a new company profile'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <X size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Save size={14} /> {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<Globe size={14} />} title="Company Details" />
          <div className="space-y-3">
            <Field label="Company Name" required>
              <input className={inputCls} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Industry" required>
              <input className={inputCls} value={form.industry} onChange={set('industry')} />
            </Field>
            <Field label="Website">
              <input className={inputCls} value={form.website} onChange={set('website')} />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={form.address} onChange={set('address')} />
            </Field>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<Users size={14} />} title="Business Info" />
          <div className="space-y-3">
            <Field label="Company Size" required>
              <input className={inputCls} value={form.size} onChange={set('size')} />
            </Field>
            <Field label="Total Leads">
              <input type="number" min="0" className={inputCls} value={form.totalLeads} onChange={set('totalLeads')} />
            </Field>
            <Field label="Revenue">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  className={cn(inputCls, 'pl-8')}
                  value={form.revenue}
                  onChange={set('revenue')}
                />
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
