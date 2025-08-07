import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared for download.",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Complete",
      description: "Data has been successfully imported.",
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your incident reporting preferences and data
          </p>
        </div>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Your Company Name"
                  defaultValue="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Input
                  id="dept"
                  placeholder="Human Resources"
                  defaultValue="Human Resources"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Organization address"
                defaultValue="123 Business St, Corporate City, CC 12345"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Primary Contact</Label>
                <Input
                  id="contact-name"
                  placeholder="Contact person name"
                  defaultValue="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@company.com"
                  defaultValue="hr@acmecorp.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  placeholder="(555) 123-4567"
                  defaultValue="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Emergency Line</Label>
                <Input
                  id="emergency-phone"
                  placeholder="(555) 987-6543"
                  defaultValue="(555) 987-6543"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={handleExport}>
                Export Data
              </Button>
              <Button variant="outline" onClick={handleImport}>
                Import Data
              </Button>
              <Button variant="destructive">
                Clear All Data
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your incident data to a JSON file for backup or transfer to another system.
              Import allows you to restore from a previous backup.
            </p>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="email-notifications" defaultChecked />
                <Label htmlFor="email-notifications">Email notifications for new incidents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="reminder-notifications" defaultChecked />
                <Label htmlFor="reminder-notifications">Reminder notifications for follow-ups</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="summary-reports" />
                <Label htmlFor="summary-reports">Weekly summary reports</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;