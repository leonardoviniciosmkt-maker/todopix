// POST /api/pix  { at, email, part }  ->  cria a cobrança Pix no Mercado Pago
import { store, json, cleanAt, mpCreatePix } from "../lib/core.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Dados inválidos" }, 400); }

  const at = cleanAt(body.at);
  const email = String(body.email || "").trim().toLowerCase();
  const part = Number(body.part);
  if (!at) return json({ error: "Digite um @ válido do Instagram." }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Digite um e-mail válido." }, 400);
  if (!Number.isInteger(part) || part < 1 || part > 99) return json({ error: "Parte inválida." }, 400);

  const code = "P" + part + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  try {
    const pix = await mpCreatePix({
      email,
      code,
      description: `Todo Pix Tem CPF · Empreste seu @ · Parte ${part}`,
      siteUrl: process.env.URL,
    });
    await store().setJSON("pay/" + pix.id, {
      id: pix.id, code, at, email, part, status: pix.status, created: new Date().toISOString(),
    });
    return json({ id: pix.id, code, qr: pix.qr, qrImg: pix.qrImg, price: Number(process.env.PASS_PRICE || "9.90") });
  } catch (e) {
    console.error(e);
    return json({ error: "Não foi possível gerar o Pix agora. Tente de novo em instantes." }, 502);
  }
};

export const config = { path: "/api/pix" };
