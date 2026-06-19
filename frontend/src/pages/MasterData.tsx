import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const MasterData = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('services');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await apiClient.get('/services/')).data
  });

  const { data: parts } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => (await apiClient.get('/parts/')).data
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await apiClient.get('/vendors/')).data
  });

  const createItem = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string, data: any }) => {
      const res = await apiClient.post(endpoint, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      setIsModalOpen(false);
      setFormData({});
    }
  });

  const openModal = () => {
    if (activeTab === 'services') setFormData({ service_name: '', is_active: true });
    if (activeTab === 'parts') setFormData({ part_number: '', part_name: '', is_active: true });
    if (activeTab === 'vendors') setFormData({ vendor_name: '', contact_person: '', mobile: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate({ endpoint: `/${activeTab}/`, data: formData });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Master Data Management</h2>
        <button 
          onClick={openModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 capitalize"
        >
          + Add {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="flex space-x-1 border-b">
        {['services', 'parts', 'vendors'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
        {activeTab === 'services' && (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr><th className="p-4 font-semibold">Service Name</th><th className="p-4 font-semibold">Status</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {services?.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{s.service_name}</td>
                  <td className="p-4">{s.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-4 text-right">
                    <Link to={`/services/${s.id}`} className="text-primary hover:underline text-xs font-bold uppercase">View History</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {activeTab === 'parts' && (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr><th className="p-4 font-semibold">Part Number</th><th className="p-4 font-semibold">Part Name</th><th className="p-4 font-semibold">Status</th></tr>
            </thead>
            <tbody>
              {parts?.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{p.part_number}</td>
                  <td className="p-4">{p.part_name}</td>
                  <td className="p-4">{p.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'vendors' && (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr><th className="p-4 font-semibold">Vendor Name</th><th className="p-4 font-semibold">Contact</th><th className="p-4 font-semibold">Phone</th></tr>
            </thead>
            <tbody>
              {vendors?.map((v: any) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{v.vendor_name}</td>
                  <td className="p-4">{v.contact_person}</td>
                  <td className="p-4">{v.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-full max-w-md shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold capitalize">Add New {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'services' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Name</label>
                    <input required type="text" value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. OIL CHANGE" />
                  </div>
                </>
              )}

              {activeTab === 'parts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Part Number</label>
                    <input required type="text" value={formData.part_number} onChange={e => setFormData({...formData, part_number: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. P-123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Part Name</label>
                    <input required type="text" value={formData.part_name} onChange={e => setFormData({...formData, part_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Roller Bearing" />
                  </div>
                </>
              )}

              {activeTab === 'vendors' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Name</label>
                    <input required type="text" value={formData.vendor_name} onChange={e => setFormData({...formData, vendor_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. ABC Textiles" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Person</label>
                    <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile Phone</label>
                    <input type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. +1 234 567 8900" />
                  </div>
                </>
              )}

              <button type="submit" disabled={createItem.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                {createItem.isPending ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
