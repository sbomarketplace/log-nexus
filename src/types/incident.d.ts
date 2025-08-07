export interface Incident {
  id: string;
  date: string;
  time: string;
  title: string;
  summary: string;
  who: string[];
  what: string;
  where: string;
  why: string;
  how: string;
  witnesses?: string[];
  unionInvolvement?: {
    name: string;
    union: string;
    notes?: string;
  }[];
  files?: string[];
  rewrittenSummary?: string;
  folder?: string;
}