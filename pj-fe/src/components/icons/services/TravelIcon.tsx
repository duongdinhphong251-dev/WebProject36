interface IconProps {
  size?: number;
  className?: string;
}

export function TravelIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <rect x="25" y="48" width="34" height="44" rx="6" fill="#8C74C9" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M34 48v-8h16v8M34 92v8M50 92v8M36 58v24M48 58v24" />
      <path fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m70 67 32-18 6 7-27 26-3 20-8 3-3-17-17-3 3-8z" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M91 57 75 41M87 89c9 0 16 3 16 7s-7 7-16 7-16-3-16-7" />
      <path fill="#FFE382" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m22 31 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
    </svg>
  );
}
