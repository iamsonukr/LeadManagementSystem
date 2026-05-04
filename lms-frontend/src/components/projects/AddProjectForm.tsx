'use client';

import { useState } from 'react';
import { Briefcase, Calendar, DollarSign, Save, Target, User, X } from 'lucide-react';

export interface ProjectFormData {
  name: string;
  service: string;
  client: string;
  owner: string;
  startDate: string;
  deliveryDate: string;
  status: string;
  priority: string;
  budget: number;
  amountReceived: number;
  paymentStatus: string;
  lastMilestone: string;
}

const defaultForm: ProjectFormData = {
  name: '',
  service: '',
  client: '',
  owner: '',
  startDate: '',
  deliveryDate: '',
  status: 'Planning',
  priority: 'Medium',
  budget: 0,
  amountReceived: 0,
  paymentStatus: 'Advance Pending',
  lastMilestone: '',
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300';

interface Props {
  onSave: (data: ProjectFormData) => void;
  onClose: () => void;
  initialData?: Partial<ProjectFormData>;
  mode?: 'add' | 'edit';
  teamMembers?: string[];
}

export default function AddProjectForm({ onSave, onClose, initialData, mode = 'edit', teamMembers = [] }: Props) {
  const [form, setForm] = useState<ProjectFormData>({ ...defaultForm, ...initialData });
  const isEdit = mode === 'edit';

  const set = (key: keyof ProjectFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Briefcase size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Project' : 'Add Project'}</h2>
            <p className="text-xs text-gray-500">Update milestone, delivery, payment, and ownership details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <X size={14} /> Cancel
          </button>
          <button type="button" onClick={() => onSave(form)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-gray-50 p-4">
          <SectionTitle icon={<User size={14} />} title="Project Details" />
          <div className="space-y-3">
            <Field label="Project Name" required>
              <input className={inputCls} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Client" required>
              <input className={inputCls} value={form.client} onChange={set('client')} />
            </Field>
            <Field label="Service" required>
              <input className={inputCls} value={form.service} onChange={set('service')} />
            </Field>
            <Field label="Owner" required>
              <select className={inputCls} value={form.owner} onChange={set('owner')}>
                <option value="">Select team member</option>
                {teamMembers.map((member) => <option key={member} value={member}>{member}</option>)}
              </select>
            </Field>
            <Field label="Latest Milestone" required>
              <textarea className={`${inputCls} h-24 resize-none`} value={form.lastMilestone} onChange={set('lastMilestone')} />
            </Field>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <SectionTitle icon={<Calendar size={14} />} title="Delivery & Status" />
          <div className="space-y-3">
            <Field label="Start Date">
              <input type="date" className={inputCls} value={form.startDate} onChange={set('startDate')} />
            </Field>
            <Field label="Delivery Date">
              <input type="date" className={inputCls} value={form.deliveryDate} onChange={set('deliveryDate')} />
            </Field>
            <Field label="Status" required>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                {['Kickoff', 'Planning', 'In Progress', 'Review', 'Completed', 'On Hold'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority" required>
              <select className={inputCls} value={form.priority} onChange={set('priority')}>
                {['High', 'Medium', 'Low'].map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Status" required>
              <select className={inputCls} value={form.paymentStatus} onChange={set('paymentStatus')}>
                {['Advance Pending', 'Partially Paid', 'Paid', 'Overdue'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <SectionTitle icon={<DollarSign size={14} />} title="Financials" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget" required>
            <input
              type="number"
              className={inputCls}
              value={form.budget || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, budget: parseFloat(event.target.value) || 0 }))}
            />
          </Field>
          <Field label="Amount Received">
            <input
              type="number"
              className={inputCls}
              value={form.amountReceived || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, amountReceived: parseFloat(event.target.value) || 0 }))}
            />
          </Field>
        </div>
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Pending Balance</span>
            <span className="font-semibold text-amber-600">${Math.max(0, form.budget - form.amountReceived).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target size={14} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-800">What you can edit here</h3>
        </div>
        <p className="text-xs text-gray-600">
          Milestone, payment status, delivery date, owner, budget, and collected amount are all managed from the project side now.
        </p>
      </div>
    </div>
  );
}
