export const formatCurrency = (value: string | number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(Number(value));

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN");