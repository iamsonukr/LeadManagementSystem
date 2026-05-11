'use client';

import { useState } from 'react';
import { Calendar, MessageSquare, Save, User, X } from 'lucide-react';
import { FollowUpRecord, LeadPriority } from '@/types';

export interface FollowUpFormData {
  leadId: string;
  leadName: string;
  company: string;
  owner: string;
  type: FollowUpRecord['type'];
  status: FollowUpRecord['status'];
  priority: LeadPriority;
  dueAt: string;
  notes: string;
  nextAction: string;
}

const defaultForm: FollowUpFormData = {
  leadId: '',
  leadName: '',
  company: '',
  owner: '',
  type: 'Call',
  status: 'Pending',
  priority: 'Medium',
  dueAt: '',
  notes: '',
  nextAction: '',
};

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300';

function getTodayDateInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

interface Props {
  onSave: (data: FollowUpFormData) => void;
  onClose: () => void;
  initialData?: Partial<FollowUpFormData>;
  mode?: 'add' | 'edit';
  teamMembers?: string[];
}

export default function AddFollowUpForm({ onSave, onClose, initialData, mode = 'add', teamMembers = [] }: Props) {
  const [form, setForm] = useState<FollowUpFormData>({
    ...defaultForm,
    dueAt: new Date().toISOString().slice(0, 16),
    ...initialData,
  });
  const todayDate = getTodayDateInputValue();
  const todayDateTimeMin = `${todayDate}T00:00`;

  const set = (key: keyof FollowUpFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSave = () => {
    // if (form.dueAt && form.dueAt.slice(0, 10) < todayDate) {
    //   alert('Follow-up date cannot be in the past.');
    //   return;
    // }

    onSave(form);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Calendar size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{mode === 'edit' ? 'Edit Follow Up' : 'Add Follow Up'}</h2>
            <p className="text-xs text-gray-500">Track a planned action separately from the lead record</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <X size={14} /> Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <User size={14} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-800">Lead Context</h3>
          </div>
          <div className="space-y-3">
            <Field label="Lead Name">
              <input className={inputCls} value={form.leadName} onChange={set('leadName')} />
            </Field>
            <Field label="Company">
              <input className={inputCls} value={form.company} onChange={set('company')} />
            </Field>
            <Field label="Owner">
              <select className={inputCls} value={form.owner} onChange={set('owner')}>
                <option value="">Select team member</option>
                {teamMembers.map((member) => <option key={member} value={member}>{member}</option>)}
              </select>
            </Field>
            <Field label="Due At">
              <input type="datetime-local" min={todayDateTimeMin} className={inputCls} value={form.dueAt} onChange={set('dueAt')} />
            </Field>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <MessageSquare size={14} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-800">Follow-Up Details</h3>
          </div>
          <div className="space-y-3">
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={set('type')}>
                {['Call', 'Email', 'WhatsApp', 'Meeting', 'Demo', 'Proposal', 'Other'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={set('status')}>
                {['Pending', 'Completed', 'Overdue', 'Rescheduled'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={set('priority')}>
                {['High', 'Medium', 'Low'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={`${inputCls} h-20 resize-none`} value={form.notes} onChange={set('notes')} />
            </Field>
            <Field label="Next Action">
              <input className={inputCls} value={form.nextAction} onChange={set('nextAction')} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
