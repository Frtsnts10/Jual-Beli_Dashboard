export const formatCurrency = (amount: number, currency: string) => {
  const symbolMap: Record<string, string> = {
    IDR: "Rp",
    USD: "$",
    EUR: "€",
    GBP: "£",
    SGD: "S$",
    MYR: "RM",
    THB: "฿",
    PHP: "₱",
    VND: "₫",
    JPY: "¥",
    CNY: "¥",
    KRW: "₩",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
    HKD: "HK$",
    TWD: "NT$",
    AED: "د.إ",
    SAR: "﷼",
  };

  const symbol = symbolMap[currency] || currency;

  return `${symbol} ${amount.toLocaleString(currency === 'IDR' ? 'id-ID' : 'en-US')}`;
};
