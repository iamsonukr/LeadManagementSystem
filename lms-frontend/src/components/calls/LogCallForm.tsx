'use client';

import { useState } from 'react';
import { Phone, Clock, ArrowUpRight, Save, X } from 'lucide-react';
import { CallDirection, CallStatus } from '@/types';
import { cn } from '@/lib/utils';

export interface CallFormData {
  leadId: string;
  leadName: string;
  leadCompany: string;
  status: CallStatus;
  direction: CallDirection;
  duration: number;
  calledBy: string;
  callDate: string;
  discussionPoints: string;
  nextAction: string;
  followUpDate: string;
  callbackDate: string;
  notes: string;
}

const defaultForm: CallFormData = {
  leadId: '',
  leadName: '',
  leadCompany: '',
  status: 'Connected',
  direction: 'Outgoing',
  duration: 0,
  calledBy: '',
  callDate: '',
  discussionPoints: '',
  nextAction: '',
  followUpDate: '',
  callbackDate: '',
  notes: '',
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

function getTodayDateInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

interface Props {
  onSave: (data: CallFormData) => void;
  initialData?: Partial<CallFormData>;
  mode?: 'add' | 'edit';
  teamMembers?: string[];
}

export default function LogCallForm({ onSave, initialData, mode = 'add', teamMembers = [] }: Props) {
  const [form, setForm] = useState<CallFormData>({
    ...defaultForm,
    callDate: new Date().toISOString().slice(0, 16),
    ...initialData,
  });

  const isEdit = mode === 'edit';
  const todayDate = getTodayDateInputValue();
  const todayDateTimeMin = `${todayDate}T00:00`;

  const set = (key: keyof CallFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = key === 'duration' ? Number(e.target.value) : e.target.value;
      setForm(prev => ({ ...prev, [key]: value }));
    };

  const handleReset = () => {
    setForm({ ...defaultForm, callDate: new Date().toISOString().slice(0, 16), ...initialData });
  };

  const handleSave = () => {
    if (form.followUpDate && form.followUpDate.slice(0, 10) < todayDate) {
      alert('Next follow-up date cannot be in the past.');
      return;
    }

    onSave(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Phone size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Update Call' : 'Log a Call'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Edit recent call details' : 'Capture call notes and outcome'}
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
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Save size={14} /> {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<Clock size={14} />} title="Call Information" />
          <div className="space-y-3">
            <Field label="Lead Name" required>
              <input className={inputCls} value={form.leadName} onChange={set('leadName')} />
            </Field>
            <Field label="Company">
              <input className={inputCls} value={form.leadCompany} onChange={set('leadCompany')} />
            </Field>
            <Field label="Called By" required>
              <select className={inputCls} value={form.calledBy} onChange={set('calledBy')}>
                <option value="">Select team member</option>
                {teamMembers.map((member) => <option key={member} value={member}>{member}</option>)}
              </select>
            </Field>
            <Field label="Status" required>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                {['Connected', 'Not Answered', 'Busy', 'Callback Scheduled', 'Wrong Number', 'Voicemail'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Direction" required>
              <select className={inputCls} value={form.direction} onChange={set('direction')}>
                {['Outgoing', 'Incoming'].map(direction => (
                  <option key={direction} value={direction}>{direction}</option>
                ))}
              </select>
            </Field>
            <Field label="Call Time" required>
              <input type="datetime-local" className={inputCls} value={form.callDate} onChange={set('callDate')} />
            </Field>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <SectionTitle icon={<ArrowUpRight size={14} />} title="Call Details" />
          <div className="space-y-3">
            <Field label="Duration (min)">
              <input type="number" min="0" className={inputCls} value={form.duration} onChange={set('duration')} />
            </Field>
            <Field label="Callback Date">
              <input type="date" className={inputCls} value={form.callbackDate} onChange={set('callbackDate')} />
            </Field>
            <Field label="Next Follow-Up">
              <input type="datetime-local" min={todayDateTimeMin} className={inputCls} value={form.followUpDate} onChange={set('followUpDate')} />
            </Field>
            <Field label="Things Discussed">
              <textarea className={cn(inputCls, 'h-24 resize-none')} value={form.discussionPoints} onChange={set('discussionPoints')} />
            </Field>
            <Field label="Next Action">
              <input className={inputCls} value={form.nextAction} onChange={set('nextAction')} />
            </Field>
            <Field label="Notes">
              <textarea className={cn(inputCls, 'h-28 resize-none')} value={form.notes} onChange={set('notes')} />
            </Field>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400">Use this form to capture completed calls or schedule call callbacks.</div>
    </div>
  );
}
