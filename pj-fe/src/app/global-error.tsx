'use client';

import Error from '@/components/common/errors/Error';
import { routing } from '@/libs/I18nRouting';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang={routing.defaultLocale}>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <Error error={error} />
      </body>
    </html>
  );
}
