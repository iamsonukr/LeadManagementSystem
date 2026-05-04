'use client';

import { useState } from 'react';
import { User, Mail, Briefcase, Save, X } from 'lucide-react';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  phone: string;
  status: string;
  leads: number;
}

const defaultForm: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: '',
  department: '',
  phone: '',
  status: 'Active',
  leads: 0,
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

const selectCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white text-gray-600';

interface Props {
  onSave: (data: UserFormData) => void;
  onClose: () => void;
  initialData?: Partial<UserFormData>;
  mode?: 'add' | 'edit';
}

export default function AddUserForm({ onSave, onClose, initialData, mode = 'add' }: Props) {
  const [form, setForm] = useState<UserFormData>({
    ...defaultForm,
    ...initialData,
  });

  const isEdit = mode === 'edit';

  const set = (key: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = key === 'leads' ? Number(e.target.value) : e.target.value;
      setForm(prev => ({ ...prev, [key]: value }));
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
              {isEdit ? 'Edit User' : 'Add User'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update dashboard access' : 'Add a new dashboard user'}
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
          <SectionTitle icon={<Mail size={14} />} title="Profile" />
          <div className="space-y-3">
            <Field label="Full Name" required>
              <input className={inputCls} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Email" required>
              <input type="email" className={inputCls} value={form.email} onChange={set('email')} />
            </Field>
            {!isEdit && (
              <Field label="Password" required>
                <input type="password" className={inputCls} value={form.password} onChange={set('password')} />
              </Field>
            )}
            <Field label="Role" required>
              <select className={selectCls} value={form.role} onChange={set('role')}>
                <option value="">Select role</option>
                {['Admin', 'Sales Manager', 'Sales Executive'].map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<Briefcase size={14} />} title="Work Details" />
          <div className="space-y-3">
            <Field label="Department">
              <input className={inputCls} value={form.department} onChange={set('department')} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Lead Count">
              <input type="number" min="0" className={inputCls} value={form.leads} onChange={set('leads')} />
            </Field>
            <Field label="Status">
              <select className={selectCls} value={form.status} onChange={set('status')}>
                {['Active', 'Inactive'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
