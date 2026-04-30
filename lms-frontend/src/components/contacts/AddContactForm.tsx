'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building2, Save, X } from 'lucide-react';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

const defaultForm: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
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
  onSave: (data: ContactFormData) => void;
  onClose: () => void;
  initialData?: Partial<ContactFormData>;
  mode?: 'add' | 'edit';
}

export default function AddContactForm({ onSave, onClose, initialData, mode = 'add' }: Props) {
  const [form, setForm] = useState<ContactFormData>({
    ...defaultForm,
    ...initialData,
  });

  const isEdit = mode === 'edit';

  const set = (key: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

  const handleReset = () => {
    setForm({ ...defaultForm, ...initialData });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update contact details' : 'Create a new contact record'}
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
          <SectionTitle icon={<Mail size={14} />} title="Contact Details" />
          <div className="space-y-3">
            <Field label="Full Name" required>
              <input className={inputCls} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Email" required>
              <input type="email" className={inputCls} value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone" required>
              <input className={inputCls} value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<Building2 size={14} />} title="Company Info" />
          <div className="space-y-3">
            <Field label="Company" required>
              <input className={inputCls} value={form.company} onChange={set('company')} />
            </Field>
            <Field label="Role" required>
              <input className={inputCls} value={form.role} onChange={set('role')} />
            </Field>
            <Field label="Status">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
