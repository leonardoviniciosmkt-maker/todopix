// GET /api/download?id=123&t=TOKEN  ->  PDF do guia (só para pagamento aprovado)
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { store, json, syncPayment } from "../lib/core.mjs";

const FILE = "netlify/assets/bastidores-todo-pix-tem-cpf.pdf";
function findPdf() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tries = [
    path.join(process.env.LAMBDA_TASK_ROOT || "", FILE),
    path.join(process.cwd(), FILE),
    path.join(here, "..", "..", FILE),
    path.join(here, FILE),
    "/var/task/" + FILE,
  ];
  return tries.find((p) => existsSync(p));
}

export default async (req) => {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") || "";
  const t = u.searchParams.get("t") || "";
  if (!/^\d+$/.test(id) || !t) return json({ error: "Link inválido" }, 400);
  const s = store();
  const pay = await s.get("pay/" + id, { type: "json" });
  if (!pay || pay.product !== "guia" || pay.token !== t) return json({ error: "Link inválido" }, 403);
  let ok = pay.status === "approved";
  if (!ok) { try { ok = (await syncPayment(s, id))?.status === "approved"; } catch (e) { console.error(e); } }
  if (!ok) return json({ error: "Pagamento ainda não confirmado" }, 402);
  const file = findPdf();
  if (!file) { console.error("PDF não encontrado"); return json({ error: "Arquivo indisponível, chame o suporte" }, 500); }
  const buf = await readFile(file);
  pay.downloads = (pay.downloads || 0) + 1;
  await s.setJSON("pay/" + id, pay);
  return new Response(buf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="bastidores-todo-pix-tem-cpf.pdf"',
      "cache-control": "private, no-store",
    },
  });
};

export const config = { path: "/api/download" };
