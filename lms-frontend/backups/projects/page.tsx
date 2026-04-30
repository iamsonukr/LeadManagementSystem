'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddProjectForm, { ProjectFormData } from '@/components/projects/AddProjectForm';
import InvoiceGenerator from '@/components/projects/InvoiceGenerator';

export default function ProjectsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectList, setProjectList] = useState([
    {
      id: "1",
      name: "CRM Dashboard",
      category: "Web App",
      client: "Tech Corp",
      assigned: ["John", "Rohit"],
      started: "01 Apr 2026",
      // deadline: "30 Apr 2026",
      status: "In Progress",
      priority: "High",
      budget: 50000,
      amountPaid: 25000,
      amountReceived: 30000,
    },
    {
      id: "2",
      name: "Company Portfolio",
      category: "Website",
      client: "Startup Hub",
      assigned: ["Mike", "Ravi"],
      started: "15 Mar 2026",
      // deadline: "25 Apr 2026",
      status: "Review",
      priority: "Medium",
      budget: 35000,
      amountPaid: 35000,
      amountReceived: 35000,
    },
    {
      id: "3",
      name: "Promo Video",
      category: "Video Editing",
      client: "Media House",
      assigned: ["Anjali"],
      started: "10 Apr 2026",
      // deadline: "20 Apr 2026",
      status: "Completed",
      priority: "Low",
      budget: 15000,
      amountPaid: 15000,
      amountReceived: 15000,
    },
  ]);

  const handleSaveProject = (data: ProjectFormData) => {
    setProjectList(prev => [
      {
        id: `p${Date.now()}`,
        name: data.name,
        category: data.category,
        client: data.client,
        assigned: data.assigned.split(',').map(item => item.trim()).filter(Boolean),
        started: data.started || 'TBD',
        // deadline: data.deadline || 'TBD',
        status: data.status,
        priority: data.priority,
        budget: data.budget,
        amountPaid: data.projectCost,
        amountReceived: data.amountReceived,
      },
      ...prev,
    ]);
    setIsAddOpen(false);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsEditOpen(true);
  };

  const handleUpdateProject = (data: ProjectFormData) => {
    setProjectList(prev => prev.map(p =>
      p.id === selectedProject.id
        ? {
          ...p,
          name: data.name,
          category: data.category,
          client: data.client,
          assigned: data.assigned.split(',').map(item => item.trim()).filter(Boolean),
          started: data.started || 'TBD',
          // deadline: data.deadline || 'TBD',
          status: data.status,
          priority: data.priority,
          budget: data.budget,
          amountPaid: data.projectCost,
          amountReceived: data.amountReceived,
        }
        : p
    ));
    setIsEditOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjectList(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const handleInvoice = (project: any) => {
    setSelectedProject(project);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Projects</h1>
        <button
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          onClick={() => setIsAddOpen(true)}
        >
          + Add Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              {[
                "Project",
                "Category",
                "Client",
                "Assigned",
                "Total Budget",
                "Amount Received",
                "Amount Pending",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {projectList.map((p) => {
              const amountPending = Math.max(0, p.budget - p.amountReceived);
              return (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-indigo-50/30"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {p.name}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.category}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.client}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {p.assigned.map((person, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700"
                          title={person}
                        >
                          {person[0]}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ${p.budget?.toLocaleString() || '0'}
                  </td>

                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                    ${p.amountReceived?.toLocaleString() || '0'}
                  </td>

                  <td className={`px-4 py-3 text-sm font-medium ${amountPending > 0 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                    ${amountPending.toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "Completed"
                          ? "bg-green-50 text-green-700"
                          : p.status === "Review"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => handleInvoice(p)}
                        title="Generate Invoice"
                      >
                        Invoice
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        onClick={() => handleEditProject(p)}
                      >
                        Edit
                      </button>
                      <span className="text-gray-300 mx-1">|</span>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => handleDeleteProject(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Project" subtitle="Create a new project entry" size="lg">
        <AddProjectForm onSave={handleSaveProject} onClose={() => setIsAddOpen(false)} />
      </Modal>
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project" subtitle="Update project information" size="lg">
        <AddProjectForm
          onSave={handleUpdateProject}
          onClose={() => setIsEditOpen(false)}
          initialData={selectedProject ? {
            ...selectedProject,
            assigned: Array.isArray(selectedProject.assigned)
              ? selectedProject.assigned.join(', ')
              : selectedProject.assigned,
            projectCost: selectedProject.amountPaid ?? 0,
          } : undefined}
          mode="edit"
        />
      </Modal>
      <Modal open={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} title="Project Invoice" subtitle="Generate and download project invoice" size="lg">
        {selectedProject && <InvoiceGenerator project={selectedProject} />}
      </Modal>
    </div>
  );
}
