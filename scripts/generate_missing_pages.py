import os

FRONTEND_SRC = "frontend/src"

components = {
    "pages/MachineHistory.tsx": """import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';

const MachineHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      // In a real app we'd have a specific endpoint or filter, for now filter client side
      const res = await apiClient.get('/maintenance/');
      return res.data.filter((session: any) => session.machine_id === parseInt(id || '0'));
    }
  });

  if (loadingMachine || loadingHistory) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-primary hover:underline">&larr; Back to Machines</button>
      <div className="bg-card border p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold">{machine?.machine_number} - {machine?.name}</h2>
        <p className="text-muted-foreground">Department: {machine?.department} | Type: {machine?.type}</p>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Maintenance Timeline</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history?.length === 0 && <p className="text-muted-foreground ml-10 md:text-center md:ml-0">No maintenance history recorded yet.</p>}
        {history?.map((session: any, i: number) => (
          <div key={session.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
              <span className="text-xs font-bold">{session.items.length}</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded shadow-sm">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-foreground">Services Performed</span>
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
    </div>
  );
};

export default MachineHistory;
""",
    "pages/Repairs.tsx": """import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';

const Repairs = () => {
  const queryClient = useQueryClient();
  
  const { data: repairs, isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const res = await apiClient.get('/repairs/');
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiClient.put(`/repairs/${id}/status?status=${encodeURIComponent(status)}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    }
  });

  const statuses = ["Sent for Repair", "Under Repair", "Ready for Collection", "Returned", "Installed", "Closed"];

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Repair Requests</h2>
        {/* Placeholder for Add Repair Modal Trigger */}
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90">
          + New Repair
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Machine</th>
              <th className="p-4 font-semibold">Part</th>
              <th className="p-4 font-semibold">Vendor</th>
              <th className="p-4 font-semibold">Sent Date</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {repairs?.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No repairs found.</td></tr>
            )}
            {repairs?.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-4">#{r.id}</td>
                <td className="p-4 font-medium">{r.machine?.machine_number}</td>
                <td className="p-4">{r.part?.part_name}</td>
                <td className="p-4">{r.vendor?.vendor_name}</td>
                <td className="p-4">{format(new Date(r.sent_date), 'MMM d, yyyy')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="border rounded p-1 text-xs bg-background focus:ring-1 focus:ring-primary"
                    disabled={updateStatusMutation.isPending}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Repairs;
""",
    "pages/Reports.tsx": """import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

const Reports = () => {
  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance/');
      return res.data;
    }
  });

  const exportToCSV = () => {
    if (!maintenance) return;
    
    // Create CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Machine,Worker,Services,Remarks\\n";
    
    // Add rows
    maintenance.forEach((session: any) => {
      const services = session.items.map((i: any) => i.service?.service_name).join("; ");
      const row = [
        session.id,
        format(new Date(session.date), 'yyyy-MM-dd HH:mm'),
        session.machine_id, // Ideally join machine number in backend, but just id for demo
        session.worker?.username,
        `"${services}"`,
        `"${session.remarks || ''}"`
      ].join(",");
      csvContent += row + "\\r\\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maintenance_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maintenance Reports</h2>
        <button 
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 font-semibold">Session ID</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Machine ID</th>
              <th className="p-4 font-semibold">Worker</th>
              <th className="p-4 font-semibold">Services</th>
            </tr>
          </thead>
          <tbody>
            {maintenance?.map((m: any) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-4">#{m.id}</td>
                <td className="p-4">{format(new Date(m.date), 'MMM d, yyyy HH:mm')}</td>
                <td className="p-4 font-medium">{m.machine_id}</td>
                <td className="p-4">{m.worker?.username}</td>
                <td className="p-4 truncate max-w-[300px]">
                  {m.items.map((i: any) => i.service?.service_name).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
""",
    "pages/MasterData.tsx": """import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('services');

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Master Data Management</h2>
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
              <tr><th className="p-4 font-semibold">Service Name</th><th className="p-4 font-semibold">Interval (Days)</th><th className="p-4 font-semibold">Status</th></tr>
            </thead>
            <tbody>
              {services?.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{s.service_name}</td>
                  <td className="p-4">{s.interval_days}</td>
                  <td className="p-4">{s.is_active ? 'Active' : 'Inactive'}</td>
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
    </div>
  );
};

export default MasterData;
"""
}

for filename, content in components.items():
    path = os.path.join(FRONTEND_SRC, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Remaining pages generated.")
