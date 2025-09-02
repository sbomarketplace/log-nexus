import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IncidentCard } from "@/components/IncidentCard";
import { ViewIncidentModal } from "@/components/ViewIncidentModal";
import { ExportOptionsModal } from "@/components/ExportOptionsModal";
import { IncidentListControls } from "@/components/IncidentListControls";
import { BulkBarMobile } from "@/components/BulkBarMobile";
import InlineAd from "@/components/ads/InlineAd";
import { OrganizedIncident, organizedIncidentStorage } from "@/utils/organizedIncidentStorage";
import { getAllCategories } from "@/utils/incidentCategories";
import { getPreferredDateTime } from "@/utils/timelineParser";
import { getDateSafely } from "@/utils/safeDate";
import { usePin } from "@/state/pin";
import { Button } from "@/components/ui/button";
import { AlertIcon } from "@/components/icons/CustomIcons";

export default function IncidentExplorer() {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportIncident, setExportIncident] = useState<OrganizedIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "category">("date");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const orderWithPins = usePin((s) => s.orderWithPins);
  const { toast } = useToast();

  // URL params for modal control
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentId = searchParams.get("incidentId");
  const mode = searchParams.get("mode"); // "edit" or null

  const loadIncidents = () => {
    try {
      const incidents = organizedIncidentStorage.getAll();
      setOrganizedIncidents(incidents);
    } catch (error) {
      console.error("Error loading incidents:", error);
      toast({
        title: "Load Failed",
        description: "Failed to load incidents from storage.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadIncidents();

    // listen for external updates
    const handleIncidentsUpdated = () => loadIncidents();
    window.addEventListener("incidentsUpdated", handleIncidentsUpdated);
    return () => window.removeEventListener("incidentsUpdated", handleIncidentsUpdated);
  }, []);

  // filter + sort
  useEffect(() => {
    let filtered = organizedIncidents;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const searchNorm = searchTerm.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      filtered = filtered.filter((incident) =>
        (incident.title && incident.title.toLowerCase().includes(searchLower)) ||
        incident.what.toLowerCase().includes(searchLower) ||
        incident.who.toLowerCase().includes(searchLower) ||
        incident.where.toLowerCase().includes(searchLower) ||
        incident.categoryOrIssue.toLowerCase().includes(searchLower) ||
        incident.notes.toLowerCase().includes(searchLower) ||
        (incident.caseNumber && incident.caseNumber.toLowerCase().includes(searchLower)) ||
        (incident.caseNumber &&
          searchNorm &&
          incident.caseNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().includes(searchNorm))
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((i) => i.categoryOrIssue === filterCategory);
    }

    if (sortBy === "date") {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      filtered = filtered.sort((a, b) => a.categoryOrIssue.localeCompare(b.categoryOrIssue));
    }

    setFilteredIncidents(filtered);
  }, [organizedIncidents, searchTerm, filterCategory, sortBy]);

  const handleViewIncident = (incident: OrganizedIncident) => setSearchParams({ incidentId: incident.id });
  const handleCloseIncidentModal = () => setSearchParams({});
  const handleExport = (incident: OrganizedIncident) => setExportIncident(incident);

  const handleDeleteIncident = async (id: string) => {
    try {
      organizedIncidentStorage.delete(id);
      loadIncidents();
      setDeleteId(null);
      toast({ title: "Incident Deleted", description: "The incident has been permanently removed." });
    } catch (error) {
      console.error("Error deleting incident:", error);
      toast({ title: "Delete Failed", description: "Failed to delete incident. Please try again.", variant: "destructive" });
    }
  };

  const getCategoryTagClass = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("safety") || lower.includes("accident") || lower.includes("injury")) return "category-safety";
    if (lower.includes("harassment") || lower.includes("discrimination") || lower.includes("bullying")) return "category-harassment";
    if (lower.includes("wrongful") || lower.includes("accusation") || lower.includes("false")) return "category-accusation";
    if (lower.includes("policy") || lower.includes("violation") || lower.includes("misconduct")) return "category-policy";
    return "category-default";
  };

  return (
    <>
      {/* Section Title and Search/Filter Controls */}
      <div className="mb-6 space-y-4" data-incident-reports-section>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold text-foreground">Workplace Incident Reports</h2>
          <p className="text-xs text-muted-foreground">View, edit, export, or delete any past incident reports</p>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by keyword, person, or Case #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 rounded-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {getAllCategories().map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incidents list */}
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
            <IncidentListControls visibleIds={filteredIncidents.map((i) => i.id)} />

            {filteredIncidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <SearchIcon className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="text-sm font-medium mb-1">No incidents found</h3>
                  <p className="text-xs text-muted-foreground text-center">Try adjusting your search terms or filters.</p>
                </CardContent>
              </Card>
            ) : (
              orderWithPins(filteredIncidents).map((incident, index) => (
                <React.Fragment key={incident.id}>
                  <IncidentCard
                    incident={incident}
                    index={index}
                    pageIds={orderWithPins(filteredIncidents).map((i) => i.id)}
                    onView={() => handleViewIncident(incident)}
                    onExport={() => handleExport(incident)}
                    onDelete={() => setDeleteId(incident.id)}
                    onUpdate={loadIncidents}
                    getCategoryTagClass={getCategoryTagClass}
                    initialEditMode={mode === "edit" && incident.id === incidentId}
                  />
                  {index === 6 && filteredIncidents.length > 7 && <InlineAd slot="home2" />}
                  {index === 18 && filteredIncidents.length > 19 && <InlineAd slot="home3" />}
                </React.Fragment>
              ))
            )}
          </>
        )}
      </div>

      <BulkBarMobile />

      {/* View Modal */}
      {incidentId && mode !== "edit" && (
        <ViewIncidentModal
          incident={organizedIncidents.find((i) => i.id === incidentId) || null}
          open={!!incidentId && mode !== "edit"}
          onOpenChange={(open) => !open && handleCloseIncidentModal()}
          onIncidentUpdate={loadIncidents}
        />
      )}

      {/* Export Modal */}
      <ExportOptionsModal
        incident={exportIncident}
        open={!!exportIncident}
        onOpenChange={(open) => !open && setExportIncident(null)}
      />

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">Delete Incident</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Are you sure you want to delete this incident? This action cannot be undone.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => deleteId && handleDeleteIncident(deleteId)} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl py-3 font-medium">
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setDeleteId(null)} className="w-full rounded-xl py-3 font-medium">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
