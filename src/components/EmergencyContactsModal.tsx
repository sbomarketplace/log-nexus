import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  StarOff, 
  ChevronDown,
  Search,
  Copy,
  X,
  Users
} from 'lucide-react';
import { contactsStorage, Contact, ContactsData } from '@/utils/contactsStorage';

interface EmergencyContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [data, setData] = useState<ContactsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContact, setEditingContact] = useState<{ roleId: string; contact?: Contact } | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
    notes: '',
    priority: 1,
    primary: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = () => {
    const loadedData = contactsStorage.load();
    setData(loadedData);
    // Expand roles that have contacts
    const expanded: Record<string, boolean> = {};
    Object.entries(loadedData.roles).forEach(([roleId, role]) => {
      expanded[roleId] = role.contacts.length > 0;
    });
    setExpandedRoles(expanded);
  };

  const toggleRole = (roleId: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const startAddContact = (roleId: string) => {
    const roleName = data?.roles[roleId]?.name || roleId;
    setFormData({
      name: '',
      title: roleName,
      phone: '',
      email: '',
      notes: '',
      priority: 1,
      primary: false,
    });
    setEditingContact({ roleId });
    setErrors({});
  };

  const startEditContact = (roleId: string, contact: Contact) => {
    setFormData({
      name: contact.name,
      title: contact.title || '',
      phone: contact.phone || '',
      email: contact.email || '',
      notes: contact.notes || '',
      priority: contact.priority || 1,
      primary: contact.primary || false,
    });
    setEditingContact({ roleId, contact });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)\.]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.notes && formData.notes.length > 120) {
      newErrors.notes = 'Notes must be 120 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveContact = () => {
    if (!editingContact || !validateForm()) return;
    
    const { roleId, contact } = editingContact;
    
    if (contact) {
      // Update existing contact
      contactsStorage.updateContact(roleId, contact.id, formData);
    } else {
      // Add new contact
      contactsStorage.addContact(roleId, formData);
    }
    
    loadData();
    setEditingContact(null);
    toast({
      title: contact ? 'Contact updated' : 'Contact added',
      description: `${formData.name} has been ${contact ? 'updated' : 'added'} successfully.`,
    });
  };

  const deleteContact = (roleId: string, contactId: string, contactName: string) => {
    contactsStorage.deleteContact(roleId, contactId);
    loadData();
    toast({
      title: 'Contact deleted',
      description: `${contactName} has been removed.`,
    });
  };

  const togglePrimary = (roleId: string, contactId: string) => {
    contactsStorage.setPrimary(roleId, contactId);
    loadData();
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const formatPhone = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const filteredRoles = React.useMemo(() => {
    if (!data || !searchQuery.trim()) return data?.roles || {};
    
    const filtered: Record<string, any> = {};
    Object.entries(data.roles).forEach(([roleId, role]) => {
      const matchingContacts = role.contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingContacts.length > 0) {
        filtered[roleId] = { ...role, contacts: matchingContacts };
      }
    });
    
    return filtered;
  }, [data, searchQuery]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] rounded-xl shadow-2xl border-2">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-semibold">
                Emergency Contacts
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(data.updatedAt).toLocaleDateString()}
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Content */}
        <div className="space-y-3 overflow-y-auto max-h-[45vh] px-1">
          {Object.entries(filteredRoles).map(([roleId, role]) => (
            <div key={roleId} className="border border-border rounded-lg">
              <Collapsible
                open={expandedRoles[roleId]}
                onOpenChange={() => toggleRole(roleId)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{role.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {role.contacts.length}
                      </Badge>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedRoles[roleId] ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-2">
                    {role.contacts.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          No contacts added yet
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startAddContact(roleId)}
                          className="h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Contact
                        </Button>
                      </div>
                    ) : (
                      <>
                        {role.contacts
                          .sort((a, b) => {
                            if (a.primary && !b.primary) return -1;
                            if (!a.primary && b.primary) return 1;
                            return (a.priority || 1) - (b.priority || 1);
                          })
                          .map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-2 bg-background border border-border rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {contact.name}
                                  </h4>
                                  {contact.primary && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                {contact.title && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.title}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {contact.phone && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCall(contact.phone!)}
                                        className="h-6 w-6 p-0 hover:bg-primary/10"
                                      >
                                        <Phone className="h-3 w-3 text-primary" />
                                      </Button>
                                      <button
                                        onClick={() => copyToClipboard(contact.phone!, 'Phone')}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        {formatPhone(contact.phone)}
                                      </button>
                                    </div>
                                  )}
                                  {contact.email && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEmail(contact.email!)}
                                        className="h-6 w-6 p-0 hover:bg-primary/10"
                                      >
                                        <Mail className="h-3 w-3 text-primary" />
                                      </Button>
                                      <button
                                        onClick={() => copyToClipboard(contact.email!, 'Email')}
                                        className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[100px]"
                                      >
                                        {contact.email}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePrimary(roleId, contact.id)}
                                  className="h-7 w-7 p-0"
                                  title={contact.primary ? 'Remove primary' : 'Make primary'}
                                >
                                  {contact.primary ? (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  ) : (
                                    <StarOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditContact(roleId, contact)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteContact(roleId, contact.id, contact.name)}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startAddContact(roleId)}
                          className="w-full h-8 text-xs mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Contact
                        </Button>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        {/* Add/Edit Contact Form */}
        {editingContact && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium text-sm">
                {editingContact.contact ? 'Edit Contact' : 'Add Contact'}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-xs font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="title" className="text-xs font-medium">
                    Title/Role
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Job title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
                      }
                    }}
                    className="h-8 text-sm"
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs font-medium">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-16 text-sm resize-none"
                  placeholder="Additional notes (120 chars max)"
                  maxLength={120}
                />
                <div className="flex justify-between mt-1">
                  {errors.notes && (
                    <p className="text-xs text-destructive">{errors.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.notes.length}/120
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="primary"
                    checked={formData.primary}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="primary" className="text-xs">
                    Make primary contact
                  </Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingContact(null)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveContact}
                    className="h-8 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};