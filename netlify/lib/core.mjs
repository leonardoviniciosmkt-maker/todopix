// Núcleo compartilhado: Mercado Pago + armazenamento (Netlify Blobs)
import { getStore } from "@netlify/blobs";

export const PRICE = Number(process.env.PASS_PRICE || "9.90");
export const GUIDE_PRICE = Number(process.env.GUIDE_PRICE || "29.90");
const MP = "https://api.mercadopago.com";

export function store() {
  return getStore({ name: "passes", consistency: "strong" });
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function cleanAt(raw) {
  let at = String(raw || "").trim().replace(/\s+/g, "").toLowerCase();
  if (at && !at.startsWith("@")) at = "@" + at;
  return /^@[a-z0-9._]{1,30}$/.test(at) ? at : null;
}

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não configurado no Netlify");
  return t;
}

export async function mpCreatePix({ email, description, code, siteUrl, amount = PRICE, name, minutes = 30 }) {
  const exp = new Date(Date.now() + minutes * 60 * 1000).toISOString().replace("Z", "+00:00");
  const res = await fetch(MP + "/v1/payments", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token(),
      "Content-Type": "application/json",
      "X-Idempotency-Key": code,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: name ? { email, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || undefined } : { email },
      external_reference: code,
      notification_url: siteUrl ? siteUrl.replace(/\/$/, "") + "/api/webhook" : undefined,
      date_of_expiration: exp,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Mercado Pago recusou: " + (data.message || res.status));
  const tx = data.point_of_interaction?.transaction_data || {};
  return { id: String(data.id), status: data.status, qr: tx.qr_code, qrImg: tx.qr_code_base64, ticket: tx.ticket_url };
}

export async function mpGet(id) {
  const res = await fetch(MP + "/v1/payments/" + encodeURIComponent(id), {
    headers: { Authorization: "Bearer " + token() },
  });
  if (!res.ok) throw new Error("Pagamento não encontrado no Mercado Pago");
  return res.json();
}

// Marca um pagamento como aprovado e garante o número da conta do @ (idempotente).
export async function recordApproved(s, payId) {
  const pay = await s.get("pay/" + payId, { type: "json" });
  if (!pay) return null;
  if (pay.status === "approved" && (pay.number || pay.product === "guia")) return pay;
  if (pay.product === "guia") {
    pay.status = "approved";
    pay.approvedAt = new Date().toISOString();
    await s.setJSON("pay/" + payId, pay);
    return pay;
  }
  let acct = await s.get("acct/" + pay.at, { type: "json" });
  if (!acct) {
    const meta = (await s.get("meta/counter", { type: "json" })) || { n: 0 };
    meta.n += 1;
    await s.setJSON("meta/counter", meta);
    acct = { at: pay.at, number: meta.n, parts: [], first: new Date().toISOString() };
  }
  if (!acct.parts.includes(pay.part)) acct.parts.push(pay.part);
  acct.total = (acct.total || 0) + 1;
  await s.setJSON("acct/" + pay.at, acct);
  pay.status = "approved";
  pay.approvedAt = new Date().toISOString();
  pay.number = acct.number;
  await s.setJSON("pay/" + payId, pay);
  return pay;
}

// Consulta o Mercado Pago e atualiza o registro local.
export async function syncPayment(s, payId) {
  const pay = await s.get("pay/" + payId, { type: "json" });
  if (!pay) return null;
  if (pay.status === "approved") return pay;
  const mp = await mpGet(payId);
  if (mp.external_reference && mp.external_reference !== pay.code) return pay;
  if (mp.status === "approved") return recordApproved(s, payId);
  if (mp.status !== pay.status) {
    pay.status = mp.status;
    await s.setJSON("pay/" + payId, pay);
  }
  return pay;
}

export async function listJSON(s, prefix) {
  const { blobs } = await s.list({ prefix });
  const out = [];
  for (const b of blobs) {
    const v = await s.get(b.key, { type: "json" });
    if (v) out.push(v);
  }
  return out;
}
