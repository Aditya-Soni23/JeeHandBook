import React from 'react';
import { BRANDING } from '../config/constants';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#EAEAEA] text-[#737373] text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="DIAMOND Logo" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.svg";
            }}
            className="h-6 w-auto object-contain max-w-[28px] rounded" 
          />
          <span className="font-extrabold text-[#171717]">{BRANDING.brandName}</span>
          <span className="text-gray-300">·</span>
          <span>DIAMOND JEE HANDBOOK (289 Pages)</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
          <a href={`mailto:${BRANDING.contactEmail}`} className="hover:text-blue-600 transition-colors">
            {BRANDING.contactEmail}
          </a>
          <span>·</span>
          <a 
            href={BRANDING.whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
          >
            WhatsApp: +91 9154995314
          </a>
          <span>·</span>
          <span>UPI: 9154995314@fam</span>
          <span>·</span>
          <span>{BRANDING.footerCopyright}</span>
        </div>
      </div>
    </footer>
  );
};
