'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    Briefcase,
    Calendar,
    Building2,
    Save,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeamFormData {
    fullName: string;
    email: string;
    role: string;
    department: string;
    joiningDate: string;
    currentProject: string;
    status: string;
}

const defaultForm: TeamFormData = {
    fullName: '',
    email: '',
    role: '',
    department: '',
    joiningDate: '',
    currentProject: '',
    status: 'Active',
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

function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
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
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white";

const selectCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white text-gray-600 cursor-pointer";

interface Props {
    onSave: (data: TeamFormData) => void;
    onClose: () => void;
    initialData?: Partial<TeamFormData>;
    mode?: 'add' | 'edit';
}

export default function AddTeamMemberForm({
    onSave,
    onClose,
    initialData,
    mode = 'add',
}: Props) {
    const [form, setForm] = useState<TeamFormData>({
        ...defaultForm,
        ...initialData,
    });

    const isEdit = mode === 'edit';

    const set =
        (key: keyof TeamFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, [key]: e.target.value }));
            };

    const handleReset = () => {
        setForm({ ...defaultForm, ...initialData });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <User size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isEdit ? 'Edit Team Member' : 'Add Team Member'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {isEdit
                                ? 'Update team member details'
                                : 'Add a new member to your team'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        <X size={14} /> Reset
                    </button>

                    <button
                        onClick={() => onSave(form)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <Save size={14} /> {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-xl border">
                    <SectionTitle icon={<User size={14} />} title="Basic Info" />

                    <div className="space-y-3">
                        <Field label="Full Name" required>
                            <input
                                className={inputCls}
                                value={form.fullName}
                                onChange={set('fullName')}
                            />
                        </Field>

                        <Field label="Email" required>
                            <input
                                type="email"
                                className={inputCls}
                                value={form.email}
                                onChange={set('email')}
                            />
                        </Field>

                        <Field label="Role" required>
                            <input
                                className={inputCls}
                                value={form.role}
                                onChange={set('role')}
                            />
                        </Field>
                    </div>
                </div>

                {/* Work Info */}
                <div className="bg-gray-50 p-4 rounded-xl border">
                    <SectionTitle icon={<Briefcase size={14} />} title="Work Info" />
                    <div className="space-y-3">
                        <Field label="Department">
                            <select
                                className={selectCls}
                                value={form.department}
                                onChange={set('department')}
                            >
                                <option value="">Select department</option>
                                {['Development', 'Design', 'Marketing', 'Media'].map((d) => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Joining Date">
                            <input
                                type="date"
                                className={inputCls}
                                value={form.joiningDate}
                                onChange={set('joiningDate')}
                            />
                        </Field>

                        <Field label="Current Project">
                            <select
                                className={selectCls}
                                value={form.currentProject}
                                onChange={set('currentProject')}
                            >
                                <option value="">Select current project</option>
                                {['CRM Dashboard', 'Website Redesign', 'Promo Video', 'API Integration', 'SEO Campaign'].map((p) => (
                                    <option key={p}>{p}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Status">
                            <select
                                className={selectCls}
                                value={form.status}
                                onChange={set('status')}
                            >
                                {['Active', 'On Leave', 'Inactive'].map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400">
                Team data is managed securely.
            </p>
        </div>
    );
}