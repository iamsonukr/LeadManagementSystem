'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, FileText, FolderKanban, PenLine } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import AddProjectForm, { ProjectFormData } from '@/components/projects/AddProjectForm';
import Modal from '@/components/ui/Modal';
import InvoiceGenerator from '@/components/projects/InvoiceGenerator';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { deriveProjectsFromLeads } from '@/lib/crm';
import { exportRowsToCsv } from '@/lib/export';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProjectRecord } from '@/types';
import { upsertProject } from '@/store/slices/projectsSlice';

export default function ProjectPage() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.leads);
  const storedProjects = useAppSelector((state) => state.projects.projects);
  const projects = deriveProjectsFromLeads(leads, storedProjects);
  const [invoiceProject, setInvoiceProject] = useState<ProjectRecord | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);

  const projectToFormData = (project: ProjectRecord): ProjectFormData => ({
    name: project.name,
    service: project.service,
    client: project.client,
    owner: project.owner,
    startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
    deliveryDate: project.deliveryDate ? new Date(project.deliveryDate).toISOString().slice(0, 10) : '',
    status: project.status,
    priority: project.priority,
    budget: project.budget,
    amountReceived: project.amountReceived,
    paymentStatus: project.paymentStatus,
    lastMilestone: project.lastMilestone,
  });

  const handleSaveProject = (data: ProjectFormData) => {
    if (!editingProject) return;
    dispatch(upsertProject({
      ...editingProject,
      name: data.name,
      service: data.service,
      client: data.client,
      owner: data.owner,
      status: data.status as ProjectRecord['status'],
      priority: data.priority as ProjectRecord['priority'],
      budget: data.budget,
      amountReceived: data.amountReceived,
      startDate: data.startDate ? new Date(`${data.startDate}T00:00:00`).toISOString() : editingProject.startDate,
      deliveryDate: data.deliveryDate ? new Date(`${data.deliveryDate}T00:00:00`).toISOString() : undefined,
      paymentStatus: data.paymentStatus as ProjectRecord['paymentStatus'],
      lastMilestone: data.lastMilestone,
    }));
    setEditingProject(null);
  };

  const exportProjects = () => {
    exportRowsToCsv(
      'project-handover.csv',
      ['Project', 'Client', 'Service', 'Status', 'Priority', 'Budget', 'Amount Received', 'Payment Status', 'Owner', 'Start Date', 'Delivery Date', 'Lead Source', 'Milestone'],
      projects.map((project) => [
        project.name,
        project.client,
        project.service,
        project.status,
        project.priority,
        project.budget,
        project.amountReceived,
        project.paymentStatus,
        project.owner,
        formatDate(project.startDate),
        project.deliveryDate ? formatDate(project.deliveryDate) : '',
        project.source,
        project.lastMilestone,
      ])
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Won leads should land here with delivery ownership, payment visibility, and the latest milestone.
          </p>
        </div>
        <button
          onClick={exportProjects}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active Projects</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{projects.length}</div>
          <div className="mt-1 text-xs text-gray-500">Won deals in delivery</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Booked Revenue</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(projects.reduce((sum, project) => sum + project.budget, 0))}
          </div>
          <div className="mt-1 text-xs text-gray-500">Total project value after conversion</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cash Collected</div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(projects.reduce((sum, project) => sum + project.amountReceived, 0))}
          </div>
          <div className="mt-1 text-xs text-gray-500">Payments already received</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pending Advances</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {projects.filter((project) => project.paymentStatus === 'Advance Pending').length}
          </div>
          <div className="mt-1 text-xs text-gray-500">Projects waiting on kickoff payment</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-gray-50">
              <tr>
                {['Project', 'Client', 'Service', 'Status', 'Priority', 'Budget', 'Received', 'Payment', 'Owner', 'Start', 'Delivery', 'Lead Source', 'Milestone', 'Actions'].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-gray-100 hover:bg-indigo-50/30">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <FolderKanban size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.name}</div>
                        <Link href={`/leads/${project.leadId}`} className="mt-1 inline-block text-xs text-indigo-600 hover:text-indigo-700">
                          View source lead
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.client}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.service}</td>
                  <td className="px-4 py-4"><StatusBadge status={project.status} /></td>
                  <td className="px-4 py-4"><PriorityBadge priority={project.priority} /></td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(project.budget)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-green-600">{formatCurrency(project.amountReceived)}</td>
                  <td className="px-4 py-4"><StatusBadge status={project.paymentStatus} /></td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.owner}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatDate(project.startDate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.deliveryDate ? formatDate(project.deliveryDate) : 'TBD'}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.source}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.lastMilestone}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProject(project)}
                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                      >
                        <PenLine size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setInvoiceProject(project)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        <FileText size={14} />
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-sm text-gray-400">
                    No projects yet. Move a lead to `Won` to create a delivery handoff row.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!invoiceProject} onClose={() => setInvoiceProject(null)} title="" subtitle="" size="lg">
        {invoiceProject && <InvoiceGenerator project={invoiceProject} />}
      </Modal>
      <Modal open={!!editingProject} onClose={() => setEditingProject(null)} title="" subtitle="" size="lg">
        {editingProject && (
          <AddProjectForm
            mode="edit"
            initialData={projectToFormData(editingProject)}
            onSave={handleSaveProject}
            onClose={() => setEditingProject(null)}
          />
        )}
      </Modal>
    </div>
  );
}
