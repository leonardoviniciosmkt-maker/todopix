// GET /api/admin?part=2   (cabeçalho x-admin-key)  ->  pagantes da parte, para colocar no episódio
import { store, json, listJSON } from "../lib/core.mjs";

export default async (req) => {
  const key = req.headers.get("x-admin-key") || "";
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return json({ error: "Senha incorreta" }, 401);
  const part = Number(new URL(req.url).searchParams.get("part") || 0);
  const pays = (await listJSON(store(), "pay/")).filter((p) => !part || p.part === part);
  const approved = pays.filter((p) => p.status === "approved").sort((a, b) => a.approvedAt.localeCompare(b.approvedAt));
  return json({
    part,
    aprovados: approved.map((p) => ({ at: p.at, conta: p.number, email: p.email, codigo: p.code, pagoEm: p.approvedAt })),
    pendentes: pays.filter((p) => p.status !== "approved").length,
    total: approved.length,
    receita: Number((approved.length * Number(process.env.PASS_PRICE || "9.90")).toFixed(2)),
  });
};

export const config = { path: "/api/admin" };
