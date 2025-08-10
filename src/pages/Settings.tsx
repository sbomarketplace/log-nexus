import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PolicyModal } from '@/components/PolicyModal';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [policyModal, setPolicyModal] = useState<{ open: boolean; type: 'terms' | 'privacy' | 'cookies' | null }>({
    open: false,
    type: null
  });

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

  const openPolicyModal = (type: 'terms' | 'privacy' | 'cookies') => {
    setPolicyModal({ open: true, type });
  };

  const closePolicyModal = () => {
    setPolicyModal({ open: false, type: null });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-medium text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage your incident reporting preferences and data
          </p>
        </div>


        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleExport} size="sm">
                Export Data
              </Button>
              <Button variant="outline" onClick={handleImport} size="sm">
                Import Data
              </Button>
              <Button variant="destructive" size="sm">
                Clear All Data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
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
          <CardContent className="space-y-3">
            <div className="space-y-2">
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

        {/* Policies Section */}
        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => openPolicyModal('terms')} 
                size="sm"
                className="justify-start"
              >
                View Terms & Conditions
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openPolicyModal('privacy')} 
                size="sm"
                className="justify-start"
              >
                View Privacy Policy
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openPolicyModal('cookies')} 
                size="sm"
                className="justify-start"
              >
                View Cookie Policy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Review the policies that govern your use of ClearCase. Effective Date: 2025-08-09
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="sm">
            Save Settings
          </Button>
        </div>

        {/* Policy Modal */}
        <PolicyModal
          open={policyModal.open}
          onOpenChange={closePolicyModal}
          type={policyModal.type || 'terms'}
        />
      </div>
    </Layout>
  );
};

export default Settings;