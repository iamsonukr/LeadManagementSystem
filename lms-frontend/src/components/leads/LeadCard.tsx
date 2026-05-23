'use client';

import Link from 'next/link';
import { Building2, Calendar, DollarSign, Globe, Mail, Phone } from 'lucide-react';
import { Lead } from '@/types';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  const leadValue = lead.leadValue || lead.budget;
  const originDomain = lead.metadata?.originDomain;

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/leads/${lead.id}`}
            className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
          >
            {lead.name || 'Website Lead'}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>
        {originDomain && (
          <span className="inline-flex max-w-32 items-center gap-1 truncate rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            <Globe size={11} className="shrink-0" />
            <span className="truncate">{originDomain}</span>
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-xs text-gray-500">
        {lead.company && (
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-gray-300" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-gray-300" />
            <a href={`mailto:${lead.email}`} className="truncate hover:text-indigo-600">
              {lead.email}
            </a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-gray-300" />
            <a href={`tel:${lead.phone}`} className="truncate hover:text-indigo-600">
              {lead.phone}
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs">
        <div>
          <div className="flex items-center gap-1 text-gray-400">
            <DollarSign size={12} />
            Value
          </div>
          <div className="mt-1 font-semibold text-gray-800">
            {formatCurrency(leadValue, lead.currency || 'USD')}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={12} />
            Follow Up
          </div>
          <div className="mt-1 font-semibold text-gray-800">
            {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not set'}
          </div>
        </div>
      </div>

      {lead.notes && (
        <p className="mt-3 line-clamp-2 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
          {lead.notes}
        </p>
      )}
    </article>
  );
}
