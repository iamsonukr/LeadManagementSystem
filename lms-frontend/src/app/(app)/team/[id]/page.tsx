'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, Star, Edit, Trash2, Plus } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const lead = useAppSelector(s => s.leads.leads.find(l => l.id === id));
  const calls = useAppSelector(s => s.calls.calls.filter(c => c.leadId === id));

  if (!lead) return (
    <div className="p-6">
      <Link href="/leads" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm mb-4">
        <ArrowLeft size={14} /> Back to Leads
      </Link>
      <div className="bg-white rounded-xl p-10 text-center text-gray-400">Lead not found.</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/leads" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm">
          <ArrowLeft size={14} /> Back to Leads
        </Link>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg hover:bg-gray-50">
            <Edit size={13} /> Edit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-600 bg-white rounded-lg hover:bg-red-50">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Lead Info */}
        <div className="col-span-2 space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {lead.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
                  <p className="text-sm text-gray-500">{lead.company}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={lead.status} />
                    <PriorityBadge priority={lead.priority} />
                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <Star size={11} className="fill-yellow-500" /> {lead.aiScore}/10
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700">
                  <Phone size={12} /> Log Call
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Mail size={12} /> Send Email
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Details</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Email', lead.email],
                ['Phone', lead.phone],
                ['Source', lead.source],
                ['Industry', lead.industry || '—'],
                ['Company Size', lead.companySize || '—'],
                ['Budget', lead.budget ? formatCurrency(lead.budget, lead.currency) : '—'],
                ['Assigned To', lead.assignedTo || '—'],
                ['Department', lead.department || '—'],
                ['Tags', lead.tags.join(', ') || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-gray-700">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Call History */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Call History ({calls.length})</h3>
              <button className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50">
                <Plus size={12} /> Log Call
              </button>
            </div>
            {calls.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No calls logged yet.</p>
            ) : (
              <div className="space-y-3">
                {calls.map(call => (
                  <div key={call.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${call.status === 'Connected' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Phone size={14} className={call.status === 'Connected' ? 'text-green-600' : 'text-red-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{call.status}</span>
                        <span className="text-xs text-gray-400">{formatDate(call.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{call.notes}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400">{call.direction} · {call.duration} min · {call.calledBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* AI Score */}
          {/* <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
            <div className="text-xs font-medium opacity-80 mb-1">AI Lead Score</div>
            <div className="text-4xl font-bold">{lead.aiScore}<span className="text-lg opacity-60">/10</span></div>
            <div className="mt-2 text-xs opacity-70">Based on budget, source, response time & company size</div>
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${lead.aiScore * 10}%` }} />
            </div>
          </div> */}

          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Address</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {lead.address.line1}<br />
              {lead.address.city}, {lead.address.state} {lead.address.postalCode}<br />
              {lead.address.country}
            </p>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Notes</h3>
              <p className="text-sm text-gray-600">{lead.notes}</p>
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              {[
                ['Total Calls', lead.callCount],
                ['Created', formatDate(lead.createdAt)],
                ['Last Updated', formatDate(lead.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
