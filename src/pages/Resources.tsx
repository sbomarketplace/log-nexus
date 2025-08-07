import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon } from '@/components/icons/CustomIcons';

const Resources = () => {
  const resources = [
    {
      title: 'Incident Reporting Guidelines',
      description: 'Comprehensive guide on how to properly document workplace incidents.',
      type: 'PDF Guide',
      url: '#'
    },
    {
      title: 'Emergency Contact List',
      description: 'Important phone numbers and contacts for emergency situations.',
      type: 'Contact List',
      url: '#'
    },
    {
      title: 'Safety Protocols',
      description: 'Standard operating procedures for workplace safety.',
      type: 'Document',
      url: '#'
    },
    {
      title: 'Legal Requirements',
      description: 'Overview of legal obligations for incident reporting.',
      type: 'Legal Guide',
      url: '#'
    },
    {
      title: 'Training Materials',
      description: 'Educational resources for incident prevention and response.',
      type: 'Training',
      url: '#'
    },
    {
      title: 'Investigation Checklist',
      description: 'Step-by-step checklist for conducting incident investigations.',
      type: 'Checklist',
      url: '#'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Essential documents and guidelines for incident management
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileIcon className="h-8 w-8 text-primary mb-2" />
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {resource.type}
                  </span>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {resource.description}
                </p>
                <Button variant="outline" className="w-full">
                  View Resource
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">Emergency Hotline</h4>
                <p className="text-2xl font-bold text-destructive">911</p>
                <p className="text-sm text-muted-foreground">For immediate emergencies</p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">HR Department</h4>
                <p className="text-lg font-semibold">(555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Business hours: 9 AM - 5 PM</p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">Safety Officer</h4>
                <p className="text-lg font-semibold">(555) 987-6543</p>
                <p className="text-sm text-muted-foreground">Available 24/7</p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">Legal Department</h4>
                <p className="text-lg font-semibold">(555) 456-7890</p>
                <p className="text-sm text-muted-foreground">Business hours only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Resources;