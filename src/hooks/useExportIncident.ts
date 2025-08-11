import { useMemo, useCallback } from 'react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { StructuredIncident } from '@/types/export';
import { generatePDF } from '@/utils/exportGenerators/pdfGenerator';
import { generateTXT } from '@/utils/exportGenerators/txtGenerator';
import { generateDOCX } from '@/utils/exportGenerators/docxGenerator';
import { useToast } from '@/hooks/use-toast';

export const useExportIncident = (incident: OrganizedIncident | null) => {
  const { toast } = useToast();

  const structuredIncident = useMemo((): StructuredIncident | null => {
    if (!incident) return null;

    return {
      id: incident.id,
      title: incident.categoryOrIssue,
      category: incident.categoryOrIssue,
      dateISO: incident.date,
      who: incident.who.split(',').map(w => w.trim()).filter(Boolean),
      where: incident.where,
      when: incident.when,
      witnesses: incident.witnesses.split(',').map(w => w.trim()).filter(Boolean),
      what: incident.what,
      summary: incident.notes,
      timeline: incident.timeline ? 
        incident.timeline.split('\n').filter(Boolean).map(line => ({ note: line.trim() })) : [],
      requests: incident.requests,
      policy: incident.policy,
      evidence: incident.evidence,
      notes: incident.notes,
      createdAtISO: incident.createdAt,
      updatedAtISO: incident.updatedAt,
    };
  }, [incident]);

  const createFileName = useCallback((extension: string): string => {
    if (!structuredIncident) return `incident.${extension}`;
    
    const date = structuredIncident.dateISO.slice(0, 10).replace(/[\/\s]/g, '-');
    const title = structuredIncident.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const id = structuredIncident.id.slice(0, 6);
    
    return `Incident_${date}_${title}_${id}.${extension}`;
  }, [structuredIncident]);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportPDF = useCallback(async () => {
    if (!structuredIncident) return;
    
    try {
      const blob = await generatePDF(structuredIncident);
      const filename = createFileName('pdf');
      downloadFile(blob, filename);
      
      toast({
        title: "PDF Downloaded",
        description: `${filename} has been saved to your device.`
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Couldn't generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  }, [structuredIncident, createFileName, downloadFile, toast]);

  const exportTXT = useCallback(async () => {
    if (!structuredIncident) return;
    
    try {
      const content = generateTXT(structuredIncident);
      const blob = new Blob([content], { type: 'text/plain' });
      const filename = createFileName('txt');
      downloadFile(blob, filename);
      
      toast({
        title: "TXT Downloaded",
        description: `${filename} has been saved to your device.`
      });
    } catch (error) {
      console.error('TXT export error:', error);
      toast({
        title: "Export Failed",
        description: "Couldn't generate text file. Please try again.",
        variant: "destructive"
      });
    }
  }, [structuredIncident, createFileName, downloadFile, toast]);

  const exportDOCX = useCallback(async () => {
    if (!structuredIncident) return;
    
    try {
      const blob = await generateDOCX(structuredIncident);
      const filename = createFileName('docx');
      downloadFile(blob, filename);
      
      toast({
        title: "DOCX Downloaded",
        description: `${filename} has been saved to your device.`
      });
    } catch (error) {
      console.error('DOCX export error:', error);
      toast({
        title: "Export Failed",
        description: "Couldn't generate Word document. Please try again.",
        variant: "destructive"
      });
    }
  }, [structuredIncident, createFileName, downloadFile, toast]);

  const exportPrint = useCallback(() => {
    if (!structuredIncident) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow popups and try again.",
        variant: "destructive"
      });
      return;
    }

    const printContent = generateTXT(structuredIncident).replace(/\n/g, '<br>');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incident Report - ${structuredIncident.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .metadata { color: #888; font-size: 0.9em; margin-bottom: 20px; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }, [structuredIncident, toast]);

  const exportEmail = useCallback(async () => {
    if (!structuredIncident) return;

    try {
      // Check if Web Share API with files is supported
      if (navigator.share && navigator.canShare) {
        const pdfBlob = await generatePDF(structuredIncident);
        const filename = createFileName('pdf');
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Incident Report — ${structuredIncident.title}`,
            text: `Incident report from ${structuredIncident.dateISO}`,
            files: [file]
          });
          return;
        }
      }

      // Fallback to mailto with PDF download
      await exportPDF();
      
      const subject = encodeURIComponent(`Incident Report — ${structuredIncident.dateISO} — ${structuredIncident.title}`);
      const body = encodeURIComponent(
        `Please find attached the incident report.\n\n` +
        `Category: ${structuredIncident.category}\n` +
        `Date: ${structuredIncident.dateISO}\n` +
        `Created: ${new Date(structuredIncident.createdAtISO).toLocaleDateString()}\n\n` +
        `Note: PDF file has been downloaded separately.`
      );
      
      window.open(`mailto:?subject=${subject}&body=${body}`);
      
      toast({
        title: "Email Ready",
        description: "PDF downloaded and email app opened.",
      });
    } catch (error) {
      console.error('Email export error:', error);
      toast({
        title: "Email Failed",
        description: "Please download the PDF and attach manually.",
        variant: "destructive"
      });
    }
  }, [structuredIncident, createFileName, exportPDF, toast]);

  const exportShare = useCallback(async () => {
    if (!structuredIncident) return;

    if (!navigator.share) {
      toast({
        title: "Share Not Supported",
        description: "Sharing is not supported on this device.",
        variant: "destructive"
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(structuredIncident);
      const filename = createFileName('pdf');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Incident Report — ${structuredIncident.title}`,
          text: `Incident report from ${structuredIncident.dateISO}`,
          files: [file]
        });
      } else {
        // Fallback to text sharing
        const textContent = generateTXT(structuredIncident);
        await navigator.share({
          title: `Incident Report — ${structuredIncident.title}`,
          text: textContent
        });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled sharing
        return;
      }
      
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Please try downloading and sharing manually.",
        variant: "destructive"
      });
    }
  }, [structuredIncident, createFileName, toast]);

  const exportSave = useCallback(async () => {
    await exportPDF();
  }, [exportPDF]);

  return {
    exportPDF,
    exportTXT,
    exportDOCX,
    exportPrint,
    exportEmail,
    exportShare,
    exportSave,
    isReady: !!structuredIncident
  };
};