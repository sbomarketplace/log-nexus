import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { OrganizedIncident } from "@/utils/organizedIncidentStorage";
import { deriveIncidentOccurrence, formatPrimaryChip } from "@/ui/incidentDisplay";
import { toast } from "sonner";

export async function shareIncident(i: OrganizedIncident) {
  const when = formatPrimaryChip(deriveIncidentOccurrence(i));
  const title = (i.title || "Incident").trim();
  const text = [
    `Title: ${title}`,
    when ? `Date: ${when}` : "",
    i.caseNumber ? `Case #: ${i.caseNumber}` : "",
    i.categoryOrIssue ? `Category: ${i.categoryOrIssue}` : "",
    i.what ? `What: ${i.what}` : "",
    i.where ? `Where: ${i.where}` : "",
    i.notes ? `Notes:\n${i.notes}` : "",
  ].filter(Boolean).join("\n");
  try {
    if (Capacitor.isNativePlatform()) return void (await Share.share({ title, text, dialogTitle:"Share Incident" }));
    if (navigator.share) return void (await navigator.share({ title, text }));
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch (e){ console.error(e); toast.error("Share failed"); }
}