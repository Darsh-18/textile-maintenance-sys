import os

FRONTEND_SRC = "frontend/src"

components = {
    "pages/MaintenanceEntry.tsx": """import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { CheckCircle, AlertCircle } from 'lucide-react';

const MaintenanceEntry = () => {
  const queryClient = useQueryClient();
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient.get('/services/');
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/maintenance/', data);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setSelectedMachine('');
      setSelectedServices([]);
      setRemarks('');
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const handleServiceToggle = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || selectedServices.length === 0) return;
    submitMutation.mutate({
      machine_id: parseInt(selectedMachine),
      remarks,
      items: selectedServices
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Fast Maintenance Entry</h2>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} />
          <span>Maintenance recorded successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border p-6 rounded-xl shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Machine</label>
          <select 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            required
          >
            <option value="">-- Choose Machine --</option>
            {machines?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.machine_number} - {m.name}</option>
            ))}
          </select>
        </div>

        {selectedMachine && (
          <div>
            <label className="block text-sm font-medium mb-3">Check Completed Services</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services?.map((s: any) => (
                <label 
                  key={s.id} 
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedServices.includes(s.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                >
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-primary"
                    checked={selectedServices.includes(s.id)}
                    onChange={() => handleServiceToggle(s.id)}
                  />
                  <div>
                    <p className="font-medium">{s.service_name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
            placeholder="E.g., Guide plate worn out, needs attention soon."
          />
        </div>

        <button 
          type="submit" 
          disabled={!selectedMachine || selectedServices.length === 0 || submitMutation.isPending}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Maintenance Record'}
        </button>
      </form>
    </div>
  );
};

export default MaintenanceEntry;
""",
    "pages/Machines.tsx": """import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Power, Calendar, Settings } from 'lucide-react';

const Machines = () => {
  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Machine Registry</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90">
          + Add Machine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines?.map((m: any) => (
          <div key={m.id} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{m.machine_number}</h3>
                <p className="text-sm text-muted-foreground">{m.name}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {m.status}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center text-sm">
                <Settings size={16} className="text-muted-foreground mr-2" />
                <span><span className="font-medium">Type:</span> {m.type}</span>
              </div>
              <div className="flex items-center text-sm">
                <Power size={16} className="text-muted-foreground mr-2" />
                <span><span className="font-medium">Dept:</span> {m.department}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-muted-foreground mr-2" />
                <span><span className="font-medium">Installed:</span> {m.installation_date}</span>
              </div>
              
              <button className="w-full mt-4 bg-muted text-foreground py-2 rounded-md text-sm font-medium hover:bg-muted-foreground/20 transition-colors">
                View History
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Machines;
"""
}

for filename, content in components.items():
    path = os.path.join(FRONTEND_SRC, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

# Update App.tsx to include these components
app_tsx_path = "frontend/src/App.tsx"
with open(app_tsx_path, "r") as f:
    app_content = f.read()

app_content = app_content.replace(
    "import Dashboard from './pages/Dashboard';",
    "import Dashboard from './pages/Dashboard';\nimport MaintenanceEntry from './pages/MaintenanceEntry';\nimport Machines from './pages/Machines';"
)

app_content = app_content.replace(
    "<Route path=\"maintenance\" element={<div>Maintenance Entry Page Placeholder</div>} />",
    "<Route path=\"maintenance\" element={<MaintenanceEntry />} />"
)

app_content = app_content.replace(
    "<Route path=\"machines\" element={<div>Machines Page Placeholder</div>} />",
    "<Route path=\"machines\" element={<Machines />} />"
)

with open(app_tsx_path, "w") as f:
    f.write(app_content)

print("More frontend components generated successfully.")
