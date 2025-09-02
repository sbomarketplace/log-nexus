import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertIcon } from '@/components/icons/CustomIcons';
import { SearchIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IncidentCard } from '@/components/IncidentCard';
import { ViewIncidentModal } from '@/components/ViewIncidentModal';
import { ExportOptionsModal } from '@/components/ExportOptionsModal';
import { IncidentListControls } from '@/components/IncidentListControls';
import { BulkBarMobile } from '@/components/BulkBarMobile';
import InlineAd from '@/components/ads/InlineAd';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getAllCategories } from '@/utils/incidentCategories';
import { getDateSafely } from '@/utils/safeDate';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { usePin } from '@/state/pin';

export default function IncidentExplorer() {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportIncident, setExportIncident] = useState<OrganizedIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const orderWithPins = usePin((s) => s.orderWithPins);
  const { toast } = useToast();
  
  // Query params for modal management
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentId = searchParams.get('incidentId');
  const mode = searchParams.get('mode'); // 'edit' or null (for view)

  const loadIncidents = () => {
    try {
      const incidents = organizedIncidentStorage.getAll();
      setOrganizedIncidents(incidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load incidents from storage.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort incidents based on search term and category filter
  useEffect(() => {
    let filtered = organizedIncidents;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      // Normalize search term for case number matching (remove spaces, punctuation, lowercase)
      const searchNorm = searchTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      filtered = filtered.filter(incident => 
        // Search in title (new field)
        (incident.title && incident.title.toLowerCase().includes(searchLower)) ||
        incident.what.toLowerCase().includes(searchLower) ||
        incident.who.toLowerCase().includes(searchLower) ||
        incident.where.toLowerCase().includes(searchLower) ||
        incident.categoryOrIssue.toLowerCase().includes(searchLower) ||
        incident.notes.toLowerCase().includes(searchLower) ||
        // Case number exact match
        (incident.caseNumber && incident.caseNumber.toLowerCase().includes(searchLower)) ||
        // Case number normalized partial match (strips punctuation/spaces for flexible matching)
        (incident.caseNumber && searchNorm && 
         incident.caseNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(searchNorm))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(incident => incident.categoryOrIssue === filterCategory);
    }

    // Apply sorting (by date descending)
    filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredIncidents(filtered);
  }, [organizedIncidents, searchTerm, filterCategory]);

  useEffect(() => {
    loadIncidents();
    
    // Listen for incidents updates from bulk operations
    const handleIncidentsUpdated = () => {
      loadIncidents();
    };
    
    window.addEventListener('incidentsUpdated', handleIncidentsUpdated);
    
    return () => {
      window.removeEventListener('incidentsUpdated', handleIncidentsUpdated);
    };
  }, []);

  const handleDeleteIncident = async (id: string) => {
    try {
      organizedIncidentStorage.delete(id);
      loadIncidents();
      setDeleteId(null);
      toast({
        title: "Incident Deleted",
        description: "The incident has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (incident: OrganizedIncident): string => {
    // First check for preferred date from original text
    if (incident.originalEventDateText || incident.timeline) {
      const preferred = getPreferredDateTime(incident);
      
      if (preferred.date) {
        try {
          const date = new Date(preferred.date);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        } catch {
          // Fall through to canonical date
        }
      }
    }
    
    // Use canonical date if available
    if (incident.canonicalEventDate) {
      try {
        const date = new Date(incident.canonicalEventDate);
        const hasTime = date.getHours() !== 12 || date.getMinutes() !== 0;
        
        if (hasTime) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
        }
        
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        // Fall through to legacy formatting
      }
    }

    // Parse the date string to check if it's the current year - null safety
    const dateString = getDateSafely(incident, '');
    if (!dateString || dateString === 'No date' || dateString === 'Unknown date') {
      return 'No date';
    }
    
    try {
      // Handle various date formats
      let date: Date;
      
      // Check if it's already in a good format like "Aug 11, 2024"
      if (dateString.match(/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/)) {
        return dateString;
      }
      
      // Handle MM/DD/YYYY or similar formats
      if (dateString.match(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/)) {
        const parts = dateString.split('/');
        const currentYear = new Date().getFullYear();
        const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : currentYear;
        date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'No date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'No date';
    }
  };

  const getCategoryTagClass = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('safety') || lowerCategory.includes('accident') || lowerCategory.includes('injury')) {
      return 'category-safety';
    } else if (lowerCategory.includes('harassment') || lowerCategory.includes('discrimination') || lowerCategory.includes('bullying')) {
      return 'category-harassment';
    } else if (lowerCategory.includes('wrongful') || lowerCategory.includes('accusation') || lowerCategory.includes('false')) {
      return 'category-accusation';
    } else if (lowerCategory.includes('policy') || lowerCategory.includes('violation') || lowerCategory.includes('misconduct')) {
      return 'category-policy';
    } else {
      return 'category-default';
    }
  };

  const handleViewIncident = (incident: OrganizedIncident) => {
    setSearchParams({ incidentId: incident.id });
  };

  const handleCloseIncidentModal = () => {
    setSearchParams({});
  };

  const handleExport = (incident: OrganizedIncident) => {
    setExportIncident(incident);
  };

  return (
    <>
      {/* Section Title and Search/Filter Controls - Always Visible */}
      <div className="mb-6 space-y-4" data-incident-reports-section>
        {/* Section Title */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold text-foreground">Workplace Incident Reports</h2>
          <p className="text-xs text-muted-foreground">View, edit, export, or delete any past incident reports</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by keyword, person, or Case #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 rounded-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Filter Controls */}
        <div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {getAllCategories().map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3 incident-list">
        {organizedIncidents.length === 0 ? (
          <>
            <IncidentListControls visibleIds={[]} />
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents recorded</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Start by organizing your first incident notes or creating a new incident report.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <IncidentListControls visibleIds={filteredIncidents.map(i => i.id)} />
            
            {filteredIncidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <SearchIcon className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="text-sm font-medium mb-1">No incidents found</h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Try adjusting your search terms or filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              orderWithPins(filteredIncidents).map((incident, index) => (
                <React.Fragment key={incident.id}>
                  <IncidentCard
                    incident={incident}
                    index={index}
                    pageIds={orderWithPins(filteredIncidents).map(i => i.id)}
                    onView={() => handleViewIncident(incident)}
                    onExport={() => handleExport(incident)}
                    onDelete={() => setDeleteId(incident.id)}
                    onUpdate={loadIncidents}
                    getCategoryTagClass={getCategoryTagClass}
                    initialEditMode={mode === 'edit' && incident.id === incidentId}
                  />
                  {/* After the 7th card (0-based index 6), render second ad if list is long */}
                  {index === 6 && filteredIncidents.length > 7 && <InlineAd slot="home2" />}
                  {/* After the 19th card (7 + 12), render third ad for very long lists */}
                  {index === 18 && filteredIncidents.length > 19 && <InlineAd slot="home3" />}
                </React.Fragment>
              ))
            )}
          </>
        )}
      </div>
      
      <BulkBarMobile />

      {/* Unified Incident Modal - View Mode */}
      {incidentId && mode !== 'edit' && (
        <ViewIncidentModal 
          incident={organizedIncidents.find(i => i.id === incidentId) || null}
          open={!!incidentId && mode !== 'edit'}
          onOpenChange={(open) => !open && handleCloseIncidentModal()}
          onIncidentUpdate={loadIncidents}
        />
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal 
        incident={exportIncident}
        open={!!exportIncident}
        onOpenChange={(open) => !open && setExportIncident(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setDeleteId(null)}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6 transform transition-all">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Delete Incident
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Are you sure you want to delete this incident? This action cannot be undone.
                </p>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <button 
                  onClick={() => deleteId && handleDeleteIncident(deleteId)}
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl py-3 font-medium transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setDeleteId(null)}
                  className="w-full border border-border hover:bg-accent rounded-xl py-3 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}