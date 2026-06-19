import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { X, Edit2, Trash2, CheckCircle, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Repairs = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [partData, setPartData] = useState({ part_name: '', part_number: '', description: '' });
  const [vendorData, setVendorData] = useState({ vendor_name: '', contact_person: '', mobile: '', email: '', address: '' });
  const [formData, setFormData] = useState({
    machine_id: '',
    part_id: '',
    vendor_id: '',
    quantity: 1,
    remarks: '',
    sent_date: new Date().toISOString().split('T')[0],
  });
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState({ id: 0, cost: '', invoice_number: '', completion_date: new Date().toISOString().split('T')[0] });
  
  const { data: repairs, isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const res = await apiClient.get('/repairs/');
      return res.data;
    }
  });

  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: async () => (await apiClient.get('/machines/')).data });
  const { data: parts } = useQuery({ queryKey: ['parts'], queryFn: async () => (await apiClient.get('/parts/')).data });
  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: async () => (await apiClient.get('/vendors/')).data });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiClient.put(`/repairs/${id}/status?status=${encodeURIComponent(status)}`);
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['repairs'] });
      const previousRepairs = queryClient.getQueryData(['repairs']);
      queryClient.setQueryData(['repairs'], (old: any) => 
        old?.map((r: any) => r.id === id ? { ...r, status } : r)
      );
      return { previousRepairs };
    },
    onError: (err, newRepair, context) => {
      if (context?.previousRepairs) {
        queryClient.setQueryData(['repairs'], context.previousRepairs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    }
  });

  const deleteRepair = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/repairs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    }
  });

  const createRepair = useMutation({
    mutationFn: async (newRepair: any) => {
      if (editingId) {
        const res = await apiClient.put(`/repairs/${editingId}`, newRepair);
        return res.data;
      } else {
        const res = await apiClient.post('/repairs/', newRepair);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ machine_id: '', part_id: '', vendor_id: '', quantity: 1, remarks: '', sent_date: new Date().toISOString().split('T')[0] });
    }
  });

  const completeRepair = useMutation({
    mutationFn: async (data: any) => {
      const existing = repairs.find((r: any) => r.id === data.id);
      const payload = {
        machine_id: existing.machine_id,
        part_id: existing.part_id,
        vendor_id: existing.vendor_id,
        quantity: existing.quantity,
        sent_date: existing.sent_date.split('T')[0],
        remarks: existing.remarks,
        status: 'Closed',
        cost: data.cost,
        invoice_number: data.invoice_number,
        completion_date: data.completion_date
      };
      const res = await apiClient.put(`/repairs/${data.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      setIsCompletionModalOpen(false);
    }
  });

  const createPart = useMutation({
    mutationFn: async (newPart: any) => (await apiClient.post('/parts/', newPart)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setFormData(prev => ({ ...prev, part_id: data.id }));
      setIsPartModalOpen(false);
      setPartData({ part_name: '', part_number: '', description: '' });
    }
  });

  const createVendor = useMutation({
    mutationFn: async (newVendor: any) => (await apiClient.post('/vendors/', newVendor)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setFormData(prev => ({ ...prev, vendor_id: data.id }));
      setIsVendorModalOpen(false);
      setVendorData({ vendor_name: '', contact_person: '', mobile: '', email: '', address: '' });
    }
  });

  const statuses = ["Sent for Repair", "Under Repair", "Ready for Collection", "Returned", "Installed", "Closed"];

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this repair request?')) {
      deleteRepair.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRepair.mutate(formData);
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({
      machine_id: r.machine_id,
      part_id: r.part_id || '',
      vendor_id: r.vendor_id || '',
      quantity: r.quantity || 1,
      remarks: r.remarks || '',
      sent_date: r.sent_date ? r.sent_date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const exportCSV = () => {
    if (!repairs || repairs.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header Row
    if (user?.role === 'Admin') {
      csvContent += "ID,Machine Number,Machine Name,Machine Type,Error Description,Part Name,Part Number,Vendor Name,Sent Date,Status,Cost,Invoice Number,Completion Date\n";
    } else {
      csvContent += "ID,Machine Number,Machine Name,Machine Type,Error Description,Part Name,Part Number,Vendor Name,Sent Date,Status\n";
    }
    
    // Data Rows
    repairs.forEach((r: any) => {
      const id = r.id || "";
      const machineNo = (r.machine?.machine_number || "").replace(/"/g, '""');
      const machineName = (r.machine?.name || "").replace(/"/g, '""');
      const machineType = (r.machine?.type || "").replace(/"/g, '""');
      const remarks = (r.remarks || "").replace(/"/g, '""');
      const partName = (r.part?.part_name || "").replace(/"/g, '""');
      const partNo = (r.part?.part_number || "").replace(/"/g, '""');
      const vendorName = (r.vendor?.vendor_name || "").replace(/"/g, '""');
      const sentDate = r.sent_date ? format(new Date(r.sent_date), 'yyyy-MM-dd') : "";
      const status = r.status || "";
      
      let row = `"${id}","${machineNo}","${machineName}","${machineType}","${remarks}","${partName}","${partNo}","${vendorName}","${sentDate}","${status}"`;
      
      if (user?.role === 'Admin') {
        const cost = (r.cost || "").replace(/"/g, '""');
        const invoice = (r.invoice_number || "").replace(/"/g, '""');
        const compDate = r.completion_date ? format(new Date(r.completion_date), 'yyyy-MM-dd') : "";
        row += `,"${cost}","${invoice}","${compDate}"`;
      }
      
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Repairs_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Repair Requests</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportCSV}
            className="flex items-center space-x-2 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary px-4 py-2 rounded-full font-bold transition-colors text-sm uppercase tracking-widest shadow-sm border border-border hover:border-primary/20"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ machine_id: '', part_id: '', vendor_id: '', quantity: 1, remarks: '', sent_date: new Date().toISOString().split('T')[0] });
              setIsModalOpen(true);
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-widest"
          >
            + New Repair
          </button>
        </div>
      </div>

      <div className="bg-card rounded-[2rem] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-border">
            <tr>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">ID</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Machine</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Error Description</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Part</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Vendor</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Sent Date</th>
              {user?.role === 'Admin' && (
                <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Completion Info</th>
              )}
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Status</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairs?.length === 0 && (
              <tr><td colSpan={user?.role === 'Admin' ? 8 : 7} className="p-8 text-center text-muted-foreground font-bold uppercase tracking-widest">No repairs found.</td></tr>
            )}
            {repairs?.map((r: any) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                <td className="p-6 font-bold text-muted-foreground">#{r.id}</td>
                <td className="p-6 font-black text-foreground">{r.machine?.machine_number}</td>
                <td className="p-6 font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[150px]">{r.remarks || '-'}</td>
                <td className="p-6 font-bold text-muted-foreground group-hover:text-foreground transition-colors">{r.part?.part_name || '-'}</td>
                <td className="p-6 font-bold text-muted-foreground group-hover:text-foreground transition-colors">{r.vendor?.vendor_name || '-'}</td>
                <td className="p-6 font-bold text-muted-foreground">{format(new Date(r.sent_date), 'MMM d, yyyy')}</td>
                {user?.role === 'Admin' && (
                  <td className="p-6">
                    {r.status === 'Closed' || r.cost ? (
                      <div className="flex flex-col space-y-0.5 text-[11px] uppercase tracking-wide">
                        <span className="font-bold text-foreground">Cost: {r.cost || '-'}</span>
                        <span className="text-muted-foreground">Inv: {r.invoice_number || '-'}</span>
                        <span className="text-muted-foreground">Done: {r.completion_date ? format(new Date(r.completion_date), 'MMM d') : '-'}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 italic text-xs font-medium">Pending</span>
                    )}
                  </td>
                )}
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm ${
                    r.status === 'Closed' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center space-x-3">
                    <select 
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="border border-border rounded-full px-4 py-2 text-xs bg-background focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase tracking-widest"
                      disabled={user?.role !== 'Admin'}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => handleEdit(r)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors">
                      <Edit2 size={16} />
                    </button>
                    {user?.role === 'Admin' && (
                      <button 
                        onClick={() => {
                          setCompletionData({ id: r.id, cost: r.cost || '', invoice_number: r.invoice_number || '', completion_date: r.completion_date ? r.completion_date.split('T')[0] : new Date().toISOString().split('T')[0] });
                          setIsCompletionModalOpen(true);
                        }}
                        className="text-green-500/70 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {user?.role === 'Admin' && (
                      <button 
                        onClick={() => handleDelete(r.id)} 
                        disabled={deleteRepair.isPending}
                        className="text-primary/70 hover:text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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
              <h3 className="text-xl font-bold">{editingId ? 'Edit Repair Request' : 'New Repair Request'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine</label>
                <select required value={formData.machine_id} onChange={e => setFormData({...formData, machine_id: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none">
                  <option value="" disabled>Select Machine</option>
                  {machines?.map((m: any) => <option key={m.id} value={m.id}>{m.machine_number} - {m.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Part</label>
                  {user?.role === 'Admin' && (
                    <button type="button" onClick={() => setIsPartModalOpen(true)} className="text-xs text-primary hover:underline">+ Add Part</button>
                  )}
                </div>
                <select required value={formData.part_id} onChange={e => setFormData({...formData, part_id: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none">
                  <option value="" disabled>Select Part</option>
                  {parts?.map((p: any) => <option key={p.id} value={p.id}>{p.part_name} ({p.part_number})</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Vendor</label>
                  {user?.role === 'Admin' && (
                    <button type="button" onClick={() => setIsVendorModalOpen(true)} className="text-xs text-primary hover:underline">+ Add Vendor</button>
                  )}
                </div>
                <select required value={formData.vendor_id} onChange={e => setFormData({...formData, vendor_id: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none">
                  <option value="" disabled>Select Vendor</option>
                  {vendors?.map((v: any) => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sent Date</label>
                  <input required type="date" value={formData.sent_date} onChange={e => setFormData({...formData, sent_date: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Error Description</label>
                <textarea required value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none min-h-[80px]" placeholder="Describe the error..." />
              </div>
              <button type="submit" disabled={createRepair.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                {createRepair.isPending ? 'Saving...' : 'Save Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isPartModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background p-6 rounded-xl w-full max-w-sm shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Part</h3>
              <button onClick={() => setIsPartModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createPart.mutate(partData); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Part Name</label>
                <input required type="text" value={partData.part_name} onChange={e => setPartData({...partData, part_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Part Number</label>
                <input required type="text" value={partData.part_number} onChange={e => setPartData({...partData, part_number: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input type="text" value={partData.description} onChange={e => setPartData({...partData, description: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <button type="submit" disabled={createPart.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium mt-2">Save Part</button>
            </form>
          </div>
        </div>
      )}

      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background p-6 rounded-xl w-full max-w-sm shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Vendor</h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createVendor.mutate(vendorData); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Vendor Name</label>
                <input required type="text" value={vendorData.vendor_name} onChange={e => setVendorData({...vendorData, vendor_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Contact</label>
                  <input type="text" value={vendorData.contact_person} onChange={e => setVendorData({...vendorData, contact_person: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Mobile</label>
                  <input type="text" value={vendorData.mobile} onChange={e => setVendorData({...vendorData, mobile: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
              <button type="submit" disabled={createVendor.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium mt-2">Save Vendor</button>
            </form>
          </div>
        </div>
      )}

      {isCompletionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background p-6 rounded-xl w-full max-w-sm shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Complete Repair Request</h3>
              <button onClick={() => setIsCompletionModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); completeRepair.mutate(completionData); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Cost</label>
                <input required type="text" value={completionData.cost} onChange={e => setCompletionData({...completionData, cost: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. $150.00" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Invoice Number</label>
                <input required type="text" value={completionData.invoice_number} onChange={e => setCompletionData({...completionData, invoice_number: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. INV-12345" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Completion Date</label>
                <input required type="date" value={completionData.completion_date} onChange={e => setCompletionData({...completionData, completion_date: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <button type="submit" disabled={completeRepair.isPending} className="w-full bg-[#10b981] text-white py-2 rounded-md font-medium mt-2 hover:opacity-90">
                {completeRepair.isPending ? 'Saving...' : 'Mark as Completed'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
