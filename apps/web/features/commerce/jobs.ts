import "server-only";
import nodemailer from "nodemailer";
import { getOrder, rpc } from "./database";
import { verifyPayment } from "./paystack";
import { money } from "../checkout/domain";
import { storeOrigin } from "./config";

type Job = {
  id: string;
  lease_token: string;
  order_id: string;
  kind: "verify_payment" | "send_receipt";
  attempts: number;
};
async function receipt(orderId: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, STORE_EMAIL_FROM } =
    process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !STORE_EMAIL_FROM)
    throw new Error("EMAIL_NOT_CONFIGURED");
  const order = await getOrder(orderId);
  if (order.status !== "paid") return;
  const port = Number(SMTP_PORT ?? 465);
  if (![465, 587].includes(port))
    throw new Error("EMAIL_CONFIGURATION_INVALID");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });
  await transport.sendMail({
    from: STORE_EMAIL_FROM,
    to: order.email,
    subject: `Payment received — ${order.reference}`,
    messageId: `<receipt-${order.id}@${new URL(storeOrigin()).hostname}>`,
    text: `Thank you for your order from Everything Beaded & Trading Ventures.\n\nReference: ${order.reference}\nPayment received: ${money(order.total_minor, order.currency)}\nDelivery area: ${order.zone_name}\n\nView this order in the browser used at checkout: ${storeOrigin()}/orders/${order.id}\n\nYour order will be prepared after payment confirmation. This email is a payment receipt, not a dispatch notification.`,
  });
}
export async function runJobs() {
  const jobs = await rpc<Job[]>("claim_commerce_jobs");
  const summary = {
    claimed: jobs.length,
    completed: 0,
    retried: 0,
    attention: 0,
  };
  await Promise.all(
    jobs.map(async (job) => {
      let status = "done",
        code: string | null = null;
      try {
        if (job.kind === "send_receipt") await receipt(job.order_id);
        else {
          const order = await getOrder(job.order_id);
          const result =
            order.status === "paid" ? "paid" : await verifyPayment(order);
          if (result === "pending") {
            status = "pending";
            code = "PAYMENT_PENDING";
          }
          if (result === "payment_review") {
            status = "attention";
            code = "PAYMENT_REVIEW";
          }
        }
      } catch {
        status = "pending";
        code =
          job.kind === "send_receipt"
            ? "EMAIL_DELIVERY_PENDING"
            : "PROVIDER_CHECK_PENDING";
      }
      if (status === "pending" && job.attempts >= 48) status = "attention";
      const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7));
      await rpc("finish_commerce_job", {
        p_id: job.id,
        p_token: job.lease_token,
        p_status: status,
        p_error: code,
        p_available_at: new Date(Date.now() + delay * 1000).toISOString(),
      });
      if (status === "done") summary.completed++;
      else if (status === "attention") summary.attention++;
      else summary.retried++;
    }),
  );
  return summary;
}
