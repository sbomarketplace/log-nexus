import React from 'react';
import { cleanPhoneForTel } from '@/utils/phoneUtils';

interface PhoneLinkProps {
  phone: string;
  className?: string;
  children?: React.ReactNode;
}

export const PhoneLink: React.FC<PhoneLinkProps> = ({ 
  phone, 
  className = "text-primary hover:underline transition-colors", 
  children 
}) => {
  const cleanNumber = cleanPhoneForTel(phone);
  
  return (
    <a
      href={`tel:${cleanNumber}`}
      className={className}
      aria-label={`Call ${phone}`}
    >
      {children || phone}
    </a>
  );
};