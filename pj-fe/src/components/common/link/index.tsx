'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface CustomLinkProps {
  href: string;
  passHref?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  [key: string]: any; // For any additional props
}

const CustomLink: React.FC<CustomLinkProps> = ({
  href,
  passHref,
  children,
  className,
  ...props
}) => {
  const params = useParams();
  const locale = params?.locale as string;

  const modifiedHref = locale && !href.startsWith(`/${locale}`)
    ? `/${locale}${href.startsWith('/') ? '' : '/'}${href}`
    : href;

  return (
    <Link href={modifiedHref} passHref={passHref} className={className} {...props}>
      {children}
    </Link>
  );
};

export default CustomLink;
