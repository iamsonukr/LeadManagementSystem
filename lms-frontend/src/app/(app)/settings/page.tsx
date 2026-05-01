export default function SettingsPage() {
  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <div className="grid grid-cols-2 gap-5">
        {[
          { title: 'General Settings', desc: 'Configure your LMS system preferences' },
          { title: 'Integrations', desc: 'Connect Trade India, WhatsApp, Facebook' },
          { title: 'Notifications', desc: 'Configure email and push notifications' },
          { title: 'Security', desc: 'Manage passwords and 2FA' },
        ].map(s => (
          <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md cursor-pointer transition-shadow">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
