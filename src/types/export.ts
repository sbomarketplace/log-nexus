export interface StructuredIncident {
  id: string;
  title: string;
  category: string;
  dateISO: string;
  who: string[];
  where: string;
  when: string;
  witnesses: string[];
  what: string;
  summary: string;
  timeline: Array<{ time?: string; note: string }>;
  requests?: string;
  policy?: string;
  evidence?: string;
  notes: string;
  createdAtISO: string;
  updatedAtISO?: string;
}

export interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void | Promise<void>;
  disabled?: boolean;
}