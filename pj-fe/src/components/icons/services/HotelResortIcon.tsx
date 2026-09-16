interface IconProps {
  size?: number;
  className?: string;
}

export function HotelResortIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <rect x="43" y="31" width="43" height="65" rx="4" fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <rect x="53" y="20" width="23" height="11" fill="#8C74C9" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M54 45h6M70 45h6M54 58h6M70 58h6M54 71h6M70 71h6" />
      <path fill="#8C74C9" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M58 96V82h14v14" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M22 96h84M25 96V64M25 64c-10 2-13 10-13 10M25 64c10 1 15 9 15 9M25 64c-3-13-13-19-13-19M25 64c6-13 16-18 16-18M104 96V64M104 64c-10 2-13 10-13 10M104 64c10 1 15 9 15 9M104 64c-3-13-13-19-13-19M104 64c6-13 16-18 16-18" />
    </svg>
  );
}
