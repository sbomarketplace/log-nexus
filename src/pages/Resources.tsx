import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ResourceModal } from '@/components/ResourceModal';
import { EmergencyContactsModal } from '@/components/EmergencyContactsModal';
import { ResourceViewer } from '@/components/ResourceViewer';
import { 
  FileIcon, 
  ChevronDown, 
  Shield, 
  Scale, 
  Heart, 
  Users,
  Building,
  Gavel,
  Phone,
  AlertTriangle
} from 'lucide-react';

/** Reusable inner content of Resources, no page-container wrapper */
export function ResourcesSection() {
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [resourceViewerOpen, setResourceViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{ title: string; mdPath: string }>({ title: '', mdPath: '' });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Load from localStorage with fallback to all closed
    try {
      const saved = localStorage.getItem('resources_open_sections');
      return saved ? JSON.parse(saved) : {
        workplace: false,
        government: false,
        safety: false,
        advocacy: false
      };
    } catch {
      return {
        workplace: false,
        government: false,
        safety: false,
        advocacy: false
      };
    }
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Save open sections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('resources_open_sections', JSON.stringify(openSections));
    } catch (error) {
      console.warn('Failed to save resources open sections to localStorage:', error);
    }
  }, [openSections]);

  const openResourceModal = (resource: any) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  const openResourceViewer = (title: string, mdPath: string) => {
    setViewerConfig({ title, mdPath });
    setResourceViewerOpen(true);
  };

  const resourceCategories = {
    workplace: {
      title: 'Workplace Incident Documentation',
      icon: FileIcon,
      resources: [
        {
          title: 'Incident Reporting Guidelines',
          description: 'Comprehensive guide on proper workplace incident documentation',
          fullDescription: 'This comprehensive guide provides step-by-step instructions for documenting workplace incidents, including required information, proper forms, timelines, and best practices for accurate reporting.',
          purpose: 'Ensures consistent and thorough documentation of workplace incidents for legal compliance, safety analysis, and prevention of future occurrences.',
          type: 'PDF Guide',
          isViewable: true,
          mdPath: 'incident-reporting-guidelines.md'
        },
        {
          title: 'Emergency Contact List',
          description: 'Manage your workplace emergency contacts',
          fullDescription: 'An interactive contact manager where you can add, edit, and organize emergency contacts by role. Supports click-to-call/email functionality and local storage.',
          purpose: 'Provides quick access to emergency contacts with the ability to call or email directly. All data is stored locally on your device.',
          type: 'Interactive Tool',
          isInteractive: true,
          action: () => setContactsModalOpen(true)
        },
        {
          title: 'Investigation Checklist',
          description: 'Step-by-step checklist for conducting incident investigations',
          fullDescription: 'A detailed checklist covering all aspects of workplace incident investigation including evidence collection, witness interviews, root cause analysis, and corrective action planning.',
          purpose: 'Ensures thorough and systematic investigation of workplace incidents to identify causes and prevent recurrence.',
          type: 'Checklist',
          isViewable: true,
          mdPath: 'investigation-checklist.md'
        }
      ]
    },
    government: {
      title: 'Government & Legal Resources',
      icon: Gavel,
      resources: [
        {
          title: 'EEOC (Equal Employment Opportunity Commission)',
          description: 'Federal agency enforcing workplace discrimination laws',
          fullDescription: 'The EEOC is responsible for enforcing federal laws that make it illegal to discriminate against job applicants or employees because of race, color, religion, sex, national origin, age, disability, or genetic information.',
          purpose: 'Enforces laws prohibiting workplace discrimination and retaliation. Provides guidance on equal employment rights and investigates discrimination complaints.',
          type: 'Federal Agency',
          website: 'https://www.eeoc.gov',
          phone: '1-800-669-4000'
        },
        {
          title: 'U.S. Department of Labor (DOL)',
          description: 'Federal department overseeing labor laws and workplace conditions',
          fullDescription: 'The DOL promotes and develops the welfare of job seekers, wage earners, and retirees by improving working conditions, advancing opportunities for profitable employment, and protecting retirement and health care benefits.',
          purpose: 'Oversees labor laws, workplace conditions, wages, and discrimination cases. Enforces federal employment standards and workplace safety regulations.',
          type: 'Federal Department',
          website: 'https://www.dol.gov',
          phone: '1-866-4-USWAGE'
        },
        {
          title: 'National Labor Relations Board (NLRB)',
          description: 'Federal agency protecting employees\' rights to organize',
          fullDescription: 'The NLRB protects the rights of employees to act together to address conditions at work, with or without a union. This includes investigating and prosecuting violations of federal labor law.',
          purpose: 'Enforces labor laws, protects unionizing and bargaining rights, and investigates unfair labor practices.',
          type: 'Federal Board',
          website: 'https://www.nlrb.gov',
          phone: '1-844-762-NLRB'
        },
        {
          title: 'ADA Information Line',
          description: 'Americans with Disabilities Act resources and guidance',
          fullDescription: 'Provides information and technical assistance on the Americans with Disabilities Act (ADA) to businesses, state and local governments, and persons with disabilities.',
          purpose: 'Protects workers with disabilities from discrimination and provides legal resources for ADA compliance and enforcement.',
          type: 'Information Service',
          website: 'https://www.ada.gov',
          phone: '1-800-514-0301'
        }
      ]
    },
    safety: {
      title: 'Safety & Health',
      icon: Shield,
      resources: [
        {
          title: 'OSHA (Occupational Safety and Health Administration)',
          description: 'Federal agency ensuring safe working conditions',
          fullDescription: 'OSHA ensures safe and healthful working conditions by setting and enforcing standards and providing training, outreach, education, and assistance to workers and employers.',
          purpose: 'Ensures safe working conditions, handles workplace safety complaints, and enforces occupational health and safety standards.',
          type: 'Federal Agency',
          website: 'https://www.osha.gov',
          phone: '1-800-321-OSHA'
        },
        {
          title: 'Safety Protocols',
          description: 'Standard operating procedures for workplace safety',
          fullDescription: 'Comprehensive safety protocols covering personal protective equipment, hazard identification, emergency procedures, and compliance with OSHA standards.',
          purpose: 'Provides standardized safety procedures to prevent workplace injuries and ensure regulatory compliance.',
          type: 'Document'
        },
        {
          title: 'Workers\' Rights and Injury Advocacy',
          description: 'Non-profit organizations advocating for injured workers',
          fullDescription: 'Organizations dedicated to protecting the rights of injured workers, providing legal assistance, and advocating for fair workers\' compensation and workplace safety improvements.',
          purpose: 'Non-profits advocating for injured workers and offering legal help, resources, and support for workplace injury claims.',
          type: 'Advocacy Group',
          website: 'https://www.worker.org'
        }
      ]
    },
    advocacy: {
      title: 'Civil Rights & Advocacy',
      icon: Users,
      resources: [
        {
          title: 'NAACP (National Association for the Advancement of Colored People)',
          description: 'Civil rights organization fighting racial discrimination',
          fullDescription: 'The NAACP works to eliminate race-based discrimination and ensure the health, education, political, and economic equality of minority group citizens.',
          purpose: 'Advocates against racial discrimination and for equal rights in all areas, including employment and workplace fairness.',
          type: 'Civil Rights Organization',
          website: 'https://www.naacp.org',
          phone: '1-877-NAACP-98'
        },
        {
          title: 'ACLU (American Civil Liberties Union)',
          description: 'Organization protecting constitutional rights and civil liberties',
          fullDescription: 'The ACLU works to defend and preserve individual rights and liberties guaranteed by the Constitution and laws of the United States.',
          purpose: 'Protects civil rights and liberties, including workplace rights, freedom of speech, and protection from discrimination.',
          type: 'Civil Liberties Organization',
          website: 'https://www.aclu.org',
          phone: 'Varies by state'
        },
        {
          title: 'State Human Rights Commissions',
          description: 'State-level agencies handling discrimination cases',
          fullDescription: 'State agencies responsible for enforcing anti-discrimination laws and investigating complaints of discrimination, harassment, and retaliation in employment and other areas.',
          purpose: 'Handles state-level discrimination, harassment, and retaliation cases. Provides investigation services and legal remedies.',
          type: 'State Agency',
          website: 'Varies by state'
        },
        {
          title: 'Workplace Injury Legal Aid',
          description: 'Legal assistance for workplace injury and discrimination claims',
          fullDescription: 'Legal aid organizations and attorneys specializing in workplace injury claims, workers\' compensation, and employment discrimination cases.',
          purpose: 'Legal assistance for workplace injury claims and discrimination cases. Provides representation and advocacy for injured workers.',
          type: 'Legal Service',
          website: 'Varies by location'
        }
      ]
    }
  };

  return (
    <>
      {/* Resource Categories */}
      <div className="space-y-4">
        {Object.entries(resourceCategories).map(([key, category]) => {
          const IconComponent = category.icon;
          return (
            <Card key={key} className="overflow-hidden">
              <Collapsible
                open={openSections[key]}
                onOpenChange={() => toggleSection(key)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {category.title}
                        </CardTitle>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          openSections[key] ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="resources-acc-content">
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.resources.map((resource, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200"
                          onClick={() => {
                            if (resource.isInteractive && resource.action) {
                              resource.action();
                            } else if (resource.isViewable && resource.mdPath) {
                              openResourceViewer(resource.title, resource.mdPath);
                            } else {
                              openResourceModal(resource);
                            }
                          }}
                        >
                          <CardHeader className="pb-2 overflow-hidden">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-medium leading-tight break-words">
                                  {resource.title}
                                </CardTitle>
                              </div>
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded ml-2 flex-shrink-0">
                                {resource.type}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                              {resource.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Resource Modal */}
      <ResourceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        resource={selectedResource}
      />

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        open={contactsModalOpen}
        onOpenChange={setContactsModalOpen}
      />

      {/* Resource Viewer */}
      <ResourceViewer
        open={resourceViewerOpen}
        onOpenChange={setResourceViewerOpen}
        title={viewerConfig.title}
        mdPath={viewerConfig.mdPath}
      />
    </>
  );
}

const Resources = () => {
  return (
    <Layout>
      <div className="resources-page space-y-6 -mt-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-medium text-foreground">Resources</h1>
          <p className="text-xs text-muted-foreground opacity-80">
            Essential documents and guidelines for incident management
          </p>
          <Separator className="mt-3" />
        </div>

        <ResourcesSection />
      </div>
    </Layout>
  );
};

export default Resources;