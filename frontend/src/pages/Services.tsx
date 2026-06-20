import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

const Services = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient.get('/services/');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading...</div>;

  const filteredServices = services?.filter((s: any) => 
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Service Registry</h2>
        <input 
          type="text" 
          placeholder="Search services..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-border rounded-full bg-card focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices?.map((s: any) => (
          <div key={s.id} className="bg-card rounded-[2rem] p-6 shadow-xl hover:bg-muted/30 transition-colors border border-border flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-xl text-foreground tracking-tight line-clamp-2" title={s.service_name}>{s.service_name}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">
                    {s.category || 'GENERAL'}
                  </span>
                  {s.service_code && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-md border border-border">
                      {s.service_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 mb-6">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {s.description || 'No description available for this service.'}
              </p>
            </div>
            
            <Link to={`/services/${s.id}`} className="mt-auto block w-full text-center bg-muted/30 hover:bg-primary text-foreground hover:text-background py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all duration-300">
              View History
            </Link>
          </div>
        ))}
        {filteredServices?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground font-medium">
            No services found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
