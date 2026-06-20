import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, X, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MachineHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ machine_id: number, remarks: string, items: number[] }>({
    machine_id: parseInt(id || '0'),
    remarks: '',
    items: []
  });

  const { data: machine, isLoading: loadingMachine } = useQuery({
    queryKey: ['machine', id],
    queryFn: async () => {
      const res = await apiClient.get(`/machines/${id}`);
      return res.data;
    }
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['machineHistory', id],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance/');
      return res.data.filter((session: any) => session.machine_id === parseInt(id || '0'));
    }
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await apiClient.get('/services/')).data
  });

  const updateSession = useMutation({
    mutationFn: async (updatedSession: any) => {
      const res = await apiClient.put(`/maintenance/${editingId}`, updatedSession);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machineHistory', id] });
      setEditingId(null);
    }
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiClient.delete(`/maintenance/${sessionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machineHistory', id] });
    }
  });

  const handleEdit = (session: any) => {
    setEditingId(session.id);
    setFormData({
      machine_id: session.machine_id,
      remarks: session.remarks || '',
      items: session.items.map((i: any) => i.service?.id)
    });
  };

  const handleCheckbox = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(serviceId)
        ? prev.items.filter(id => id !== serviceId)
        : [...prev.items, serviceId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSession.mutate(formData);
  };

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Services Performed,Remarks,Recorded By\n";
    
    history.forEach((session: any) => {
      const date = format(new Date(session.date), 'yyyy-MM-dd HH:mm');
      const services = session.items.map((item: any) => item.service?.service_name).join("; ");
      const remarks = (session.remarks || "").replace(/"/g, '""');
      const worker = session.worker?.username || "";
      
      csvContent += `"${date}","${services}","${remarks}","${worker}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${machine?.machine_number || 'machine'}_history.csv`.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingMachine || loadingHistory) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <button onClick={() => navigate(-1)} className="text-primary hover:underline">&larr; Back to Machines</button>
      <div className="bg-card border p-6 rounded-xl shadow-sm relative flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{machine?.machine_number} - {machine?.name}</h2>
          <p className="text-muted-foreground mt-1">Department: {machine?.department} | Type: {machine?.type}</p>
        </div>
        {history && history.length > 0 && (
          <button 
            onClick={exportCSV}
            className="flex items-center space-x-2 bg-primary/10 text-primary hover:bg-primary hover:text-background px-4 py-2 rounded-full font-bold transition-colors text-xs uppercase tracking-widest"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Maintenance Timeline</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history?.length === 0 && <p className="text-muted-foreground ml-10 md:text-center md:ml-0">No maintenance history recorded yet.</p>}
        {history?.map((session: any, i: number) => (
          <div key={session.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
              <span className="text-xs font-bold">{session.items.length}</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded shadow-sm relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <button onClick={() => handleEdit(session)} className="text-muted-foreground hover:text-primary p-1 bg-background rounded-full border border-border">
                  <Edit2 size={16} />
                </button>
                {user?.role === 'Admin' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this maintenance record?')) {
                        deleteSession.mutate(session.id);
                      }
                    }} 
                    className="text-muted-foreground hover:text-destructive p-1 bg-background rounded-full border border-border"
                    disabled={deleteSession.isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="flex justify-between mb-1 pr-16">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Services Performed</span>
                  {session.is_edited && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground font-medium">Edited</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(session.date), 'MMM d, yyyy - HH:mm')}</span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
                {session.items.map((item: any) => (
                  <li key={item.id}>{item.service?.service_name}</li>
                ))}
              </ul>
              {session.remarks && (
                <div className="bg-muted/50 p-2 rounded text-xs">
                  <span className="font-semibold">Remarks:</span> {session.remarks}
                </div>
              )}
              <div className="mt-2 text-xs text-right text-muted-foreground">
                Recorded by: {session.worker?.username}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-full max-w-md shadow-lg border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Maintenance Entry</h3>
              <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Services Performed</label>
                <div className="space-y-2 border rounded p-3 bg-muted/20">
                  {services?.map((s: any) => (
                    <label key={s.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary"
                        checked={formData.items.includes(s.id)}
                        onChange={() => handleCheckbox(s.id)}
                      />
                      <span className="text-sm">{s.service_name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks / Notes</label>
                <textarea 
                  value={formData.remarks} 
                  onChange={e => setFormData({...formData, remarks: e.target.value})} 
                  className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none min-h-[80px]" 
                  placeholder="e.g. Filter needs replacement soon..."
                />
              </div>
              <button type="submit" disabled={updateSession.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                {updateSession.isPending ? 'Saving...' : 'Update Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineHistory;
