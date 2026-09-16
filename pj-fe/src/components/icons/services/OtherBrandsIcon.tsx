interface IconProps {
  size?: number;
  className?: string;
}

export function OtherBrandsIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <path fill="#55BFA8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M33 48h50l-5 47H38z" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M45 48c0-13 26-13 26 0" />
      <path fill="#FFA9A0" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m78 61 22 5 4 22-18 18-22-22z" />
      <circle cx="86" cy="73" r="4" fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path fill="#FFE382" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m87 84 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zM28 28l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </svg>
  );
}
