export type BagLine = { slug: string; quantity: number };
export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    countryCode: string;
  };
};
export type Quote = {
  items: { slug: string; title: string; quantity: number; unitMinor: number }[];
  subtotalMinor: number;
  deliveryMinor: number;
  totalMinor: number;
  currency: string;
  countryCode: string;
  zoneName: string;
};
export class CommerceError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CommerceError("INVALID_REQUEST");
  return value as Record<string, unknown>;
}
export function text(value: unknown, min: number, max: number) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    Array.from(value).some((character) => character.charCodeAt(0) < 32)
  )
    throw new CommerceError("INVALID_DETAILS");
  return value.trim();
}
export function parseBag(value: unknown): BagLine[] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    throw new CommerceError("INVALID_BAG");
  const seen = new Set<string>();
  return value
    .map((entry) => {
      const line = record(entry);
      const slug = text(line.slug, 1, 120);
      if (
        !/^[a-z0-9-]+$/.test(slug) ||
        seen.has(slug) ||
        !Number.isInteger(line.quantity) ||
        Number(line.quantity) < 1 ||
        Number(line.quantity) > 20
      )
        throw new CommerceError("INVALID_BAG");
      seen.add(slug);
      return { slug, quantity: Number(line.quantity) };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
export function parseCustomer(value: unknown): Customer {
  const data = record(value),
    address = record(data.address);
  const email = text(data.email, 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new CommerceError("INVALID_EMAIL");
  const phone = text(data.phone, 7, 30);
  if (!/^[+0-9 ()-]+$/.test(phone)) throw new CommerceError("INVALID_PHONE");
  const countryCode = text(address.countryCode, 2, 2);
  if (!/^[A-Z]{2}$/.test(countryCode))
    throw new CommerceError("INVALID_DETAILS");
  return {
    name: text(data.name, 2, 100),
    email,
    phone,
    address: {
      line1: text(address.line1, 4, 160),
      line2: text(address.line2 ?? "", 0, 160),
      city: text(address.city, 2, 80),
      region: text(address.region, 2, 80),
      countryCode,
    },
  };
}
export function uuid(value: unknown) {
  const id = text(value, 36, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new CommerceError("INVALID_REQUEST");
  return id;
}
export function money(minor: number, currency = "GHS") {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    minor / 100,
  );
}
export function paymentMatches(
  data: Record<string, unknown>,
  order: {
    reference: string;
    total_minor: number;
    currency: string;
    email: string;
  },
  mode: string,
) {
  const customer =
    data.customer && typeof data.customer === "object"
      ? (data.customer as Record<string, unknown>)
      : {};
  return (
    data.status === "success" &&
    data.reference === order.reference &&
    data.amount === order.total_minor &&
    data.currency === order.currency &&
    data.domain === mode &&
    typeof customer.email === "string" &&
    customer.email.toLowerCase() === order.email.toLowerCase()
  );
}
export const ERROR_MESSAGES: Record<string, string> = {
  MERCHANT_SESSION: "Sign in again to manage the store.",
  MERCHANT_FORBIDDEN: "This account does not have active merchant access.",
  MERCHANT_MFA:
    "Verify a current authenticator code to continue. Verification lasts 15 minutes.",
  MERCHANT_INPUT: "Check the entered values and try again.",
  MERCHANT_PRICE:
    "Enter a positive price with no more than two decimal places, or leave it blank.",
  MERCHANT_CONFLICT:
    "This record changed after you opened it. Reload the record and review your edits before saving again.",
  MERCHANT_RETRY_CONFLICT:
    "This operation changed. Reload the record before trying again.",
  MERCHANT_NOT_FOUND: "The selected record is no longer available.",
  MERCHANT_EXISTS:
    "That product URL already exists. Choose another product code.",
  MERCHANT_STOCK_INITIALIZED:
    "Opening stock is already recorded. Use a stock adjustment.",
  MERCHANT_STOCK_UNKNOWN: "Record the opening available stock first.",
  MERCHANT_STOCK_NEGATIVE:
    "This adjustment would make available stock negative. Refresh and check reservations.",
  MERCHANT_REQUEST_STATE:
    "Choose an open request and enter a reply before changing its status.",
  MERCHANT_IMAGE:
    "Choose an existing catalogue photograph or upload an image first.",
  FULFILLMENT_TRANSITION:
    "Complete the current fulfilment stage before moving to the next one.",
  TRACKING_REQUIRED: "Enter the delivery tracking or dispatch reference.",
  DELIVERY_DATE_REQUIRED: "Delivery must follow dispatch.",
  ORDER_REQUEST_REVIEW:
    "Resolve the open cancellation, return or damage request before dispatch.",
  INVALID_SUPPORT_MESSAGE: "Enter a message between 10 and 2,000 characters.",
  SUPPORT_CONFLICT: "This request has changed. Refresh the page and try again.",
  SUPPORT_ORDER_STATE:
    "Return or damaged-item requests are available after payment is confirmed. Choose an order question for help with payment.",
  SUPPORT_LIMIT:
    "You already have requests awaiting a reply. Check the existing requests or contact the store.",
  ORDERING_UNAVAILABLE:
    "Online ordering is not open yet. Your bag has been kept.",
  PRODUCT_UNAVAILABLE:
    "An item is awaiting its confirmed price or product details. Please review your bag.",
  STOCK_UNAVAILABLE:
    "An item is no longer available in the requested quantity. Please update your bag.",
  DELIVERY_UNAVAILABLE: "Delivery is not available for the selected area.",
  PRICE_CHANGED:
    "The total has changed. Please review the updated total before continuing.",
  CHECKOUT_CONFLICT:
    "This checkout has changed. Review your bag and start a new checkout.",
  PAYMENT_PENDING:
    "The payment connection is still being checked. Open your order to check its status before trying again.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_PHONE: "Enter a valid telephone number.",
  INVALID_DETAILS: "Check the contact and delivery details and try again.",
  INVALID_BAG:
    "Your bag contains invalid items or quantities. Please review it.",
  INVALID_REQUEST:
    "This request could not be processed. Please refresh and try again.",
  FORBIDDEN:
    "This request could not be verified. Please return to the store and try again.",
  ORDER_NOT_FOUND: "This order is unavailable in this browser.",
  SERVICE_UNAVAILABLE:
    "The store connection is temporarily unavailable. Your bag has been kept.",
};
