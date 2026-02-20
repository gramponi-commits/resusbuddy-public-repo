import type { ReactNode, SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface ClinicalIconProps extends SVGProps<SVGSVGElement> {
  children: ReactNode;
}

function ClinicalIconBase({ className, children, ...props }: ClinicalIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

export function MonitorLineIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="M7 10h2l1.3-2.2 1.5 4.2 1.4-2h3.8" />
    </ClinicalIconBase>
  );
}

export function FlatlineIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <path d="M3 12h18" />
    </ClinicalIconBase>
  );
}

export function CapnographyWaveIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <path d="M3 16h5V9h6l2 1v6h5" />
    </ClinicalIconBase>
  );
}

export function EcmoIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <path d="M12 2 22 12 12 22 2 12 12 2Z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 6v1.5M12 16.5V18M6 12h1.5M16.5 12H18" />
      <path d="m8.1 8.1 1.1 1.1m5.6 5.6 1.1 1.1m0-7.8-1.1 1.1m-5.6 5.6-1.1 1.1" />
    </ClinicalIconBase>
  );
}

export function CowboyHatIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <path d="M2.5 16.2c2.1-1.6 5.4-2.5 9.5-2.5s7.4.9 9.5 2.5" />
      <path d="M3.5 17.9c1.8.9 4.7 1.4 8.5 1.4s6.7-.5 8.5-1.4" />
      <path d="M6.8 15.2c.2-2.9.8-5.2 1.8-6.9.6-1 1.6-1.6 2.7-1.6h1.4c1.1 0 2.1.6 2.7 1.6 1 1.7 1.6 4 1.8 6.9" />
      <path d="M9.5 8.4c.3.9 1.3 1.5 2.5 1.5s2.2-.6 2.5-1.5" />
      <path d="M8.4 12.1h7.2" />
      <path d="M4.2 16.7c.7-.2 1.3-.7 1.8-1.5" />
      <path d="M19.8 16.7c-.7-.2-1.3-.7-1.8-1.5" />
    </ClinicalIconBase>
  );
}

export function HourglassIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M8 3c0 3 2 5 4 6 2-1 4-3 4-6" />
      <path d="M8 21c0-3 2-5 4-6 2 1 4 3 4 6" />
    </ClinicalIconBase>
  );
}

export function CprHandIcon({ className, ...props }: IconProps) {
  return (
    <ClinicalIconBase className={className} {...props}>
      {/* Palm */}
      <path d="M8 14c0 2.5 1.5 4.5 4 5s4.5-.5 5-3V11" />
      {/* Fingers */}
      <path d="M17 11V6.5a1 1 0 0 0-2 0V10" />
      <path d="M15 10V5a1 1 0 0 0-2 0v5" />
      <path d="M13 10V4.5a1 1 0 0 0-2 0V10" />
      <path d="M11 10V5.5a1 1 0 0 0-2 0V12" />
      {/* Thumb */}
      <path d="M9 12 7 10.5a1 1 0 0 0-1.4 1.4L8 14" />
    </ClinicalIconBase>
  );
}
