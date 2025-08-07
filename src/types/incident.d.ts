export interface Incident {
  id: string;
  date: string;
  time: string;
  title: string;
  summary: string;
  who: {
    name: string;
    role?: string;
  }[];
  what: string;
  where: string;
  why: string;
  how: string;
  witnesses?: {
    name: string;
    role?: string;
  }[];
  unionInvolvement?: {
    name: string;
    union: string;
    role?: string;
    notes?: string;
  }[];
  files?: string[];
  rewrittenSummary?: string;
  folder?: string;
  tags?: string[];
}