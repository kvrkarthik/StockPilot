export const formatCurrency = (value: string | number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value));

export const formatDateTime = (value: string) => new Date(value).toLocaleString();

