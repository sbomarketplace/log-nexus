// src/pages/Incidents.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, X } from "lucide-react";

import { IncidentCard } from "@/components/IncidentCard";
import { IncidentListControls } from "@/components/IncidentListControls";
import { BulkBarMobile } from "@/components/BulkBarMobile";
import { ViewIncidentModal } from "@/components/ViewIncidentModal";
import { ExportOptionsModal } from "@/components/ExportOptionsModal";

import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { usePin } from "@/state/pin";
import { getAllCategories } from "@/utils/incidentCategories";
import { OrganizedIncident, organizedIncidentStorage } from "@/utils/organizedIncidentStorage";

const IncidentsPage: React.FC = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportIncident, setExportIncident] = useState<OrganizedIncident | null>(null);

  const orderWithPins = usePin((s) => s.orderWithPins);
  const { toast } = useToast();

  // URL params for opening the view modal
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentId = searchParams.get("incidentId");

  const loadIncidents = () => {
    try {
      const incidents = organizedIncidentStorage.getAll();
      setOrganizedIncidents(incidents);
    } catch (e) {
      console.error(e);
      toast({
        title: "Load Failed",
        description: "Failed to load incidents from storage.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadIncidents();
    const onUpdated = () => loadIncidents();
    window.addEventListener("incidentsUpdated", onUpdated);
    return () => window.removeEventListener("incidentsUpdated", onUpdated);
  }, []);

  const filteredIncidents = useMemo(() => {
    let list = organizedIncidents;

    // text search
    const q = searchTerm.trim().toLowerCase();
    const qNorm = searchTerm.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (q) {
      list = list.filter((i) =>
        (i.title && i.title.toLowerCase().includes(q)) ||
        i.what.toLowerCase().includes(q) ||
        i.who.toLowerCase().includes(q) ||
        i.where.toLowerCase().includes(q) ||
        i.categoryOrIssue.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q) ||
        (i.caseNumber && i.caseNumber.toLowerCase().includes(q)) ||
        (i.caseNumber &&
          qNorm &&
          i.caseNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().includes(qNorm))
      );
    }

    // category filter
    if (filterCategory !== "all") {
      list = list.filter((i) => i.categoryOrIssue === filterCategory);
    }

    // newest first
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [organizedIncidents, searchTerm, filterCategory]);

  const handleViewIncident = (incident: OrganizedIncident) => {
    setSearchParams({ incidentId: incident.id });
  };

  const handleCloseIncidentModal = () => setSearchParams({});

  const handleDeleteIncident = async (id: string) => {
    try {
      organizedIncidentStorage.delete(id);
      loadIncidents();
      setDeleteId(null);
      toast({ title: "Incident Deleted", description: "The incident has been removed." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Delete Failed",
        description: "Failed to delete incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCategoryTagClass = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("safety") || c.includes("accident") || c.includes("injury")) return "category-safety";
    if (c.includes("harassment") || c.includes("discrimination") || c.includes("bullying")) return "category-harassment";
    if (c.includes("wrongful") || c.includes("accusation") || c.includes("false")) return "category-accusation";
    if (c.includes("policy") || c.includes("violation") || c.includes("misconduct")) return "category-policy";
    return "category-default";
  };

  return (
    <Layout>
      {/* NOTE: No extra bottom padding here — the Layout shell manages header/footer spacing */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold text-foreground">Workplace Incident Reports</h2>
          <p className="text-xs text-muted-foreground">
            View, edit, export, or delete any past incident reports
          </p>
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

        {/* Category filter */}
        <div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {getAllCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk bar + list */}
        <IncidentListControls visibleIds={filteredIncidents.map((i) => i.id)} />

        <div className="space-y-3">
          {organizedIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SearchIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents recorded</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Create a new incident or organize notes to get started.
                </p>
              </CardContent>
            </Card>
          ) : filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SearchIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents found</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Try changing your search or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            orderWithPins(filteredIncidents).map((incident, index) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                index={index}
                pageIds={orderWithPins(filteredIncidents).map((i) => i.id)}
                onView={() => handleViewIncident(incident)}
                onExport={() => setExportIncident(incident)}
                onDelete={() => setDeleteId(incident.id)}
                onUpdate={loadIncidents}
                getCategoryTagClass={getCategoryTagClass}
              />
            ))
          )}
        </div>

        <BulkBarMobile />

        {/* Modals */}
        {incidentId && (
          <ViewIncidentModal
            incident={organizedIncidents.find((i) => i.id === incidentId) || null}
            open={!!incidentId}
            onOpenChange={(open) => !open && handleCloseIncidentModal()}
            onIncidentUpdate={loadIncidents}
          />
        )}

        <ExportOptionsModal
          incident={exportIncident}
          open={!!exportIncident}
          onOpenChange={(open) => !open && setExportIncident(null)}
        />

        {/* Simple delete confirm */}
        {deleteId && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setDeleteId(null)} />
            <div className="fixed inset-0 z-50 grid place-items-center p-4">
              <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">Delete Incident</h2>
                  <p className="text-muted-foreground text-sm">This cannot be undone.</p>
                </div>
                <div className="space-y-3">
                  <Button onClick={() => handleDeleteIncident(deleteId)} className="w-full bg-destructive text-destructive-foreground">
                    Delete
                  </Button>
                  <Button variant="outline" onClick={() => setDeleteId(null)} className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default IncidentsPage;
