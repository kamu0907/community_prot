const STATUS_CONFIG = {
  available: { label: "空席あり", className: "status-available" },
  limited: { label: "残りわずか", className: "status-limited" },
  full: { label: "満席", className: "status-full" },
  unknown: { label: "情報未確認", className: "status-unknown" },
};

const STALE_MINUTES = 30;

const communityNameElement = document.querySelector("#community-name");
const communityAreaElement = document.querySelector("#community-area");
const shopCountElement = document.querySelector("#shop-count");
const countAvailableElement = document.querySelector("#count-available");
const countLimitedElement = document.querySelector("#count-limited");
const countFullElement = document.querySelector("#count-full");
const shopListElement = document.querySelector("#shop-list");
const messageElement = document.querySelector("#message");
const lastLoadedElement = document.querySelector("#last-loaded");
const reloadButton = document.querySelector("#reload-button");
const reloadText = document.querySelector(".reload-text");
const template = document.querySelector("#shop-card-template");

let selectedCommunity = null;

reloadButton.addEventListener("click", loadStatus);

function getCommunityId() {
  return new URLSearchParams(window.location.search).get("id") || "shinagawa";
}

async function getCommunityConfig() {
  const response = await fetch(
    `${API_BASE}/communities`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `communities API: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  const communities =
    Array.isArray(data.communities)
      ? data.communities
      : [];

  const communityId =
    getCommunityId();

  return (
    communities.find(
      (item) =>
        item.id === communityId
    ) || null
  );
}

function getEffectiveStatus(shop) {
  const updatedAt = new Date(shop.updatedAt);

  if (Number.isNaN(updatedAt.getTime())) {
    return "unknown";
  }

  const elapsedMinutes = (Date.now() - updatedAt.getTime()) / 1000 / 60;

  if (elapsedMinutes >= STALE_MINUTES) {
    return "unknown";
  }

  return STATUS_CONFIG[shop.status] ? shop.status : "unknown";
}

function formatUpdatedAt(updatedAtText) {
  const updatedAt = new Date(updatedAtText);

  if (Number.isNaN(updatedAt.getTime())) {
    return "更新時刻不明";
  }

  const elapsedMinutes = Math.floor((Date.now() - updatedAt.getTime()) / 1000 / 60);

  if (elapsedMinutes < 1) return "たった今更新";
  if (elapsedMinutes < 60) return `${elapsedMinutes}分前に更新`;

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(updatedAt);
}

function createShopCard(shop) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".shop-card");
  const effectiveStatus = getEffectiveStatus(shop);
  const config = STATUS_CONFIG[effectiveStatus];

  card.classList.add(`is-${effectiveStatus}`);
  fragment.querySelector(".shop-genre").textContent = shop.genre || "飲食店";
  fragment.querySelector(".shop-name").textContent = shop.name || "店舗名未設定";

  const statusBadge = fragment.querySelector(".status-badge");
  statusBadge.classList.add(config.className);
  fragment.querySelector(".status-badge-label").textContent = config.label;

  fragment.querySelector(".shop-note").textContent =
    effectiveStatus === "unknown"
      ? "最新の空席状況は店舗へご確認ください。"
      : shop.note || "店舗からの補足情報はありません。";

  fragment.querySelector(".shop-updated").textContent =
    `更新：${formatUpdatedAt(shop.updatedAt)}`;

  const shopLink = fragment.querySelector(".shop-link");

  if (shop.url) {
    shopLink.href = shop.url;
  } else {
    shopLink.removeAttribute("href");
    shopLink.textContent = "店舗情報は準備中";
    shopLink.setAttribute("aria-disabled", "true");
  }

  return fragment;
}

function renderSkeletons() {
  shopListElement.innerHTML = "";

  for (let i = 0; i < 2; i += 1) {
    const card = document.createElement("article");
    card.className = "shop-card is-skeleton";
    card.innerHTML = `
      <div class="skeleton-line" style="width:30%;margin-bottom:12px"></div>
      <div class="skeleton-line" style="width:58%;height:20px;margin-bottom:34px"></div>
      <div class="skeleton-line" style="width:90%;margin-bottom:10px"></div>
      <div class="skeleton-line" style="width:48%;margin-bottom:42px"></div>
      <div class="skeleton-line" style="width:100%;height:46px"></div>
    `;
    shopListElement.appendChild(card);
  }
}

function updateSummary(shops) {
  const counts = { available: 0, limited: 0, full: 0, unknown: 0 };

  shops.forEach((shop) => {
    counts[getEffectiveStatus(shop)] += 1;
  });

  shopCountElement.textContent = shops.length;
  countAvailableElement.textContent = counts.available;
  countLimitedElement.textContent = counts.limited;
  countFullElement.textContent = counts.full;
}

function render(data) {
  const communityName =
    data.communityName || selectedCommunity?.name || "飲食店コミュニティ";

  communityNameElement.textContent = communityName;
  communityAreaElement.textContent = selectedCommunity?.area || "";
  document.title = `${communityName}｜今入れるお店`;

  const shops = Array.isArray(data.shops) ? data.shops : [];
  updateSummary(shops);
  shopListElement.innerHTML = "";

  if (shops.length === 0) {
    messageElement.textContent = "現在、掲載中の店舗はありません。";
    return;
  }

  const order = { available: 0, limited: 1, full: 2, unknown: 3 };

  shops
    .slice()
    .sort((a, b) => order[getEffectiveStatus(a)] - order[getEffectiveStatus(b)])
    .forEach((shop) => shopListElement.appendChild(createShopCard(shop)));

  messageElement.textContent = "";
}

async function loadStatus() {
  reloadButton.disabled = true;
  reloadButton.classList.add("is-loading");
  reloadText.textContent = "更新中...";
  messageElement.textContent = "";
  renderSkeletons();

  try {
    if (!selectedCommunity) {
      selectedCommunity = await getCommunityConfig();
    }

    if (!selectedCommunity) {
      throw new Error(`コミュニティ「${getCommunityId()}」が見つかりません`);
    }

    if (!selectedCommunity.apiUrl) {
      throw new Error("apiUrlが設定されていません");
    }

    const response = await fetch(selectedCommunity.apiUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`status API: HTTP ${response.status}`);
    }

    const data = await response.json();
    render(data);

    lastLoadedElement.textContent = `最終取得 ${new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date())}`;
  } catch (error) {
    console.error(error);
    shopListElement.innerHTML = "";
    messageElement.textContent =
      "空席情報を読み込めませんでした。URLまたはAPI設定をご確認ください。";
    lastLoadedElement.textContent = "取得失敗";
  } finally {
    reloadButton.disabled = false;
    reloadButton.classList.remove("is-loading");
    reloadText.textContent = "最新情報に更新";
  }
}

loadStatus();
