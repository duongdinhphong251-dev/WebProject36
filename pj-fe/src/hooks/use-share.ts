import { useCallback } from 'react';

export interface ShareData {
  title: string;
  description?: string;
  url: string;
}

function getShareUrls(data: ShareData) {
  const encoded = encodeURIComponent(data.url);
  const text = encodeURIComponent(`${data.title} ${data.url}`);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    x: `https://x.com/intent/tweet?text=${text}`,
    zalo: `https://zalo.me/share/link?url=${encoded}&title=${encodeURIComponent(data.title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    email: `mailto:?subject=${encodeURIComponent(data.title)}&body=${encoded}`,
  };
}

export type SharePlatform = 'facebook' | 'x' | 'zalo' | 'linkedin' | 'email';

export function useShare() {
  /** Native share sheet (mobile). Returns true if succeeded. */
  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.description, url: data.url });
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share error:', err);
        return false;
      }
    }
    return false;
  }, []);

  /** Open share URL for a specific platform. */
  const shareToPlatform = useCallback((platform: SharePlatform, data: ShareData) => {
    const urls = getShareUrls(data);
    const url = urls[platform];
    if (platform === 'email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return {
    share,
    shareToPlatform,
    getShareUrls,
    isWebShareSupported: typeof navigator !== 'undefined' && !!navigator.share,
  };
}
