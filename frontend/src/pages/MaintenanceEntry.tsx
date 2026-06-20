import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { CheckCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  "Lubrication",
  "Cleaning",
  "Inspection & Calibration",
  "Preventive Maintenance",
  "Component Replacement",
  "General"
];

const MaintenanceEntry = () => {
  const queryClient = useQueryClient();
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track expanded state for categories. Default all expanded.
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => (await apiClient.get('/machines/')).data
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await apiClient.get('/services/')).data
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => (await apiClient.post('/maintenance/', data)).data,
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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
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

  const groupedFilteredServices = useMemo(() => {
    if (!services) return {};
    const filtered = services.filter((s: any) => 
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const grouped: Record<string, any[]> = {};
    CATEGORIES.forEach(cat => grouped[cat] = []);
    
    filtered.forEach((s: any) => {
      const cat = s.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    return grouped;
  }, [services, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Fast Maintenance Entry</h2>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} />
          <span>Maintenance recorded successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card p-6 md:p-10 rounded-[2rem] shadow-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Select Machine</label>
          <select 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full p-4 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm font-bold text-foreground uppercase tracking-widest text-sm"
            required
          >
            <option value="">-- Choose Machine --</option>
            {machines?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.machine_number} - {m.name}</option>
            ))}
          </select>
        </div>

        {selectedMachine && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Maintenance Checklist</label>
                <p className="text-sm text-muted-foreground mt-1">Select the services performed on this machine.</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-full bg-background/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {CATEGORIES.map(category => {
                const categoryServices = groupedFilteredServices[category] || [];
                if (categoryServices.length === 0) return null;

                return (
                  <div key={category} className="border border-border rounded-2xl overflow-hidden bg-background/30 shadow-sm">
                    <button 
                      type="button" 
                      onClick={() => toggleCategory(category)}
                      className="w-full flex justify-between items-center p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <h3 className="font-bold text-foreground uppercase tracking-wider text-sm flex items-center">
                        <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
                        {category} <span className="ml-2 text-muted-foreground text-xs font-medium">({categoryServices.length})</span>
                      </h3>
                      {expandedCategories[category] ? <ChevronUp size={18} className="text-muted-foreground"/> : <ChevronDown size={18} className="text-muted-foreground"/>}
                    </button>
                    
                    {expandedCategories[category] && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-background">
                        {categoryServices.map((s: any) => (
                          <div 
                            key={s.id} 
                            onClick={() => handleServiceToggle(s.id)}
                            className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedServices.includes(s.id) ? 'bg-primary/5 border-primary shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                          >
                            <input 
                              type="checkbox" 
                              className="mt-1 w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary"
                              checked={selectedServices.includes(s.id)}
                              readOnly
                            />
                            <div className="ml-4 flex-1">
                              <p className="font-bold text-foreground">{s.service_name}</p>
                              {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                              {(s.estimated_duration || s.service_code) && (
                                <div className="flex items-center space-x-3 mt-2">
                                  {s.service_code && <span className="text-[10px] font-black uppercase tracking-widest bg-muted px-2 py-0.5 rounded text-muted-foreground">{s.service_code}</span>}
                                  {s.estimated_duration && <span className="text-[10px] font-bold text-muted-foreground">{s.estimated_duration} MINS</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.values(groupedFilteredServices).every(arr => arr.length === 0) && (
                <div className="text-center py-10 text-muted-foreground">
                  No services found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        <div className={selectedMachine ? "animate-in fade-in duration-700" : "hidden"}>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Remarks (Optional)</label>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full p-4 border border-border rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[100px] transition-all shadow-sm resize-y font-medium text-foreground"
            placeholder="Add any additional context or notes here..."
          />
        </div>

        <button 
          type="submit" 
          disabled={!selectedMachine || selectedServices.length === 0 || submitMutation.isPending}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none mt-4"
        >
          {submitMutation.isPending ? 'Recording Entry...' : 'Submit Maintenance Record'}
        </button>
      </form>
    </div>
  );
};

export default MaintenanceEntry;
