"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_USD_TO_VND_RATE } from "@/constants/currency";
import { formatDisplayPrice, formatDual, formatUSD, formatVND } from "@/helpers/currency";
import { getExchangeRates } from "@/services/api/exchange-rate-api";
import { useLocalStorageState } from "./useLocalStorageState";

const CURRENCY_PREFERENCE_KEY = "tuoi_currency_preference";
export type CurrencyType = "VND" | "USD";

interface ExchangeRatesState {
  usdToVnd: number;
}

// Module-level singleton state ensuring AT MOST 1 request per session
let exchangeRatesCache: ExchangeRatesState | null = null;
let exchangeRatesPromise: Promise<ExchangeRatesState | null> | null = null;
let hasAttemptedFetch = false;

const listeners = new Set<() => void>();

function notifyExchangeRateListeners() {
  for (const cb of listeners) {
    cb();
  }
}

function fetchExchangeRatesSingleton(): Promise<ExchangeRatesState | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (hasAttemptedFetch) {
    return Promise.resolve(exchangeRatesCache);
  }

  if (exchangeRatesPromise) {
    return exchangeRatesPromise;
  }

  hasAttemptedFetch = true;
  exchangeRatesPromise = getExchangeRates()
    .then((data) => {
      if (data && data.usdToVnd > 0) {
        exchangeRatesCache = {
          usdToVnd: data.usdToVnd,
        };
        notifyExchangeRateListeners();
        return exchangeRatesCache;
      }
      return null;
    })
    .catch(() => {
      // Silently catch endpoint 404 or network error -> fallback stays active
      return null;
    });

  return exchangeRatesPromise;
}

export function useCurrencyPreference() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currency, setCurrencyState] = useLocalStorageState<CurrencyType>(
    CURRENCY_PREFERENCE_KEY,
    {
      defaultValue: "VND",
      syncTabs: true,
    },
  );

  const [dynamicRates, setDynamicRates] = useState<ExchangeRatesState>(
    exchangeRatesCache || {
      usdToVnd: DEFAULT_USD_TO_VND_RATE,
    },
  );

  useEffect(() => {
    if (exchangeRatesCache) {
      setDynamicRates(exchangeRatesCache);
      return;
    }

    const onRatesUpdated = () => {
      if (exchangeRatesCache) {
        setDynamicRates(exchangeRatesCache);
      }
    };
    listeners.add(onRatesUpdated);

    fetchExchangeRatesSingleton();

    return () => {
      listeners.delete(onRatesUpdated);
    };
  }, []);

  const rawCurrency: CurrencyType =
    currency === "USD" ? currency : "VND";
  const selectedCurrency: CurrencyType = mounted ? rawCurrency : "VND";

  const setCurrency = useCallback(
    (newCurrency: CurrencyType) => {
      setCurrencyState(newCurrency);
    },
    [setCurrencyState],
  );

  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => {
      if (prev === "VND") return "USD";
      return "VND";
    });
  }, [setCurrencyState]);

  const formatPrice = useCallback(
    (
      amountVND: number | null | undefined,
      rateUsdVnd = dynamicRates.usdToVnd,
    ) => {
      return formatDisplayPrice(
        amountVND,
        selectedCurrency,
        rateUsdVnd,
      );
    },
    [selectedCurrency, dynamicRates.usdToVnd],
  );

  return {
    currency: selectedCurrency,
    exchangeRates: dynamicRates,
    setCurrency,
    toggleCurrency,
    formatPrice,
    formatVND: (amount: number | null | undefined) => formatVND(amount),
    formatUSD: (amount: number | null | undefined) =>
      formatUSD(amount, dynamicRates.usdToVnd),
    formatDual: (amount: number | null | undefined) =>
      formatDual(amount, dynamicRates.usdToVnd),
  };
}
