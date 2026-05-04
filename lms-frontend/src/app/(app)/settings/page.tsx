'use client';

import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import authService from '@/services/authService';
import integrationsService, { IntegrationPlatform } from '@/services/integrationsService';
import { useAppDispatch } from '@/hooks/redux';
import { fetchLeads } from '@/store/slices/leadsSlice';

const platforms: Array<{ id: IntegrationPlatform; title: string; desc: string }> = [
  { id: 'trade-india', title: 'Trade India', desc: 'Import enquiry leads from Trade India.' },
  { id: 'whatsapp', title: 'WhatsApp', desc: 'Sync conversation-based leads from WhatsApp.' },
  { id: 'facebook', title: 'Facebook', desc: 'Fetch leads from Facebook forms and campaigns.' },
  { id: 'linkedin', title: 'LinkedIn', desc: 'Pull prospect leads captured from LinkedIn.' },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncingPlatform, setSyncingPlatform] = useState<IntegrationPlatform | null>(null);
  const [integrationError, setIntegrationError] = useState('');
  const [integrationSuccess, setIntegrationSuccess] = useState('');

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Unable to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPlatform = async (platform: IntegrationPlatform) => {
    setIntegrationError('');
    setIntegrationSuccess('');
    setSyncingPlatform(platform);

    try {
      const result = await integrationsService.importPlatformLeads(platform, 50);
      setIntegrationSuccess(
        `${result.imported} lead(s) imported from ${platforms.find((item) => item.id === platform)?.title}.`
        + (result.failed > 0 ? ` ${result.failed} failed.` : '')
      );
      dispatch(fetchLeads({ limit: 100 }));
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setIntegrationError(axiosErr.response?.data?.message || (err as Error).message || 'Failed to sync leads.');
    } finally {
      setSyncingPlatform(null);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Settings</h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          { title: 'General Settings', desc: 'Configure your LMS system preferences' },
          { title: 'Notifications', desc: 'Configure email and push notifications' },
        ].map((s) => (
          <div key={s.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-gray-800">{s.title}</h3>
            <p className="text-xs text-gray-500">{s.desc}</p>
          </div>
        ))}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800">Integrations</h3>
          <p className="mt-1 text-xs text-gray-500">Fetch and import leads from connected platforms.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {platforms.map((platform) => (
              <div key={platform.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-sm font-semibold text-gray-800">{platform.title}</div>
                <div className="mt-1 text-xs text-gray-500">{platform.desc}</div>
                <button
                  type="button"
                  onClick={() => handleSyncPlatform(platform.id)}
                  disabled={syncingPlatform !== null}
                  className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {syncingPlatform === platform.id ? 'Syncing...' : 'Fetch Leads'}
                </button>
              </div>
            ))}
          </div>

          {integrationError ? (
            <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{integrationError}</p>
          ) : null}
          {integrationSuccess ? (
            <p className="mt-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-600">{integrationSuccess}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800">Security</h3>
          <p className="mt-1 text-xs text-gray-500">Change your account password.</p>

          <form onSubmit={handleChangePassword} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </label>

            <div className="md:col-span-3">
              {error ? (
                <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}
              {success ? (
                <p className="mb-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-600">{success}</p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
