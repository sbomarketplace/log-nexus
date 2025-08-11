import { Button } from '@/components/ui/button';
import { Phone, Mail, Edit2, Trash2, Star } from 'lucide-react';
import { Contact } from '@/utils/contactsStorage';
import { PhoneLink } from '@/components/PhoneLink';

interface ContactCardProps {
  contact: Contact;
  roleId: string;
  onEdit: (roleId: string, contact: Contact) => void;
  onDelete: (roleId: string, contactId: string, contactName: string) => void;
  onTogglePrimary: (roleId: string, contactId: string) => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

export const ContactCard = ({ 
  contact, 
  roleId, 
  onEdit, 
  onDelete, 
  onTogglePrimary,
  onCall,
  onEmail 
}: ContactCardProps) => {
  const handlePhoneClick = () => {
    if (contact.phone) {
      if (onCall) {
        onCall(contact.phone);
      } else {
        window.open(`tel:${contact.phone}`);
      }
    }
  };

  const handleEmailClick = () => {
    if (contact.email) {
      if (onEmail) {
        onEmail(contact.email);
      } else {
        window.open(`mailto:${contact.email}`);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2.5 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header Row - Name and Title */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-gray-900">
              {contact.name}
              {contact.title && (
                <span className="font-normal text-xs text-gray-500 ml-1">
                  — {contact.title}
                </span>
              )}
            </h4>
            {contact.primary && (
              <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
            )}
          </div>
        </div>
        
        {/* Action Icons Row - Top Right */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePrimary(roleId, contact.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-500"
            title={contact.primary ? 'Remove primary' : 'Make primary'}
          >
            <Star className={`h-3 w-3 ${contact.primary ? 'text-yellow-500 fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(roleId, contact)}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Edit contact"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(roleId, contact.id, contact.name)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete contact"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Contact Info Row - Phone and Email on separate lines */}
      <div className="space-y-1.5">
        {contact.phone && (
          <div className="flex items-center gap-2">
            <Phone 
              className="h-4 w-4 text-gray-400 hover:text-primary transition-colors cursor-pointer flex-shrink-0" 
              onClick={handlePhoneClick}
            />
            <PhoneLink 
              phone={contact.phone}
              className="text-xs text-primary hover:underline transition-colors break-all"
            />
          </div>
        )}
        
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail 
              className="h-4 w-4 text-gray-400 hover:text-primary transition-colors cursor-pointer flex-shrink-0" 
              onClick={handleEmailClick}
            />
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => {
                e.preventDefault();
                handleEmailClick();
              }}
              className="text-xs text-primary hover:underline transition-colors break-all"
            >
              {contact.email}
            </a>
          </div>
        )}
      </div>

    </div>
  );
};