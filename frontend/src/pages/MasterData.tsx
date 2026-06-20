import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { X, Edit2, Check, Ban } from 'lucide-react';

const CATEGORIES = [
  "Lubrication",
  "Cleaning",
  "Inspection & Calibration",
  "Preventive Maintenance",
  "Component Replacement"
];

const MasterData = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('services');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await apiClient.get('/services/')).data
  });

  const { data: parts } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => (await apiClient.get('/parts/')).data
  });

  const saveItem = useMutation({
    mutationFn: async ({ endpoint, data, id }: { endpoint: string, data: any, id?: number }) => {
      if (id) {
        return (await apiClient.put(`${endpoint}${id}`, data)).data;
      }
      return (await apiClient.post(endpoint, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string, id: number, data: any }) => {
      return (await apiClient.put(`${endpoint}${id}`, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
    }
  });

  const openModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      if (activeTab === 'services') {
        setFormData({ service_name: '', service_code: '', category: CATEGORIES[0], description: '', is_active: true });
      } else {
        setFormData({ part_name: '', part_number: '', description: '', is_active: true });
      }
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveItem.mutate({ endpoint: `/${activeTab}/`, data: formData, id: editingId || undefined });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Master Data Management</h2>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 capitalize font-bold"
        >
          + Add {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="flex space-x-1 border-b">
        {['services', 'parts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 capitalize font-bold text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
        {activeTab === 'services' && (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Service Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services?.map((s: any) => (
                <tr key={s.id} className={`border-b last:border-0 hover:bg-muted/20 ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold text-muted-foreground">{s.service_code || '-'}</td>
                  <td className="p-4 font-medium">{s.service_name}</td>
                  <td className="p-4 text-xs font-bold uppercase tracking-wider">{s.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(s)} className="p-1.5 bg-secondary text-secondary-foreground rounded hover:opacity-80 transition-opacity" title="Edit"><Edit2 size={14}/></button>
                    <button 
                      onClick={() => toggleStatus.mutate({ endpoint: '/services/', id: s.id, data: {...s, is_active: !s.is_active} })}
                      className={`p-1.5 text-white rounded hover:opacity-80 transition-opacity ${s.is_active ? 'bg-red-500' : 'bg-green-500'}`}
                      title={s.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {s.is_active ? <Ban size={14}/> : <Check size={14}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'parts' && (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-semibold">Part Number</th>
                <th className="p-4 font-semibold">Part Name</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts?.map((p: any) => (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/20 ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold text-muted-foreground">{p.part_number || '-'}</td>
                  <td className="p-4 font-medium">{p.part_name}</td>
                  <td className="p-4 text-muted-foreground truncate max-w-[200px]">{p.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(p)} className="p-1.5 bg-secondary text-secondary-foreground rounded hover:opacity-80 transition-opacity" title="Edit"><Edit2 size={14}/></button>
                    <button 
                      onClick={() => toggleStatus.mutate({ endpoint: '/parts/', id: p.id, data: {...p, is_active: !p.is_active} })}
                      className={`p-1.5 text-white rounded hover:opacity-80 transition-opacity ${p.is_active ? 'bg-red-500' : 'bg-green-500'}`}
                      title={p.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {p.is_active ? <Ban size={14}/> : <Check size={14}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-full max-w-md shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold capitalize">{editingId ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'services' && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Service Code</label>
                      <input type="text" value={formData.service_code || ''} onChange={e => setFormData({...formData, service_code: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. LUB-001" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Service Name</label>
                    <input required type="text" value={formData.service_name || ''} onChange={e => setFormData({...formData, service_name: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Shuttle Oil Change" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Category</label>
                    <select required value={formData.category || CATEGORIES[0]} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Description</label>
                    <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none resize-none" rows={3} placeholder="Service details..."></textarea>
                  </div>
                </>
              )}

              {activeTab === 'parts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Part Number</label>
                    <input type="text" value={formData.part_number || ''} onChange={e => setFormData({...formData, part_number: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. P-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Part Name</label>
                    <input required type="text" value={formData.part_name || ''} onChange={e => setFormData({...formData, part_name: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Guide Plate" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Description</label>
                    <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-border rounded focus:ring-2 focus:ring-primary outline-none resize-none" rows={3} placeholder="Part details..."></textarea>
                  </div>
                </>
              )}

              <div className="pt-4 mt-4 border-t border-border flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saveItem.isPending} className="bg-primary text-primary-foreground px-6 py-2 rounded font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                  {saveItem.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
