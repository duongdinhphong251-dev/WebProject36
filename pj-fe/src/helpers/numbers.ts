export const formatPrice = (
  price: string | number | null | undefined,
  options: {
    currency?: string;
    includeCurrencySymbol?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
  } = {}
) => {
  try {
    if (price === null || price === '' || price === undefined) {
      return '0đ';
    }

    let convert: number;
    if (typeof price === 'string') {
      convert = Number.parseFloat(price.replace(/,/g, ''));
    } else {
      convert = price;
    }

    if (Number.isNaN(convert)) {
      return '0đ';
    }

    const { currency = 'VND', includeCurrencySymbol = true, formatOptions = {} } = options;

    if (currency === 'VND') {
      const formatted = new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        ...formatOptions,
      }).format(convert);
      return includeCurrencySymbol ? `${formatted}đ` : formatted;
    }

    const formatter = new Intl.NumberFormat('en-US', {
      style: includeCurrencySymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: 2,
      ...formatOptions,
    });

    return formatter.format(convert);
  } catch (error) {
    console.error('Error formatting price:', error); // Log the error for debugging
    const { currency = 'VND' } = options;
    return `${price ?? 0} ${currency}`;
  }
};
