export interface Person {
  name: string;
  role?: string;
}

export interface UnionInvolvement {
  name: string;
  union: string;
  role?: string;
  notes?: string;
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  time: string;
  summary: string;
  location?: string; // Enhanced: extracted location
  category?: string; // Enhanced: inferred category
  peopleInvolved?: string[]; // Enhanced: quick list of people names
  who: Person[];
  what: string;
  where: string;
  why: string;
  how: string;
  witnesses?: Person[];
  unionInvolvement?: UnionInvolvement[];
  files?: string[];
  tags?: string[];
  folder?: string;
  rewrittenSummary?: string;
}