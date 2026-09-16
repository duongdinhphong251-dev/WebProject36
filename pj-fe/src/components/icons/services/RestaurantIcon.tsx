interface IconProps {
  size?: number;
  className?: string;
}

export function RestaurantIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 128 128"
      className={className}
    >

      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M38 78h52" />
      <path fill="#FFFDF8" d="M42 74c2-21 18-35 34-35s32 14 34 35" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M42 74c2-21 18-35 34-35s32 14 34 35M76 35v-7" />
      <circle cx="76" cy="27" r="4" fill="#FFE382" />
      <path stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M24 43v40M18 43v17M30 43v17M18 60h12M105 42c8 12 6 24-3 31v10M35 88h62" />
      <path fill="#FFE382" stroke="#151515" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="m29 29 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </svg>
  );
}
