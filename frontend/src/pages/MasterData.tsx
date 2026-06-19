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
    setFormData({ service_name: '', interval_days: 30, is_active: true });
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
        <button className="px-4 py-2 capitalize font-medium text-sm transition-colors border-b-2 border-primary text-primary">
          Services
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
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
              <div>
                <label className="block text-sm font-medium mb-1">Service Name</label>
                <input required type="text" value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. OIL CHANGE" />
              </div>
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
