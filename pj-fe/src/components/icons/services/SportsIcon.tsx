interface IconProps {
  size?: number;
  className?: string;
}

export function SportsIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <circle cx="45" cy="73" r="23" fill="#FFFDF8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m45 55 10 8-4 13H39l-4-13zM26 71l9-8M64 71l-9-8M35 86l4-10M55 86l-4-10" />
      <circle cx="83" cy="51" r="24" fill="#FFA9A0" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M83 27v48M59 51h48M66 35c12 8 22 8 34 0M66 67c12-8 22-8 34 0" />
      <circle cx="89" cy="88" r="13" fill="#55BFA8" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M76 88h26M89 75v26" />
      <path fill="#FFE382" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m102 25 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
    </svg>
  );
}
