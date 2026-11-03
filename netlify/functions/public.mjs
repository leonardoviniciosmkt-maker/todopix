// GET /api/public?part=2  ->  ranking do quadro e vagas vendidas na parte (sem e-mails nem valores)
import { store, json, listJSON } from "../lib/core.mjs";

export default async (req) => {
  const part = Number(new URL(req.url).searchParams.get("part") || 0);
  try {
    const accts = await listJSON(store(), "acct/");
    const rank = accts
      .map((a) => ({ at: a.at, number: a.number, capitulos: (a.parts || []).length }))
      .sort((a, b) => b.capitulos - a.capitulos || a.number - b.number);
    const sold = accts.filter((a) => (a.parts || []).includes(part)).length;
    const next = accts.reduce((m, a) => Math.max(m, a.number), 0) + 1;
    return new Response(JSON.stringify({ rank: rank.slice(0, 20), sold, next }), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30" },
    });
  } catch (e) {
    console.error(e);
    return json({ rank: [], sold: 0, next: 1 });
  }
};

export const config = { path: "/api/public" };
