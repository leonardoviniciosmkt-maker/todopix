// POST /api/pix
//   passe: { at, email, part }   -> Pix de R$ 9,90 (Empreste seu @)
//   guia:  { product: "guia", email } -> Pix do guia em PDF
import { store, json, cleanAt, mpCreatePix, PRICE, GUIDE_PRICE } from "../lib/core.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Dados inválidos" }, 400); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Digite um e-mail válido." }, 400);
  const isGuide = body.product === "guia";

  let record, description, amount, code;
  if (isGuide) {
    code = "G-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    amount = GUIDE_PRICE;
    description = "Guia Bastidores · Todo Pix Tem CPF (PDF)";
    record = { product: "guia", email, token: crypto.randomUUID().replace(/-/g, "") };
  } else {
    const at = cleanAt(body.at);
    const part = Number(body.part);
    if (!at) return json({ error: "Digite um @ válido do Instagram." }, 400);
    if (!Number.isInteger(part) || part < 1 || part > 99) return json({ error: "Parte inválida." }, 400);
    code = "P" + part + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    amount = PRICE;
    description = `Todo Pix Tem CPF · Empreste seu @ · Parte ${part}`;
    record = { product: "passe", at, email, part };
  }

  try {
    const pix = await mpCreatePix({ email, code, amount, description, siteUrl: process.env.URL });
    await store().setJSON("pay/" + pix.id, { id: pix.id, code, ...record, status: pix.status, created: new Date().toISOString() });
    const out = { id: pix.id, code, qr: pix.qr, qrImg: pix.qrImg, price: amount };
    if (isGuide) out.token = record.token;
    return json(out);
  } catch (e) {
    console.error(e);
    return json({ error: "Não foi possível gerar o Pix agora. Tente de novo em instantes." }, 502);
  }
};

export const config = { path: "/api/pix" };
