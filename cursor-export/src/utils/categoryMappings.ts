export const INCIDENT_CATEGORIES = {
  "Workplace Conduct": [
    "Harassment (Verbal, Physical, Sexual)",
    "Discrimination (Race, Gender, Age, Disability, etc.)",
    "Retaliation",
    "Bullying / Intimidation",
    "Threats / Violence",
  ],
  "Policy & Compliance": [
    "Substance Abuse / Drug or Alcohol Policy Violation",
    "Safety Violation (OSHA, PPE, Hazard Reporting)",
    "Attendance / Tardiness",
    "Insubordination / Refusal to Follow Instructions",
    "Policy Violation (General)",
  ],
  "Operational / Incident-Based": [
    "Property Damage",
    "Equipment Misuse or Failure",
    "Unauthorized Access / Security Breach",
    "Theft / Missing Property",
    "Accident / Injury",
  ],
  "Other": [
    "Performance Issue",
    "Miscommunication / Procedural Error",
    "Other (Specify in Notes)",
  ],
} as const;

export const getAllCategories = (): string[] => {
  return Object.values(INCIDENT_CATEGORIES).flat();
};

export const getCategoryOptions = () => {
  return Object.entries(INCIDENT_CATEGORIES).map(([group, items]) => ({
    group,
    items,
  }));
};

// Category badge class mapping
export const getCategoryTagClass = (category: string): string => {
  if (!category) return "category-default";
  
  const lower = category.toLowerCase();
  
  if (lower.includes("safety") || lower.includes("violation") || lower.includes("accident") || lower.includes("injury")) {
    return "category-safety";
  }
  if (lower.includes("harassment") || lower.includes("discrimination") || lower.includes("bullying") || lower.includes("threats")) {
    return "category-harassment";
  }
  if (lower.includes("accusation") || lower.includes("breach") || lower.includes("unauthorized")) {
    return "category-accusation";  
  }
  if (lower.includes("policy") || lower.includes("compliance") || lower.includes("substance")) {
    return "category-policy";
  }
  
  return "category-default";
};