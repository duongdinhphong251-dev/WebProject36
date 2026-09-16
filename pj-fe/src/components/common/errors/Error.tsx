'use client'; // Error boundaries must be Client Components
import { useEffect } from 'react';

import HomeButton from '@/components/common/errors/HomeButton';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to console
    console.error(error);
  }, [error]);

  const handleReload = () => {
    try {
      setTimeout(() => {
        window?.location.reload();
      }, 500);
    } catch {
      window?.location.reload();
    }
  };

  const renderErrorMessage = () => {
    switch (error.name) {
      case 'ChunkLoadError':
        return (
          <h1 className="text-[16px] leading-7 font-semibold text-[#8A8A8A]">
            This application has been updated. Please refresh your browser to see the latest content.
          </h1>
        );
      case 'SecurityError':
        return (
          <h1 className="text-[16px] leading-7 font-semibold text-[#8A8A8A]">
            It seems that your browser is blocking cookies or localStorage. Please check your browser settings to ensure cookies are enabled, or try using a different browser
          </h1>
        );
      default:
        return (
          <h1 className="text-[16px] leading-7 font-semibold text-[#8A8A8A]">
            {error?.message}
          </h1>
        );
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '24px',
        border: '1px solid #fca5a5',
        borderRadius: '0.5rem',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        gap: '1rem',
      }}
      >
        <div>
          {renderErrorMessage()}
        </div>
        <button
          onClick={handleReload}
          style={{
            minWidth: '250px',
          }}
        >
          {error.name === 'ChunkLoadError' ? 'Reload' : 'Try again'}
        </button>
        <HomeButton />
      </div>
    </div>
  );
}
