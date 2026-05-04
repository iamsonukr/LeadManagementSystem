'use client';

import { Copy, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { ProjectRecord } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceGeneratorProps {
  project: ProjectRecord;
}

export default function InvoiceGenerator({ project }: InvoiceGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const balance = project.budget - project.amountReceived;
  const invoiceDate = new Date().toLocaleDateString();
  const invoiceNumber = `INV-${project.id.toUpperCase()}-${new Date().getFullYear()}`;
  const services = project.services.join(', ') || 'Not captured';

  const invoiceText = `INVOICE
${invoiceNumber}

Client: ${project.client}
Project: ${project.name}
Service: ${services}
Owner: ${project.owner}
Invoice Date: ${invoiceDate}
Start Date: ${formatDate(project.startDate)}
Delivery Date: ${project.deliveryDate ? formatDate(project.deliveryDate) : 'TBD'}

Budget: ${formatCurrency(project.budget)}
Amount Received: ${formatCurrency(project.amountReceived)}
Outstanding Balance: ${formatCurrency(balance)}
Payment Status: ${project.paymentStatus}

Latest Milestone: ${project.lastMilestone}
Lead Source: ${project.source}
`;

  const handleCopyInvoice = async () => {
    await navigator.clipboard.writeText(invoiceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '', 'height=700,width=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
            .wrapper { max-width: 820px; margin: 0 auto; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 28px; }
            .title { font-size: 28px; font-weight: 700; }
            .meta { color: #6b7280; margin-top: 6px; }
            .section { margin-bottom: 28px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .summary { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <div class="title">Invoice</div>
              <div class="meta">${invoiceNumber} | ${invoiceDate}</div>
            </div>
            <div class="section grid">
              <div>
                <div class="label">Client</div>
                <div class="value">${project.client}</div>
              </div>
              <div>
                <div class="label">Project</div>
                <div class="value">${project.name}</div>
              </div>
              <div>
                <div class="label">Service</div>
                <div class="value">${services}</div>
              </div>
              <div>
                <div class="label">Owner</div>
                <div class="value">${project.owner}</div>
              </div>
            </div>
            <div class="section summary">
              <div class="row"><span>Budget</span><strong>${formatCurrency(project.budget)}</strong></div>
              <div class="row"><span>Amount Received</span><strong>${formatCurrency(project.amountReceived)}</strong></div>
              <div class="row"><span>Outstanding Balance</span><strong>${formatCurrency(balance)}</strong></div>
              <div class="row"><span>Payment Status</span><strong>${project.paymentStatus}</strong></div>
            </div>
            <div class="section grid">
              <div>
                <div class="label">Start Date</div>
                <div class="value">${formatDate(project.startDate)}</div>
              </div>
              <div>
                <div class="label">Delivery Date</div>
                <div class="value">${project.deliveryDate ? formatDate(project.deliveryDate) : 'TBD'}</div>
              </div>
              <div>
                <div class="label">Lead Source</div>
                <div class="value">${project.source}</div>
              </div>
              <div>
                <div class="label">Latest Milestone</div>
                <div class="value">${project.lastMilestone}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(invoiceText)}`;
    element.download = `${invoiceNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <FileText size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Invoice Generator</h2>
          <p className="text-xs text-gray-500">Generate a quick invoice summary for this project</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6 border-b-2 border-gray-300 pb-4 text-center">
          <p className="text-sm font-semibold text-gray-600">INVOICE</p>
          <p className="text-xl font-bold text-gray-900">{invoiceNumber}</p>
          <p className="mt-1 text-xs text-gray-500">{invoiceDate}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-600">Client</p>
            <p className="text-sm font-medium text-gray-900">{project.client}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-gray-600">Project</p>
            <p className="text-sm font-medium text-gray-900">{project.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-600">Service</p>
            <p className="text-sm font-medium text-gray-900">{services}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-gray-600">Owner</p>
            <p className="text-sm font-medium text-gray-900">{project.owner}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Budget</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(project.budget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount Received</span>
            <span className="text-sm font-semibold text-green-600">{formatCurrency(project.amountReceived)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Balance</span>
            <span className={`text-sm font-semibold ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(balance))}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-semibold text-gray-900">Payment Status</span>
            <span className="text-sm font-bold text-gray-900">{project.paymentStatus}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-xs text-gray-600">
          <span>Start: {formatDate(project.startDate)}</span>
          <span>Delivery: {project.deliveryDate ? formatDate(project.deliveryDate) : 'TBD'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={handleCopyInvoice} className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
          <Copy size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handlePrintInvoice} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
          <FileText size={14} />
          Print
        </button>
        <button onClick={handleDownload} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  );
}
