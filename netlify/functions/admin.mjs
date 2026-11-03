// GET /api/admin?part=2            (cabeçalho x-admin-key) -> passes pagos da parte
// GET /api/admin?product=guia      (cabeçalho x-admin-key) -> compras do guia, com link de acesso
import { store, json, listJSON, PRICE, GUIDE_PRICE } from "../lib/core.mjs";

export default async (req) => {
  const key = req.headers.get("x-admin-key") || "";
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return json({ error: "Senha incorreta" }, 401);
  const u = new URL(req.url);
  const product = u.searchParams.get("product") === "guia" ? "guia" : "passe";
  const part = Number(u.searchParams.get("part") || 0);
  const site = (process.env.URL || "").replace(/\/$/, "");
  const all = await listJSON(store(), "pay/");
  const pays = all.filter((p) => (p.product || "passe") === product && (product === "guia" || !part || p.part === part));
  const approved = pays.filter((p) => p.status === "approved").sort((a, b) => (a.approvedAt || "").localeCompare(b.approvedAt || ""));
  const price = product === "guia" ? GUIDE_PRICE : PRICE;
  return json({
    product, part,
    aprovados: approved.map((p) => product === "guia"
      ? { nome: p.name || "", telefone: p.phone || "", email: p.email, codigo: p.code, pagoEm: p.approvedAt, downloads: p.downloads || 0, acesso: `${site}/acesso.html?id=${p.id}&t=${p.token}` }
      : { at: p.at, conta: p.number, email: p.email, codigo: p.code, pagoEm: p.approvedAt }),
    pendentes: pays.filter((p) => p.status !== "approved").length,
    total: approved.length,
    receita: Number((approved.length * price).toFixed(2)),
  });
};

export const config = { path: "/api/admin" };
