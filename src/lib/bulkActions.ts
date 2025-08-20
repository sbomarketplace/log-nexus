import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useSelection } from "@/state/selection";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/lib/showToast";
import { supabase } from "@/integrations/supabase/client";
import { organizedIncidentStorage } from "@/utils/organizedIncidentStorage";

async function getIncidentMeta(id: string) {
  const incidents = organizedIncidentStorage.getAll();
  const incident = incidents.find(i => i.id === id);
  return {
    title: incident?.title || "Incident",
    date: incident?.date || null
  };
}

async function exportIncidentPdf(id: string): Promise<Blob> {
  const incidents = organizedIncidentStorage.getAll();
  const incident = incidents.find(i => i.id === id);
  
  if (!incident) {
    throw new Error(`Incident ${id} not found`);
  }

  // Use jsPDF to generate PDF blob
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  // Add content to PDF
  doc.setFontSize(16);
  doc.text(incident.title || 'Incident Report', 20, 20);
  
  doc.setFontSize(12);
  let yPos = 40;
  
  if (incident.date) {
    doc.text(`Date: ${incident.date}`, 20, yPos);
    yPos += 10;
  }
  
  if (incident.when) {
    doc.text(`Time: ${incident.when}`, 20, yPos);
    yPos += 10;
  }
  
  if (incident.caseNumber) {
    doc.text(`Case Number: ${incident.caseNumber}`, 20, yPos);
    yPos += 10;
  }
  
  if (incident.categoryOrIssue) {
    doc.text(`Category: ${incident.categoryOrIssue}`, 20, yPos);
    yPos += 20;
  }
  
  // Add sections
  const sections = [
    { title: 'Who', content: incident.who },
    { title: 'What', content: incident.what },
    { title: 'Where', content: incident.where },
    { title: 'Witnesses', content: incident.witnesses },
    { title: 'Quotes', content: incident.quotes },
    { title: 'Requests', content: incident.requests },
    { title: 'Notes', content: incident.notes }
  ];
  
  sections.forEach(section => {
    if (section.content?.trim()) {
      doc.text(`${section.title}:`, 20, yPos);
      yPos += 7;
      
      const lines = doc.splitTextToSize(section.content, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      yPos += 5;
    }
  });
  
  return doc.output('blob');
}

export async function bulkExport() {
  const { selected, clear } = useSelection.getState();
  const ids = Array.from(selected);
  if (!ids.length) return;

  showInfoToast(`Exporting ${ids.length} incident${ids.length > 1 ? 's' : ''}...`);

  try {
    const zip = new JSZip();
    const pool = 3;
    let i = 0;

    async function worker() {
      while (i < ids.length) {
        const id = ids[i++];
        try {
          const pdfBlob = await exportIncidentPdf(id);
          const incident = await getIncidentMeta(id);
          const safeTitle = (incident.title || "Incident")
            .replace(/[\\/:*?"<>|]+/g, "")
            .slice(0, 60);
          const filename = `${safeTitle}${incident.date ? ` - ${incident.date}` : ""}.pdf`;
          zip.file(filename, pdfBlob);
        } catch (error) {
          console.error(`Failed to export incident ${id}:`, error);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(pool, ids.length) }, worker));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `Incidents (${ids.length}).zip`);
    showSuccessToast("Export complete");
    clear();
  } catch (error) {
    console.error('Bulk export failed:', error);
    showErrorToast("Export failed", "Please try again");
  }
}

export async function bulkDelete() {
  const { selected, clear } = useSelection.getState();
  const ids = Array.from(selected);
  if (!ids.length) return;

  // Get incident titles for preview
  const incidents = organizedIncidentStorage.getAll();
  const previewTitles = ids
    .slice(0, 5)
    .map(id => incidents.find(i => i.id === id)?.title || 'Untitled')
    .filter(Boolean);

  const message = `This will permanently delete ${ids.length} incident${ids.length > 1 ? 's' : ''}:\n\n${previewTitles.join('\n')}${ids.length > 5 ? `\n...and ${ids.length - 5} more` : ''}`;

  const confirmed = window.confirm(message);
  if (!confirmed) return;

  try {
    // Delete from Supabase if using database
    const { error } = await supabase
      .from("incidents")
      .delete()
      .in("id", ids);

    if (error) {
      showErrorToast("Delete failed", error.message);
      return;
    }

    // Also delete from local storage - delete each one individually
    ids.forEach(id => {
      organizedIncidentStorage.delete(id);
    });

    showSuccessToast(`Deleted ${ids.length} incident${ids.length > 1 ? 's' : ''}`);
    clear();
    
    // Force page refresh to update the incident list
    window.location.reload();
  } catch (error) {
    console.error('Bulk delete failed:', error);
    showErrorToast("Delete failed", "Please try again");
  }
}