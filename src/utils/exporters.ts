import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { deriveIncidentTime, formatHHMMForUI, normalizeTimeToHHMM } from "@/utils/datetime";
import { briefIncidentSummary } from "@/utils/briefSummary";

type Incident = {
  id: string;
  date?: string;
  when?: string | null; // or time
  time?: string | null;
  category?: string;
  categoryOrIssue?: string;
  who?: string;
  what?: string;
  where?: string;
  witnesses?: string;
  notes?: string;
  summary?: string;
  // allow unknowns
  [k: string]: any;
};

function fmtDate(s?: string) {
  if (!s) return "Unknown date";
  const d = new Date(String(s));
  return isNaN(d.getTime()) ? "Unknown date" : d.toLocaleDateString();
}

function fmtTime(incident: Incident): string {
  const derivedTime = deriveIncidentTime(incident);
  return derivedTime ? formatHHMMForUI(derivedTime) : "Time unspecified";
}

export function buildPlainText(incident: Incident) {
  const timeStr = fmtTime(incident);
  const category = incident.categoryOrIssue ?? incident.category ?? "";
  const brief = briefIncidentSummary(incident);
  
  return [
    `Incident Report`,
    `ID: ${incident.id}`,
    `Date: ${fmtDate(incident.date)}${timeStr ? ` at ${timeStr}` : ""}`,
    `Category: ${category}`,
    ``,
    `Summary: ${brief}`,
    ``,
    `Who:`,
    incident.who ?? "",
    ``,
    `What:`,
    incident.what ?? "",
    ``,
    `Where:`,
    incident.where ?? "",
    ``,
    `Witnesses:`,
    incident.witnesses ?? "",
    ``,
    `Notes:`,
    incident.notes ?? "",
    ``,
    `Incident Summary:`,
    incident.summary ?? ""
  ].join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportTXT(incident: Incident) {
  const txt = buildPlainText(incident);
  downloadBlob(new Blob([txt], { type: "text/plain" }), `incident_${incident.id}.txt`);
}

export async function exportPDF(incident: Incident) {
  const doc = new jsPDF();
  const lines = buildPlainText(incident).split("\n");
  const left = 14, topStart = 18, lineH = 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  let y = topStart;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 180);
    for (const w of wrapped) {
      if (y > 280) { doc.addPage(); y = topStart; }
      doc.text(w, left, y);
      y += lineH;
    }
  }
  const blob = doc.output("blob");
  downloadBlob(blob, `incident_${incident.id}.pdf`);
  return blob;
}

export async function exportDOCX(incident: Incident) {
  const sections: Paragraph[] = [];
  const category = incident.categoryOrIssue ?? incident.category ?? "";
  
  function addHeading(text: string) {
    sections.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
  }
  function addText(text: string) {
    sections.push(new Paragraph({ children: [new TextRun(text)] }));
  }
  
  addHeading("Incident Report");
  addText(`ID: ${incident.id}`);
  addText(`Date: ${fmtDate(incident.date)}`);
  addText(`Time: ${fmtTime(incident)}`);
  addText(`Category: ${category}`);
  addText("");
  addHeading("Summary");
  addText(briefIncidentSummary(incident));
  addHeading("Who");
  addText(incident.who ?? "");
  addHeading("What");
  addText(incident.what ?? "");
  addHeading("Where");
  addText(incident.where ?? "");
  addHeading("Witnesses");
  addText(incident.witnesses ?? "");
  addHeading("Notes");
  addText(incident.notes ?? "");
  addHeading("Incident Summary");
  addText(incident.summary ?? "");

  const doc = new Document({ sections: [{ properties: {}, children: sections }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `incident_${incident.id}.docx`);
  return blob;
}

export async function exportPrint(incident: Incident) {
  const category = incident.categoryOrIssue ?? incident.category ?? "";
  
  const html = `
<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Incident ${incident.id}</title>
<style>
  body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding:24px;}
  h1,h2{margin:0 0 8px;}
  .group{margin:14px 0;}
  .label{font-weight:600;margin-bottom:4px;}
  pre{white-space:pre-wrap;}
</style>
</head><body>
  <h1>Incident Report</h1>
  <div class="group"><div class="label">ID</div>${incident.id}</div>
  <div class="group"><div class="label">Date</div>${fmtDate(incident.date)}</div>
  <div class="group"><div class="label">Time</div>${fmtTime(incident)}</div>
  <div class="group"><div class="label">Category</div>${category}</div>
  <div class="group"><div class="label">Summary</div><pre>${briefIncidentSummary(incident)}</pre></div>
  <div class="group"><div class="label">Who</div><pre>${incident.who ?? ""}</pre></div>
  <div class="group"><div class="label">What</div><pre>${incident.what ?? ""}</pre></div>
  <div class="group"><div class="label">Where</div><pre>${incident.where ?? ""}</pre></div>
  <div class="group"><div class="label">Witnesses</div><pre>${incident.witnesses ?? ""}</pre></div>
  <div class="group"><div class="label">Notes</div><pre>${incident.notes ?? ""}</pre></div>
  <div class="group"><div class="label">Incident Summary</div><pre>${incident.summary ?? ""}</pre></div>
  <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300);};</script>
</body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export async function exportPDFToDevice(incident: Incident) {
  const blob = await exportPDF(incident);
  // Try Web Share with file for a better mobile save flow
  const file = new File([blob], `incident_${incident.id}.pdf`, { type: "application/pdf" });
  if ((navigator as any).canShare?.({ files: [file] })) {
    try { await (navigator as any).share({ files: [file], title: "Incident Report" }); return; } catch {}
  }
  // else we already downloaded via exportPDF
}

export async function shareIncident(incident: Incident) {
  const txt = buildPlainText(incident);
  if (navigator.share) {
    try { await navigator.share({ title: "Incident Report", text: txt }); return; } catch {}
  }
  alert("Sharing is not supported on this device. Use Email or download instead.");
}

export async function emailIncident(incident: Incident) {
  // Try to attach PDF via Web Share files on mobile
  const blob = await exportPDF(incident);
  const file = new File([blob], `incident_${incident.id}.pdf`, { type: "application/pdf" });
  if ((navigator as any).canShare?.({ files: [file] })) {
    try { await (navigator as any).share({ files: [file], title: "Incident Report", text: buildPlainText(incident) }); return; } catch {}
  }
  // Fallback to mailto with prefilled body
  const subject = encodeURIComponent(`Incident Report ${incident.id}`);
  const body = encodeURIComponent(`Summary: ${briefIncidentSummary(incident)}\n\n${buildPlainText(incident)}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Bulk Export Functions
import JSZip from "jszip";
import { firstTimeFromTimeline } from "@/utils/datetime";

function sanitizeCSV(v: any): string {
  const s = (v ?? "").toString().replace(/"/g, '""').replace(/\r?\n|\r/g, " ");
  return `"${s}"`;
}

function dateISO(s?: string) {
  if (!s) return "";
  const d = new Date(String(s));
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0,10);
}

function oneLine(text?: string) {
  return (text ?? "").toString().replace(/\s+/g, " ").trim();
}

function countArray(x: any): number {
  if (!x) return 0;
  if (Array.isArray(x)) return x.length;
  if (typeof x === "string") return x.length ? x.split(",").length : 0;
  return 0;
}

function getTags(i: any): string {
  const t = i?.tags;
  if (Array.isArray(t)) return t.join(", ");
  if (typeof t === "string") return t;
  return "";
}

function maybeRedact(text: string, on: boolean) {
  // conservative pass: mask Proper Names like "John Doe" -> "J. D."
  return on ? text.replace(/\b([A-Z])[a-z]+(?:\s+[A-Z][a-z]+)?\b/g, (_, a) => `${a}.`) : text;
}

export type BulkExportOptions = {
  order?: "asc" | "desc";
  includeDetails?: boolean;   // respected in other formats
  redact?: boolean;           // masks names in text fields
};

function downloadBlobBulk(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Combined PDF (all incidents in one file)
export async function exportBulkSinglePDF(incidents: any[], opts: BulkExportOptions = {}) {
  const doc = new jsPDF();
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();

  let pageCount = 0;
  for (const incident of sorted) {
    if (pageCount > 0) doc.addPage();
    
    const lines = buildPlainText(incident).split("\n");
    const left = 14, topStart = 18, lineH = 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    let y = topStart;
    
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line, 180);
      for (const w of wrapped) {
        if (y > 280) { doc.addPage(); y = topStart; }
        doc.text(w, left, y);
        y += lineH;
      }
    }
    pageCount++;
  }
  
  const blob = doc.output("blob");
  const name = `clearcase_incidents_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlobBulk(blob, name);
}

// ZIP of individual PDFs
export async function exportBulkZipPDFs(incidents: any[], opts: BulkExportOptions = {}) {
  const zip = new JSZip();
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();

  for (const incident of sorted) {
    const blob = await exportPDF(incident);
    const date = incident.date ? new Date(incident.date).toISOString().slice(0, 10) : "unknown-date";
    const title = (incident.title || incident.category || "incident").replace(/[^\w\s-]/g, "").slice(0, 30);
    const filename = `${date}_${title}_${incident.id}.pdf`;
    zip.file(filename, blob);
  }
  
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const name = `clearcase_incidents_${new Date().toISOString().slice(0, 10)}.zip`;
  downloadBlobBulk(zipBlob, name);
}

// CSV Export
export async function exportBulkCSV(incidents: any[], opts: BulkExportOptions = {}) {
  const redact = !!opts.redact;
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();

  const header = [
    "id", "date_iso", "time_hhmm", "category", "title", "summary_brief",
    "what", "where", "who", "witnesses",
    "timeline_first_time", "timeline",
    "case_number", "tags", "attachments_count",
    "created_at", "updated_at", "created_by", "status", "severity", "redact_applied"
  ];

  const rows = sorted.map((i: any) => {
    const hhmm = normalizeTimeToHHMM(deriveIncidentTime(i)) || "";
    const tlFirst = normalizeTimeToHHMM(firstTimeFromTimeline(i?.summary || i?.notes)) || "";
    const title = i?.title || i?.category || "";
    const brief = briefIncidentSummary(i);
    const timelineText = oneLine(i?.timeline || i?.summary || "");
    const attachmentsCount = countArray(i?.attachments) || countArray(i?.files) || (typeof i?.attachments_count === "number" ? i.attachments_count : 0);
    const createdBy = i?.created_by_email || i?.created_by || i?.owner_email || "";

    return [
      i?.id ?? "",
      dateISO(i?.date),
      hhmm,
      i?.category ?? "",
      maybeRedact(title, redact),
      maybeRedact(brief, redact),
      maybeRedact(oneLine(i?.what), redact),
      maybeRedact(oneLine(i?.where), redact),
      maybeRedact(oneLine(i?.who), redact),
      maybeRedact(oneLine(i?.witnesses), redact),
      tlFirst,
      maybeRedact(timelineText, redact),
      i?.case_number ?? i?.caseNo ?? "",
      getTags(i),
      attachmentsCount,
      i?.created_at ?? "",
      i?.updated_at ?? "",
      createdBy,
      i?.status ?? "",
      i?.severity ?? "",
      redact ? "true" : "false"
    ].map(sanitizeCSV).join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const name = `clearcase_incidents_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlobBulk(blob, name);
}

// ZIP of DOCX files
export async function exportBulkDocxZip(incidents: any[], opts: BulkExportOptions = {}) {
  const zip = new JSZip();
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();

  for (const incident of sorted) {
    const blob = await exportDOCX(incident);
    const date = incident.date ? new Date(incident.date).toISOString().slice(0, 10) : "unknown-date";
    const title = (incident.title || incident.category || "incident").replace(/[^\w\s-]/g, "").slice(0, 30);
    const filename = `${date}_${title}_${incident.id}.docx`;
    zip.file(filename, blob);
  }
  
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const name = `clearcase_incidents_${new Date().toISOString().slice(0, 10)}.zip`;
  downloadBlobBulk(zipBlob, name);
}

// ZIP of TXT files
export async function exportBulkTxtZip(incidents: any[], opts: BulkExportOptions = {}) {
  const zip = new JSZip();
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();

  for (const incident of sorted) {
    const txt = buildPlainText(incident);
    const date = incident.date ? new Date(incident.date).toISOString().slice(0, 10) : "unknown-date";
    const title = (incident.title || incident.category || "incident").replace(/[^\w\s-]/g, "").slice(0, 30);
    const filename = `${date}_${title}_${incident.id}.txt`;
    zip.file(filename, txt);
  }
  
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const name = `clearcase_incidents_${new Date().toISOString().slice(0, 10)}.zip`;
  downloadBlobBulk(zipBlob, name);
}

// Share multiple incidents
export async function exportBulkShare(incidents: any[], opts: BulkExportOptions = {}) {
  if (navigator.share) {
    try {
      // For multiple incidents, share as a summary text
      const summary = incidents.map(i => `${i.title || i.category}: ${briefIncidentSummary(i)}`).join("\n\n");
      await navigator.share({ 
        title: `${incidents.length} Incident Reports`, 
        text: summary 
      }); 
      return;
    } catch {}
  }
  
  // Fallback: create and download a ZIP of PDFs
  await exportBulkZipPDFs(incidents, opts);
}

// Print multiple incidents
export async function exportBulkPrint(incidents: any[], opts: BulkExportOptions = {}) {
  const sorted = [...incidents].sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime());
  if (opts.order === "desc") sorted.reverse();
  
  const incidentHtmls = sorted.map(incident => {
    const category = incident.categoryOrIssue ?? incident.category ?? "";
    return `
      <div class="incident-page">
        <h2>Incident Report</h2>
        <div class="group"><div class="label">ID</div>${incident.id}</div>
        <div class="group"><div class="label">Date</div>${fmtDate(incident.date)}</div>
        <div class="group"><div class="label">Time</div>${fmtTime(incident)}</div>
        <div class="group"><div class="label">Category</div>${category}</div>
        <div class="group"><div class="label">Summary</div><pre>${briefIncidentSummary(incident)}</pre></div>
        <div class="group"><div class="label">Who</div><pre>${incident.who ?? ""}</pre></div>
        <div class="group"><div class="label">What</div><pre>${incident.what ?? ""}</pre></div>
        <div class="group"><div class="label">Where</div><pre>${incident.where ?? ""}</pre></div>
        <div class="group"><div class="label">Witnesses</div><pre>${incident.witnesses ?? ""}</pre></div>
        <div class="group"><div class="label">Notes</div><pre>${incident.notes ?? ""}</pre></div>
        <div class="group"><div class="label">Incident Summary</div><pre>${incident.summary ?? ""}</pre></div>
      </div>
    `;
  }).join('<div class="page-break"></div>');

  const html = `
<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Multiple Incident Reports</title>
<style>
  body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding:24px;}
  h1,h2{margin:0 0 8px;}
  .group{margin:14px 0;}
  .label{font-weight:600;margin-bottom:4px;}
  pre{white-space:pre-wrap;}
  .incident-page{margin-bottom:40px;}
  .page-break{page-break-before:always;}
  @media print {
    .page-break{page-break-before:always;}
  }
</style>
</head><body>
  <h1>Multiple Incident Reports (${incidents.length} incidents)</h1>
  ${incidentHtmls}
  <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300);};</script>
</body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// Export HTML content to PDF for resource documents
export async function exportHtmlToPdf(title: string, htmlElement: HTMLElement) {
  const doc = new jsPDF();
  const margins = { left: 14, top: 18, right: 14, bottom: 18 };
  const pageWidth = doc.internal.pageSize.getWidth() - margins.left - margins.right;
  
  // Create a clean filename from title
  const filename = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) + '.pdf';

  // Extract text content and convert to PDF
  const textContent = htmlElement.innerText || htmlElement.textContent || '';
  const lines = textContent.split('\n').filter(line => line.trim());
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  let y = margins.top;
  const lineHeight = 7;
  const maxY = doc.internal.pageSize.getHeight() - margins.bottom;
  
  // Add title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, pageWidth);
  for (const titleLine of titleLines) {
    if (y > maxY - 10) {
      doc.addPage();
      y = margins.top;
    }
    doc.text(titleLine, margins.left, y);
    y += lineHeight + 2;
  }
  
  y += 5; // Extra space after title
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  // Add content
  for (const line of lines) {
    if (!line.trim()) {
      y += lineHeight / 2; // Smaller space for empty lines
      continue;
    }
    
    // Check if it's a heading (starts with #)
    if (line.startsWith('#')) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      y += 3; // Extra space before headings
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
    }
    
    const wrappedLines = doc.splitTextToSize(line.replace(/^#+\s*/, ''), pageWidth);
    for (const wrappedLine of wrappedLines) {
      if (y > maxY - 10) {
        doc.addPage();
        y = margins.top;
      }
      doc.text(wrappedLine, margins.left, y);
      y += lineHeight;
    }
    
    // Reset font after headings
    if (line.startsWith('#')) {
      y += 2; // Extra space after headings
    }
  }
  
  const blob = doc.output("blob");
  downloadBlob(blob, filename);
  return blob;
}