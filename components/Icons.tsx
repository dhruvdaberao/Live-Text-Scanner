import React from 'react';

type IconProps = {
  className?: string;
};

export const CameraIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export const ClipboardCheckIcon: React.FC<IconProps> = ({ className = "w-5 h-5 text-green-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l3.9-3.9a1 1 0 0 0-1.4-1.4l-1.4 1.4-1.4-1.4a1 1 0 0 0-1.4 0Z" />
        <path d="m9.3 17.7-1.4-1.4a1 1 0 0 0-1.4 0L2.6 20.2a1 1 0 0 0 1.4 1.4l3.9-3.9a1 1 0 0 0 0-1.4l-1.4-1.4Z" />
        <path d="M14.7 17.7a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0l-3.9 3.9a1 1 0 0 0 1.4 1.4l1.4-1.4 1.4 1.4a1 1 0 0 0 1.4 0Z" />
        <path d="m9.3 6.3 1.4 1.4a1 1 0 0 0 1.4 0l3.9-3.9a1 1 0 1 0-1.4-1.4L12.7 5 11.3 3.5a1 1 0 0 0-1.4 0L6 7.4a1 1 0 0 0 1.4 1.4l1.9-1.9Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
  </svg>
);