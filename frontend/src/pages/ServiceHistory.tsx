import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';

const ServiceHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      // Fetch all services and find the one since there's no single service GET endpoint currently
      const res = await apiClient.get(`/services/`);
      return res.data.find((s: any) => s.id === parseInt(id || '0'));
    }
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['serviceHistory', id],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance/');
      // Filter sessions that have this service in their items
      return res.data.filter((session: any) => 
        session.items.some((item: any) => item.service_id === parseInt(id || '0') || item.service?.id === parseInt(id || '0'))
      );
    }
  });

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Machine,Department,Remarks,Recorded By\n";
    
    history.forEach((session: any) => {
      const date = format(new Date(session.date), 'yyyy-MM-dd HH:mm');
      const machine = session.machine?.machine_number || "";
      const dept = session.machine?.department || "";
      const remarks = (session.remarks || "").replace(/"/g, '""');
      const worker = session.worker?.username || "";
      
      csvContent += `"${date}","${machine}","${dept}","${remarks}","${worker}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${service?.service_name || 'service'}_history.csv`.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingService || loadingHistory) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <button onClick={() => navigate(-1)} className="text-primary hover:underline">&larr; Back</button>
      <div className="bg-card border p-6 rounded-xl shadow-sm relative flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{service?.service_name}</h2>
          <p className="text-muted-foreground mt-1">{service?.description || 'No description'}</p>
          <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest">Interval: {service?.interval_days} Days</p>
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

      <h3 className="text-xl font-semibold mt-8 mb-4">Service Timeline across all Machines</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history?.length === 0 && <p className="text-muted-foreground ml-10 md:text-center md:ml-0">This service has not been performed yet.</p>}
        {history?.map((session: any) => (
          <div key={session.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
              <span className="text-xs font-bold">M/C</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded shadow-sm relative group">
              <div className="flex justify-between mb-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-lg">{session.machine?.machine_number}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">{session.machine?.department}</span>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(session.date), 'MMM d, yyyy')}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-bold">Total Services this session:</span> {session.items.length}
              </p>
              {session.remarks && (
                <div className="bg-muted/50 p-2 rounded text-xs mt-2">
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

export default ServiceHistory;
