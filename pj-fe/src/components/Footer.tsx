import Image from 'next/image';
import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  const english = locale === 'en';
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="footer-brand">
            <Image
              className="brand-logo"
              src="/assets/images/common/logo_x.png"
              alt="Logo nhóm 36"
              width={54}
              height={54}
            />
            <span>Nhom36</span>
          </div>
          <p>
            {english
              ? 'Discover spas and local offers.'
              : 'Khám phá spa và ưu đãi tại địa phương.'}
          </p>
        </div>
        <div className="footer-links">
          <strong>{english ? 'EXPLORE' : 'KHÁM PHÁ'}</strong>
          <Link href={`/${locale}#spas`}>
            {english ? 'Spas' : 'Spa & massage'}
          </Link>
          <Link href={`/${locale}#deals`}>Voucher</Link>
        </div>
      </div>
    </footer>
  );
}
