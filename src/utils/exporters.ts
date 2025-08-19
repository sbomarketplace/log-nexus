import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { deriveIncidentTime, formatHHMMForUI, normalizeTimeToHHMM } from "@/utils/datetime";

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
  
  return [
    `Incident Report`,
    `ID: ${incident.id}`,
    `Date: ${fmtDate(incident.date)}${timeStr ? ` at ${timeStr}` : ""}`,
    `Category: ${category}`,
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
  const body = encodeURIComponent(buildPlainText(incident));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}