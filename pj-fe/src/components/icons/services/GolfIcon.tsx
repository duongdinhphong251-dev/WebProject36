interface IconProps {
  size?: number;
  className?: string;
}

export function GolfIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M64 28v64M64 30h32l-8 10 8 10H64z" />
      <path fill="#FFA9A0" d="M64 30h32l-8 10 8 10H64z" />
      <ellipse cx="64" cy="94" fill="#55BFA8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" rx="35" ry="10" />
      <circle cx="35" cy="82" r="9" fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M31 80h0M39 80h0M35 86h0M36 69l38 29M35 69c10-8 18-17 24-29" />
      <path fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M35 69c10-8 18-17 24-29" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M58 38h10" />
    </svg>
  );
}
