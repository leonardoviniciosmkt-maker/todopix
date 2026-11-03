// GET /api/status?id=123  ->  { status, product, number }
import { store, json, syncPayment } from "../lib/core.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) return json({ error: "id inválido" }, 400);
  try {
    const pay = await syncPayment(store(), id);
    if (!pay) return json({ error: "Pagamento não encontrado" }, 404);
    return json({ status: pay.status, product: pay.product || "passe", number: pay.number || null, at: pay.at || null, part: pay.part || null });
  } catch (e) {
    console.error(e);
    return json({ status: "pending" });
  }
};

export const config = { path: "/api/status" };
