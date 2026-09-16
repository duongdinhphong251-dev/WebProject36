import Axios from 'axios';
import { getCookie } from 'cookies-next';
import { uuidv7 } from 'uuidv7';
import { x_source } from '@/constants/common';
import { locales, fallbackLng } from '@/i18n/settings';
import { getOrCreateUuidv7 } from '@/libs/uuidv7';

const baseUrl = process.env.NEXT_PUBLIC_API;

const createInstanceApiByUrl = (url = baseUrl, canSetupConfig = true) => {
  const instanceApi = Axios.create({
    baseURL: url,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Source': x_source,
    },
  });

  instanceApi.interceptors.request.use(
    async (config) => {
      if (!canSetupConfig) {
        return config;
      }

      const accessToken = getCookie('token');

      try {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (typeof window !== 'undefined') {
          const currentUrl = window?.location.href;
          const matchedLocale = locales.find((loc) => currentUrl.includes(`/${loc}/`) || new RegExp(`\\/${loc}(?:$|\\/)`).test(currentUrl));
          const locale = matchedLocale || fallbackLng;
          config.headers.Locale = locale;
          config.headers['X-Request-URL'] = currentUrl;

          try {
            const fingerprint = getOrCreateUuidv7();
            if (fingerprint) {
              config.headers['x-fingerprint'] = fingerprint;
            }
          } catch (error) {
            config.headers['x-fingerprint-err'] = error instanceof Error ? error.message : 'unknown-error';
          }
        }

        config.headers['X-Request-Id'] = uuidv7();
      } catch {}

      return config;
    },
    error => Promise.reject(error),
  );

  instanceApi.interceptors.response.use(
    response => response,
    (error) => {
      const status = error?.response?.status;
      console.warn(status);
      return Promise.reject(error);
    },
  );

  return instanceApi;
};

export default createInstanceApiByUrl;
