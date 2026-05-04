'use client';

import { useState } from 'react';
import { User, Phone, Mail, Building2, Target, MessageSquare, MapPin, Briefcase, Calendar, X, Save } from 'lucide-react';
import { leadStatusOptions, serviceCategoryOptions } from '@/lib/crm';
import { cn } from '@/lib/utils';

export interface LeadFormData {
  fullName: string; phoneNumber: string; email: string; company: string;
  leadSource: string; leadStatus: string; priority: string; leadType: string;
  contactMethod: string; bestTime: string; doNotContact: boolean; emailOptIn: boolean;
  address1: string; address2: string; city: string; state: string; postal: string; country: string;
  industry: string; companySize: string; budget: string; currency: string; leadValue: string; notes: string;
  followUpDate: string; followUpTime: string; assignedTo: string; department: string;
  expectedCloseDate: string; services: string; nextAction: string; reminder: string; tags: string; additionalInfo: string;
}

const defaultForm: LeadFormData = {
  fullName: '', phoneNumber: '', email: '', company: '',
  leadSource: '', leadStatus: 'New', priority: 'Medium', leadType: '',
  contactMethod: '', bestTime: '', doNotContact: false, emailOptIn: true,
  address1: '', address2: '', city: '', state: '', postal: '', country: '',
  industry: '', companySize: '', budget: '', currency: 'USD', leadValue: '', notes: '',
  followUpDate: '', followUpTime: '', assignedTo: '', department: '',
  expectedCloseDate: '', services: '', nextAction: '', reminder: '', tags: '', additionalInfo: '',
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">{icon}</div>
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

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-gray-300 bg-white transition-all";
const selectCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white text-gray-600 appearance-none cursor-pointer";

function getTodayDateInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

interface AddLeadFormProps {
  onSave: (data: LeadFormData) => void;
  onReset: () => void;
  initialData?: Partial<LeadFormData>;
  mode?: 'add' | 'edit';
  teamMembers?: string[];
}

export default function AddLeadForm({ onSave, onReset, initialData, mode = 'add', teamMembers = [] }: AddLeadFormProps) {
  const [form, setForm] = useState<LeadFormData>({ ...defaultForm, ...initialData });
  const isEdit = mode === 'edit';
  const todayDate = getTodayDateInputValue();

  const set = (key: keyof LeadFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const toggleService = (service: string) => {
    const selected = form.services.split(',').map((item) => item.trim()).filter(Boolean);
    const next = selected.includes(service)
      ? selected.filter((item) => item !== service)
      : [...selected, service];

    setForm((prev) => ({ ...prev, services: next.join(', ') }));
  };

  const handleReset = () => { setForm({ ...defaultForm, ...initialData }); onReset(); };

  const handleSave = () => {
    if (form.followUpDate && form.followUpDate < todayDate) {
      alert('Next follow-up date cannot be in the past.');
      return;
    }

    onSave(form);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between sticky top-0 bg-white pb-3 border-b border-gray-100 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h2>
            <p className="text-xs text-gray-500">{isEdit ? 'Update lead details and assignment' : 'Enter lead details to add a new potential customer'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={14} /> {isEdit ? 'Cancel' : 'Reset'}
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
            <Save size={14} /> {isEdit ? 'Update Lead' : 'Save Lead'}
          </button>
        </div>
      </div>

      {/* Row 1: Basic + Lead Details + Contact Prefs */}
      <div className="grid grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<User size={14} />} title="Basic Information" />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full Name" required>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input className={cn(inputCls, 'pl-8')} placeholder="Enter full name" value={form.fullName} onChange={set('fullName')} />
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Phone Number" required>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input className={cn(inputCls, 'pl-8')} placeholder="Enter phone number" value={form.phoneNumber} onChange={set('phoneNumber')} />
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Email Address">
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input className={cn(inputCls, 'pl-8')} placeholder="Enter email address" value={form.email} onChange={set('email')} type="email" />
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Company Name">
                <div className="relative">
                  <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input className={cn(inputCls, 'pl-8')} placeholder="Enter company name" value={form.company} onChange={set('company')} />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<Target size={14} />} title="Lead Details" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lead Source" required>
              <select className={selectCls} value={form.leadSource} onChange={set('leadSource')}>
                <option value="">Select lead source</option>
                {['Website', 'Referral', 'Social Media', 'Paid Ads', 'Email Campaign', 'Trade India', 'WhatsApp', 'Facebook', 'LinkedIn', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Lead Status" required>
              <select className={selectCls} value={form.leadStatus} onChange={set('leadStatus')}>
                {leadStatusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
            <Field label="Priority" required>
              <select className={selectCls} value={form.priority} onChange={set('priority')}>
                {['Low', 'Medium', 'High'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Lead Type">
              <select className={selectCls} value={form.leadType} onChange={set('leadType')}>
                <option value="">Select lead type</option>
                {['Individual', 'Business', 'Enterprise', 'Startup'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Interested Services">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {serviceCategoryOptions.map((service) => {
                      const selected = form.services.split(',').map((item) => item.trim()).filter(Boolean).includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                            selected
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                          )}
                        >
                          {service}
                        </button>
                      );
                    })}
                  </div>
                  <input className={inputCls} placeholder="Selected services" value={form.services} onChange={set('services')} />
                  <p className="text-xs text-gray-400">
                    Allowed categories: Website, Google SEO, Sales CRM, Mobile Application, Social Media Marketing, Google Ads, Meta Ads, YouTube Ads, Corporate Film, Product Film, Other.
                  </p>
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Requirement / Notes">
                <textarea className={cn(inputCls, 'resize-none h-16')} placeholder="Enter requirement or additional notes about the lead..." value={form.notes} onChange={set('notes')} />
              </Field>
            </div>
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<MessageSquare size={14} />} title="Contact Preferences" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preferred Contact Method">
              <select className={selectCls} value={form.contactMethod} onChange={set('contactMethod')}>
                <option value="">Select method</option>
                {['Phone', 'Email', 'WhatsApp', 'Video Call', 'In-Person'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Best Time to Contact">
              <select className={selectCls} value={form.bestTime} onChange={set('bestTime')}>
                <option value="">Select time</option>
                {['Morning (9-12)', 'Afternoon (12-5)', 'Evening (5-8)', 'Anytime'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Do Not Contact">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.doNotContact} onChange={set('doNotContact')} className="w-4 h-4 rounded border-gray-300 accent-indigo-600" />
                  <span className="text-xs text-gray-500">Do not contact this lead</span>
                </label>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Email Opt-in">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.emailOptIn} onChange={set('emailOptIn')} className="w-4 h-4 rounded border-gray-300 accent-indigo-600" />
                  <span className={cn('text-xs', form.emailOptIn ? 'text-green-600 font-medium' : 'text-gray-500')}>
                    {form.emailOptIn ? 'Allowed to send emails' : 'Not opted in'}
                  </span>
                </label>
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Address + Business + Follow Up */}
      <div className="grid grid-cols-3 gap-6">
        {/* Address */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<MapPin size={14} />} title="Address Information" />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Address Line 1"><input className={inputCls} placeholder="Enter address line 1" value={form.address1} onChange={set('address1')} /></Field></div>
            <div className="col-span-2"><Field label="Address Line 2"><input className={inputCls} placeholder="Enter address line 2 (optional)" value={form.address2} onChange={set('address2')} /></Field></div>
            <Field label="City"><input className={inputCls} placeholder="Enter city" value={form.city} onChange={set('city')} /></Field>
            <Field label="State / Province"><input className={inputCls} placeholder="Enter state or province" value={form.state} onChange={set('state')} /></Field>
            <Field label="Postal / Zip Code"><input className={inputCls} placeholder="Enter postal code" value={form.postal} onChange={set('postal')} /></Field>
            <Field label="Country">
              <select className={selectCls} value={form.country} onChange={set('country')}>
                <option value="">Select country</option>
                {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<Briefcase size={14} />} title="Business Information" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <select className={selectCls} value={form.industry} onChange={set('industry')}>
                <option value="">Select industry</option>
                {['Technology', 'IT Services', 'Finance', 'Education', 'Healthcare', 'Retail', 'Marketing', 'Manufacturing', 'Real Estate', 'Other'].map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Company Size">
              <select className={selectCls} value={form.companySize} onChange={set('companySize')}>
                <option value="">Select size</option>
                {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Budget"><input className={inputCls} placeholder="Enter budget amount" value={form.budget} onChange={set('budget')} type="number" /></Field>
            <Field label="Expected Deal Value"><input className={inputCls} placeholder="Enter total deal value" value={form.leadValue} onChange={set('leadValue')} type="number" /></Field>
            <Field label="Currency">
              <select className={selectCls} value={form.currency} onChange={set('currency')}>
                {['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Follow Up & Assignment */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<Calendar size={14} />} title="Follow Up & Assignment" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Next Follow-up Date"><input className={inputCls} type="date" min={todayDate} value={form.followUpDate} onChange={set('followUpDate')} /></Field>
            <Field label="Follow-up Time"><input className={inputCls} type="time" value={form.followUpTime} onChange={set('followUpTime')} /></Field>
            <Field label="Assigned To" required>
              <select className={selectCls} value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Select team member</option>
                {teamMembers.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select className={selectCls} value={form.department} onChange={set('department')}>
                <option value="">Select department</option>
                {['Sales', 'Enterprise', 'Marketing', 'Support'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Expected Close Date"><input className={inputCls} type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} /></Field>
            <div className="col-span-2">
              <Field label="Next Action">
                <input className={inputCls} placeholder="What should happen next?" value={form.nextAction} onChange={set('nextAction')} />
              </Field>
            </div>
            <Field label="Reminder">
              <select className={selectCls} value={form.reminder} onChange={set('reminder')}>
                <option value="">Select reminder</option>
                {['1 hour before', '1 day before', '1 week before'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Tags"><input className={inputCls} placeholder="e.g. VIP, Hot Lead" value={form.tags} onChange={set('tags')} /></Field>
          </div>
        </div>
      </div>

      {/* Row 3: Additional Info + Quick Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <SectionTitle icon={<MessageSquare size={14} />} title="Additional Information" />
          <textarea className={cn(inputCls, 'resize-none h-28')} placeholder="Add any other information that might be helpful..." value={form.additionalInfo} onChange={set('additionalInfo')} />
        </div>

        {/* Quick Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare size={14} className="text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Quick Summary</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Lead Status', value: form.leadStatus || 'New', cls: 'bg-blue-100 text-blue-700' },
              { label: 'Priority', value: form.priority || 'Medium', cls: 'bg-yellow-100 text-yellow-700' },
              { label: 'Source', value: form.leadSource || 'Not Selected', cls: 'bg-gray-100 text-gray-600' },
              { label: 'Assigned To', value: form.assignedTo || 'Not Assigned', cls: 'bg-gray-100 text-gray-600' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  {label}
                </div>
                <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', cls)}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer notice */}
      <p className="text-center text-xs text-gray-400 pb-2">
        All lead information is secure and will be used in accordance with our <span className="text-indigo-500 cursor-pointer">privacy policy</span>.
      </p>
    </div>
  );
}
