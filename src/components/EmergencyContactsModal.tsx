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
import { ContactCard } from '@/components/ContactCard';

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
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
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
    setEditingRoleId(roleId);
    setEditingContact(null);
    setErrors({});
    
    // Ensure the role is expanded
    setExpandedRoles(prev => ({ ...prev, [roleId]: true }));
    
    // Auto-focus the first field after render
    setTimeout(() => {
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 100);
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
    setEditingRoleId(roleId);
    setEditingContact(contact);
    setErrors({});
    
    // Ensure the role is expanded
    setExpandedRoles(prev => ({ ...prev, [roleId]: true }));
    
    // Auto-focus the first field after render
    setTimeout(() => {
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 100);
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
    if (!editingRoleId || !validateForm()) return;
    
    const roleData = data?.roles[editingRoleId];
    if (!roleData) return;
    
    if (editingContact) {
      // Update existing contact
      contactsStorage.updateContact(editingRoleId, editingContact.id, formData);
    } else {
      // Add new contact
      contactsStorage.addContact(editingRoleId, formData);
    }
    
    loadData();
    setEditingRoleId(null);
    setEditingContact(null);
    toast({
      title: editingContact ? 'Contact updated' : 'Contact added',
      description: `${formData.name} has been ${editingContact ? 'updated' : 'added'} to ${roleData.name}.`,
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
      <DialogContent className="cc-modal max-w-md w-[calc(100vw-2rem)] max-h-[min(72vh,720px)] rounded-xl shadow-2xl border-2 flex flex-col overflow-hidden p-0">
        {/* Modal Header - Fixed */}
        <header className="cc-modal__header flex-shrink-0 px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">
              Emergency Contacts
            </DialogTitle>
          </div>
        </header>

        {/* Modal Body - Scrollable */}
        <section className="cc-modal__body flex-1 overflow-y-auto px-4 py-3 bg-background relative" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
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

          {/* Roles and Contacts */}
          <div className="space-y-3 mb-4">
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
                      {/* Inline Editor - Rendered at top of role section */}
                      {editingRoleId === roleId && (
                        <div className="border border-border rounded-2xl p-4 bg-accent/30 mb-3">
                          <fieldset className="space-y-3">
                            <legend className="font-medium text-sm mb-3 flex items-center gap-2">
                              {editingContact ? 'Edit Contact' : 'Add Contact'}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingRoleId(null);
                                  setEditingContact(null);
                                }}
                                className="h-6 w-6 p-0 ml-auto"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </legend>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="name" className="text-xs font-medium">
                                  Full Name *
                                </Label>
                                <Input
                                  id="name"
                                  value={formData.name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                  className="h-10 text-sm"
                                  placeholder="Enter full name"
                                />
                                {errors.name && (
                                  <p className="text-xs text-destructive mt-1 leading-tight">{errors.name}</p>
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
                                  className="h-10 text-sm"
                                  placeholder="Job title"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                  className="h-10 text-sm"
                                  placeholder="(555) 123-4567"
                                />
                                {errors.phone && (
                                  <p className="text-xs text-destructive mt-1 leading-tight">{errors.phone}</p>
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
                                  className="h-10 text-sm"
                                  placeholder="email@example.com"
                                />
                                {errors.email && (
                                  <p className="text-xs text-destructive mt-1 leading-tight">{errors.email}</p>
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
                                className="h-16 max-h-[120px] text-sm resize-none"
                                placeholder="Additional notes (120 chars max)"
                                maxLength={120}
                              />
                              <div className="flex justify-between mt-1">
                                {errors.notes && (
                                  <p className="text-xs text-destructive leading-tight">{errors.notes}</p>
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
                                  onClick={() => {
                                    setEditingRoleId(null);
                                    setEditingContact(null);
                                  }}
                                  className="h-8 text-xs px-3"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={saveContact}
                                  disabled={!formData.name.trim() || Object.keys(errors).length > 0}
                                  className="h-8 text-xs px-3"
                                  aria-label={`Save contact to ${role.name}`}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      )}

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
                              <ContactCard
                                key={contact.id}
                                contact={contact}
                                roleId={roleId}
                                onEdit={startEditContact}
                                onDelete={deleteContact}
                                onTogglePrimary={togglePrimary}
                                onCall={handleCall}
                                onEmail={handleEmail}
                              />
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

        </section>

      </DialogContent>
    </Dialog>
  );
};