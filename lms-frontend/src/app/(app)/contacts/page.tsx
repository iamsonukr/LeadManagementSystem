'use client';

import { Plus, Search, Mail, Phone } from 'lucide-react';
import { contacts } from '@/data/mockData';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddContactForm, { ContactFormData } from '@/components/contacts/AddContactForm';
import { Contact } from '@/types';

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [contactList, setContactList] = useState<Contact[]>(contacts);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = contactList.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveContact = (data: ContactFormData) => {
    const newContact: Contact = {
      ...data,
      id: `ct${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setContactList(prev => [newContact, ...prev]);
    setIsAddOpen(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} contacts</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-72 shadow-sm">
        <Search size={14} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder:text-gray-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(contact => (
          <div key={contact.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {contact.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{contact.name}</div>
                <div className="text-xs text-gray-500">{contact.role} · {contact.company}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail size={11} className="text-gray-400" />{contact.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone size={11} className="text-gray-400" />{contact.phone}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Contact" subtitle="Create a new contact" size="lg">
        <AddContactForm onSave={handleSaveContact} onClose={() => setIsAddOpen(false)} />
      </Modal>
    </div>
  );
}
