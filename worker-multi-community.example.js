/**
 * Cloudflare Worker 複数コミュニティ対応の参考実装。
 * Binding: COMMUNITY_STATUS (既存KVをそのまま利用可能)
 * Secrets: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_TOKEN は既存値を維持
 *
 * 既存のLINE webhook・admin login処理は現在のWorkerから残し、
 * 下記routeRequest相当の分岐を統合してください。
 */
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    try { return await routeRequest(request, env); }
    catch (error) { console.error(error); return json({ success: false, message: "Internal Server Error" }, 500); }
  }
};

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/communities") return listCommunities(env);
  if (request.method === "POST" && url.pathname === "/communities") return createCommunity(request, env);

  if (parts[0] === "communities" && parts[1]) {
    const communityId = sanitizeId(parts[1]);
    if (!communityId) return json({ message: "Invalid communityId" }, 400);
    if (request.method === "GET" && parts.length === 2) return getCommunity(env, communityId);
    if (request.method === "GET" && parts[2] === "status") return getCommunityStatus(env, communityId);
    if (request.method === "POST" && parts[2] === "shop-requests") return createShopRequest(request, env, communityId);
  }

  // 移行期間用: 従来URLを品川へ接続
  if (request.method === "GET" && url.pathname === "/status") return getCommunityStatus(env, "shinagawa");
  if (request.method === "POST" && url.pathname === "/shop-requests") return createShopRequest(request, env, "shinagawa");

  return json({ message: "Not Found" }, 404);
}

async function listCommunities(env) {
  const ids = await env.COMMUNITY_STATUS.get("communities:index", "json") || [];
  const rows = (await Promise.all(ids.map((id) => env.COMMUNITY_STATUS.get(`community:${id}`, "json")))).filter(Boolean);
  return json({ communities: rows.map(({ ownerTokenHash, ownerEmail, ...publicData }) => publicData) });
}

async function createCommunity(request, env) {
  const body = await request.json();
  for (const key of ["name", "area", "description", "ownerName", "email"]) {
    if (!String(body[key] || "").trim()) return json({ success: false, message: `${key} is required` }, 400);
  }
  const baseId = slugify(body.name) || `community-${crypto.randomUUID().slice(0, 8)}`;
  const communityId = await uniqueCommunityId(env, baseId);
  const ownerToken = randomCode(16);
  const now = new Date().toISOString();
  const community = {
    id: communityId,
    name: String(body.name).trim().slice(0, 80),
    area: String(body.area).trim().slice(0, 100),
    description: String(body.description).trim().slice(0, 500),
    ownerName: String(body.ownerName).trim().slice(0, 100),
    ownerEmail: String(body.email).trim().slice(0, 200),
    ownerTokenHash: await sha256(ownerToken),
    shopCount: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };
  await env.COMMUNITY_STATUS.put(`community:${communityId}`, JSON.stringify(community));
  await env.COMMUNITY_STATUS.put(`community:${communityId}:status`, JSON.stringify({ communityId, communityName: community.name, shops: [] }));
  await env.COMMUNITY_STATUS.put(`community:${communityId}:shop-requests`, JSON.stringify({ requests: [] }));
  const ids = await env.COMMUNITY_STATUS.get("communities:index", "json") || [];
  ids.push(communityId);
  await env.COMMUNITY_STATUS.put("communities:index", JSON.stringify([...new Set(ids)]));
  return json({ success: true, community: publicCommunity(community), ownerToken }, 201);
}

async function getCommunity(env, id) {
  const item = await env.COMMUNITY_STATUS.get(`community:${id}`, "json");
  return item ? json({ community: publicCommunity(item) }) : json({ message: "Community not found" }, 404);
}

async function getCommunityStatus(env, id) {
  const data = await env.COMMUNITY_STATUS.get(`community:${id}:status`, "json");
  return data ? json(data) : json({ message: "Community not found" }, 404);
}

async function createShopRequest(request, env, communityId) {
  const community = await env.COMMUNITY_STATUS.get(`community:${communityId}`, "json");
  if (!community || community.status !== "active") return json({ success: false, message: "申請先コミュニティが見つかりません。" }, 404);
  const body = await request.json();
  if (!String(body.shopName || "").trim() || !String(body.genre || "").trim()) return json({ success: false, message: "店舗名とジャンルは必須です。" }, 400);
  const key = `community:${communityId}:shop-requests`;
  const store = await env.COMMUNITY_STATUS.get(key, "json") || { requests: [] };
  store.requests.push({
    requestId: crypto.randomUUID(), communityId,
    shopName: String(body.shopName).trim(), genre: String(body.genre).trim(),
    address: String(body.address || "").trim(), url: String(body.url || "").trim(),
    contactName: String(body.contactName || "").trim(), email: String(body.email || "").trim(),
    note: String(body.note || "").trim(), status: "pending", requestedAt: new Date().toISOString()
  });
  await env.COMMUNITY_STATUS.put(key, JSON.stringify(store));
  return json({ success: true, message: "店舗掲載申請を受け付けました。" }, 201);
}

function publicCommunity({ ownerTokenHash, ownerEmail, ...rest }) { return rest; }
function sanitizeId(value) { return /^[a-z0-9][a-z0-9-]{1,62}$/.test(value) ? value : ""; }
function slugify(value) { return String(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48); }
async function uniqueCommunityId(env, base) { let id = base; let i = 2; while (await env.COMMUNITY_STATUS.get(`community:${id}`)) id = `${base}-${i++}`; return id; }
function randomCode(length) { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; const bytes = crypto.getRandomValues(new Uint8Array(length)); return [...bytes].map((b) => chars[b % chars.length]).join(""); }
async function sha256(value) { const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...corsHeaders } }); }
