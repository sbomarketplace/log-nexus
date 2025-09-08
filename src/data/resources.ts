import { type ResourcesData } from "./resources.schema";

export const RESOURCES: ResourcesData = [
  {
    id: "workplace-incident-documentation",
    title: "Workplace Incident Documentation",  
    items: [
      {
        id: "incident-reporting-guidelines",
        title: "Incident Reporting Guidelines",
        tag: "PDF Guide",
        description: "Comprehensive guide on proper workplace incident documentation",
        purpose: "Ensures consistent and thorough documentation of workplace incidents for legal compliance, safety analysis, and prevention of future occurrences.",
        actions: [
          { kind: "link", label: "View Guide", value: "/src/content/resources/incident-reporting-guidelines.md" }
        ]
      },
      {
        id: "emergency-contact-list",
        title: "Emergency Contact List",
        tag: "Interactive Tool",
        description: "Manage your workplace emergency contacts",
        purpose: "Provides quick access to emergency contacts with the ability to call or email directly. All data is stored locally on your device.",
        actions: [
          { kind: "link", label: "Open Tool", value: "#emergency-contacts" }
        ]
      },
      {
        id: "investigation-checklist",
        title: "Investigation Checklist",
        tag: "Checklist",
        description: "Step-by-step checklist for conducting incident investigations",
        purpose: "Ensures thorough and systematic investigation of workplace incidents to identify causes and prevent recurrence.",
        actions: [
          { kind: "link", label: "View Checklist", value: "/src/content/resources/investigation-checklist.md" }
        ]
      }
    ]
  },
  {
    id: "government-legal-resources",
    title: "Government & Legal Resources",
    items: [
      {
        id: "eeoc",
        title: "EEOC (Equal Employment Opportunity Commission)",
        tag: "Federal Agency",
        description: "Federal agency enforcing workplace discrimination laws",
        purpose: "Enforces laws prohibiting workplace discrimination and retaliation. Provides guidance on equal employment rights and investigates discrimination complaints.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.eeoc.gov" },
          { kind: "phone", label: "Phone", value: "tel:+18006694000" }
        ]
      },
      {
        id: "us-department-of-labor",
        title: "U.S. Department of Labor (DOL)",
        tag: "Federal Department",
        description: "Federal department overseeing labor laws and workplace conditions",
        purpose: "Oversees labor laws, workplace conditions, wages, and discrimination cases. Enforces federal employment standards and workplace safety regulations.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.dol.gov" },
          { kind: "phone", label: "Phone", value: "tel:+18664USWAGE" }
        ]
      },
      {
        id: "nlrb",
        title: "National Labor Relations Board (NLRB)",
        tag: "Federal Board",
        description: "Federal agency protecting employees' rights to organize",
        purpose: "Enforces labor laws, protects unionizing and bargaining rights, and investigates unfair labor practices.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.nlrb.gov" },
          { kind: "phone", label: "Phone", value: "tel:+18447626572" }
        ]
      },
      {
        id: "ada-information-line",
        title: "ADA Information Line",
        tag: "Information Service",
        description: "Americans with Disabilities Act resources and guidance",
        purpose: "Protects workers with disabilities from discrimination and provides legal resources for ADA compliance and enforcement.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.ada.gov" },
          { kind: "phone", label: "Phone", value: "tel:+18005140301" }
        ]
      }
    ]
  },
  {
    id: "safety-health",
    title: "Safety & Health",
    items: [
      {
        id: "osha",
        title: "OSHA (Occupational Safety and Health Administration)",
        tag: "Federal Agency",
        description: "Federal agency ensuring safe working conditions",
        purpose: "Ensures safe working conditions, handles workplace safety complaints, and enforces occupational health and safety standards.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.osha.gov" },
          { kind: "phone", label: "Phone", value: "tel:+18003216742" }
        ]
      },
      {
        id: "safety-protocols",
        title: "Safety Protocols",
        tag: "Document",
        description: "Standard operating procedures for workplace safety",
        purpose: "Provides standardized safety procedures to prevent workplace injuries and ensure regulatory compliance.",
        actions: [
          { kind: "link", label: "View Document", value: "#safety-protocols" }
        ]
      },
      {
        id: "workers-rights-injury-advocacy",
        title: "Workers' Rights and Injury Advocacy",
        tag: "Advocacy Group",
        description: "Non-profit organizations advocating for injured workers",
        purpose: "Non-profits advocating for injured workers and offering legal help, resources, and support for workplace injury claims.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.worker.org" }
        ]
      }
    ]
  },
  {
    id: "civil-rights-advocacy",
    title: "Civil Rights & Advocacy",
    items: [
      {
        id: "naacp",
        title: "NAACP (National Association for the Advancement of Colored People)",
        tag: "Civil Rights Organization",
        description: "Civil rights organization fighting racial discrimination",
        purpose: "Advocates against racial discrimination and for equal rights in all areas, including employment and workplace fairness.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.naacp.org" },
          { kind: "phone", label: "Phone", value: "tel:+18776222298" }
        ]
      },
      {
        id: "aclu",
        title: "ACLU (American Civil Liberties Union)",
        tag: "Civil Liberties Organization",
        description: "Organization protecting constitutional rights and civil liberties",
        purpose: "Protects civil rights and liberties, including workplace rights, freedom of speech, and protection from discrimination.",
        actions: [
          { kind: "link", label: "Website", value: "https://www.aclu.org" },
          { kind: "phone", label: "Contact varies by state", value: "tel:+1" }
        ]
      },
      {
        id: "state-human-rights-commissions",
        title: "State Human Rights Commissions",
        tag: "State Agency",
        description: "State-level agencies handling discrimination cases",
        purpose: "Handles state-level discrimination, harassment, and retaliation cases. Provides investigation services and legal remedies.",
        actions: [
          { kind: "link", label: "Find Local Commission", value: "#state-commissions" }
        ]
      },
      {
        id: "workplace-injury-legal-aid",
        title: "Workplace Injury Legal Aid",
        tag: "Legal Service",
        description: "Legal assistance for workplace injury and discrimination claims",
        purpose: "Legal assistance for workplace injury claims and discrimination cases. Provides representation and advocacy for injured workers.",
        actions: [
          { kind: "link", label: "Find Local Aid", value: "#legal-aid" }
        ]
      }
    ]
  }
];