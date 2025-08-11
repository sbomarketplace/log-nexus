export interface Contact {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  notes?: string;
  priority?: number;
  primary?: boolean;
}

export interface ContactRole {
  name: string;
  contacts: Contact[];
}

export interface ContactsData {
  version: number;
  updatedAt: string;
  roles: Record<string, ContactRole>;
}

const STORAGE_KEY = 'clearcase_emergency_contacts_v1';

const DEFAULT_ROLES = {
  'hr-manager': { name: 'HR Manager', contacts: [] },
  'supervisor': { name: 'Supervisor / Manager', contacts: [] },
  'safety': { name: 'Safety / Security', contacts: [] },
  'first-aid': { name: 'First Aid / Medical', contacts: [] },
  'union-steward': { name: 'Union Steward', contacts: [] },
  'business-rep': { name: 'Business Representative', contacts: [] },
  'legal': { name: 'Legal / Attorney', contacts: [] },
  'facilities': { name: 'Facilities / Building Security', contacts: [] },
};

export const contactsStorage = {
  load(): ContactsData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Ensure all default roles exist
        const roles = { ...DEFAULT_ROLES, ...data.roles };
        return { ...data, roles };
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
    
    // Return default structure
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      roles: DEFAULT_ROLES,
    };
  },

  save(data: ContactsData): void {
    try {
      const dataToSave = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save contacts:', error);
    }
  },

  addContact(roleId: string, contact: Omit<Contact, 'id'>): void {
    const data = this.load();
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
    };
    
    if (!data.roles[roleId]) {
      data.roles[roleId] = { name: roleId, contacts: [] };
    }
    
    // If this is being marked as primary, remove primary from others
    if (newContact.primary) {
      data.roles[roleId].contacts.forEach(c => c.primary = false);
    }
    
    data.roles[roleId].contacts.push(newContact);
    this.save(data);
  },

  updateContact(roleId: string, contactId: string, updates: Partial<Contact>): void {
    const data = this.load();
    const role = data.roles[roleId];
    if (!role) return;
    
    const contactIndex = role.contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) return;
    
    // If making this contact primary, remove primary from others
    if (updates.primary) {
      role.contacts.forEach(c => c.primary = false);
    }
    
    role.contacts[contactIndex] = { ...role.contacts[contactIndex], ...updates };
    this.save(data);
  },

  deleteContact(roleId: string, contactId: string): void {
    const data = this.load();
    const role = data.roles[roleId];
    if (!role) return;
    
    role.contacts = role.contacts.filter(c => c.id !== contactId);
    this.save(data);
  },

  setPrimary(roleId: string, contactId: string): void {
    const data = this.load();
    const role = data.roles[roleId];
    if (!role) return;
    
    // Remove primary from all contacts in this role
    role.contacts.forEach(c => c.primary = false);
    
    // Set the specified contact as primary
    const contact = role.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.primary = true;
    }
    
    this.save(data);
  },

  exportData(): string {
    const data = this.load();
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.version && data.roles) {
        this.save(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import contacts:', error);
      return false;
    }
  },
};