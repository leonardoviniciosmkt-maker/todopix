// POST /api/webhook  <- notificações do Mercado Pago.
// O conteúdo da notificação não é usado como prova: o pagamento é sempre
// consultado de novo direto na API do Mercado Pago antes de ser aprovado.
import { store, json, syncPayment } from "../lib/core.mjs";

export default async (req) => {
  const url = new URL(req.url);
  let id = url.searchParams.get("data.id") || url.searchParams.get("id");
  let type = url.searchParams.get("type") || url.searchParams.get("topic");
  if (req.method === "POST") {
    try {
      const b = await req.json();
      id = id || b?.data?.id || b?.id;
      type = type || b?.type || b?.topic;
    } catch { /* corpo vazio */ }
  }
  if (id && /^\d+$/.test(String(id)) && (!type || String(type).includes("payment"))) {
    try { await syncPayment(store(), String(id)); } catch (e) { console.error(e); }
  }
  return json({ ok: true });
};

export const config = { path: "/api/webhook" };
