import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

const Reports = () => {
  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance/');
      return res.data;
    }
  });

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  // Group maintenance sessions by machine
  const groupedData = useMemo(() => {
    if (!maintenance || !machines) return [];
    
    const groups: Record<number, any[]> = {};
    maintenance.forEach((session: any) => {
      if (!groups[session.machine_id]) {
        groups[session.machine_id] = [];
      }
      groups[session.machine_id].push(session);
    });

    const result = [];
    for (const machine of machines) {
      if (groups[machine.id]) {
        // Sort sessions by date ascending to match paper records timeline
        const sessions = groups[machine.id].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Extract just the number from "M/C NO 1"
        const match = machine.machine_number.match(/\d+/);
        const mcNum = match ? match[0] : machine.machine_number;
        
        result.push({
          machine: machine,
          mcNum: mcNum,
          sessions: sessions
        });
      }
    }
    
    // Sort overall result by machine number ascending
    return result.sort((a, b) => parseInt(a.mcNum) - parseInt(b.mcNum));
  }, [maintenance, machines]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center hide-on-print">
        <h2 className="text-2xl font-bold">ALL MACHINE SERVICE REPORT</h2>
        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-colors"
        >
          <Printer size={18} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div className="bg-white text-black print-container overflow-x-auto p-4 rounded border">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th colSpan={3} className="border border-black p-3 text-center text-lg font-bold bg-gray-100">
                ALL MACHINE SERVICE REPORT
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-black p-2 font-bold w-32 text-center">DATE</th>
              <th className="border border-black p-2 font-bold w-24 text-center">M/C NO</th>
              <th className="border border-black p-2 font-bold text-center">SERVICE TYPE</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center">No reports found.</td></tr>
            )}
            {groupedData.map((group) => (
              group.sessions.map((session: any, index: number) => (
                <tr key={session.id}>
                  <td className="border border-black p-2 text-center font-bold align-middle">
                    {format(new Date(session.date), 'dd/MM/yyyy')}
                  </td>
                  {index === 0 && (
                    <td 
                      rowSpan={group.sessions.length} 
                      className="border border-black p-2 text-center font-bold text-xl align-middle"
                    >
                      {group.mcNum}
                    </td>
                  )}
                  <td className="border border-black p-2 align-top">
                    <ul className="list-none space-y-1">
                      {session.items.map((item: any) => (
                        <li key={item.id} className="uppercase text-xs font-semibold tracking-wide">
                          {item.service?.service_name}
                        </li>
                      ))}
                      {session.remarks && session.remarks !== "Historical data imported from paper records." && (
                        <li className="uppercase text-xs font-semibold tracking-wide text-gray-600 mt-2">
                          REMARKS: {session.remarks}
                        </li>
                      )}
                    </ul>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            padding: 0;
          }
          .hide-on-print {
            display: none !important;
          }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
