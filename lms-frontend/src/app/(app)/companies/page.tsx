'use client';

import { Plus, Building2, Users, DollarSign, Globe } from 'lucide-react';
import { companies } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddCompanyForm, { CompanyFormData } from '@/components/companies/AddCompanyForm';
import { Company } from '@/types';

export default function CompaniesPage() {
  const [companyList, setCompanyList] = useState<Company[]>(companies);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleSaveCompany = (data: CompanyFormData) => {
    const newCompany: Company = {
      ...data,
      id: `co${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCompanyList(prev => [newCompany, ...prev]);
    setIsAddOpen(false);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditOpen(true);
  };

  const handleUpdateCompany = (data: CompanyFormData) => {
    if (selectedCompany) {
      setCompanyList(prev => prev.map(c => 
        c.id === selectedCompany.id 
          ? { ...c, ...data }
          : c
      ));
      setIsEditOpen(false);
      setSelectedCompany(null);
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      setCompanyList(prev => prev.filter(c => c.id !== companyId));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">{companyList.length} companies</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={14} /> Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              {['Company', 'Industry', 'Size', 'Website',  'Revenue', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companyList.map(co => (
              <tr key={co.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Building2 size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{co.name}</div>
                      <div className="text-xs text-gray-400">{co.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{co.industry}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={12} className="text-gray-400" />{co.size}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-indigo-500">
                    <Globe size={12} />{co.website}
                  </div>
                </td>
                {/* <td className="px-4 py-3 text-sm text-gray-700 font-medium">{co.totalLeads}</td> */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <DollarSign size={12} />{formatCurrency(co.revenue).replace('$', '')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button 
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      onClick={() => handleEditCompany(co)}
                    >
                      Edit
                    </button>
                    <span className="text-gray-300 mx-1">|</span>
                    <button 
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={() => handleDeleteCompany(co.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Company" subtitle="Create a new company record" size="lg">
        <AddCompanyForm onSave={handleSaveCompany} onClose={() => setIsAddOpen(false)} />
      </Modal>
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Company" subtitle="Update company information" size="lg">
        <AddCompanyForm 
          onSave={handleUpdateCompany} 
          onClose={() => setIsEditOpen(false)} 
          initialData={selectedCompany || undefined} 
          mode="edit" 
        />
      </Modal>
    </div>
  );
}
