const STATUS_CONFIG = {
  available: {
    label: "空席あり",
    badgeClass: "status-available",
    cardClass: "is-available",
  },
  limited: {
    label: "残りわずか",
    badgeClass: "status-limited",
    cardClass: "is-limited",
  },
  full: {
    label: "満席",
    badgeClass: "status-full",
    cardClass: "is-full",
  },
  unknown: {
    label: "情報未確認",
    badgeClass: "status-unknown",
    cardClass: "is-unknown",
  },
};

const STALE_MINUTES = 30;
const STATUS_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/status";

const communityNameElement = document.querySelector("#community-name");
const shopCountElement = document.querySelector("#shop-count");
const countAvailableElement = document.querySelector("#count-available");
const countLimitedElement = document.querySelector("#count-limited");
const countFullElement = document.querySelector("#count-full");
const shopListElement = document.querySelector("#shop-list");
const messageElement = document.querySelector("#message");
const lastLoadedElement = document.querySelector("#last-loaded");
const reloadButton = document.querySelector("#reload-button");
const reloadText = reloadButton.querySelector(".reload-text");
const template = document.querySelector("#shop-card-template");

reloadButton.addEventListener("click", loadStatus);

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

  const elapsedMinutes = Math.floor(
    (Date.now() - updatedAt.getTime()) / 1000 / 60
  );

  if (elapsedMinutes < 1) {
    return "たった今更新";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}分前に更新`;
  }

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

  card.classList.add(config.cardClass);

  fragment.querySelector(".shop-genre").textContent = shop.genre || "飲食店";
  fragment.querySelector(".shop-name").textContent =
    shop.name || "店舗名未設定";

  const statusBadge = fragment.querySelector(".status-badge");
  statusBadge.classList.add(config.badgeClass);
  fragment.querySelector(".status-badge-label").textContent = config.label;

  fragment.querySelector(".shop-note").textContent =
    effectiveStatus === "unknown"
      ? "最新の空席状況は店舗へご確認ください。"
      : shop.note || "店舗からの補足情報はありません。";

  fragment.querySelector(".shop-updated").textContent =
    formatUpdatedAt(shop.updatedAt);

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

function renderSkeletons(count = 4) {
  shopListElement.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const card = document.createElement("article");
    card.className = "shop-card is-skeleton";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `
      <span class="shop-accent"></span>
      <div class="skeleton-line" style="width:38%"></div>
      <div class="skeleton-line" style="width:70%;height:18px;margin-top:10px"></div>
      <div class="skeleton-line" style="width:90%;margin-top:28px"></div>
      <div class="skeleton-line" style="width:55%;margin-top:12px"></div>
      <div class="skeleton-line" style="width:100%;height:44px;border-radius:14px;margin-top:auto"></div>
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
  communityNameElement.textContent =
    data.communityName || "飲食店コミュニティ";

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
    .sort(
      (a, b) => order[getEffectiveStatus(a)] - order[getEffectiveStatus(b)]
    )
    .forEach((shop) => {
      shopListElement.appendChild(createShopCard(shop));
    });

  messageElement.textContent = "";
}

async function loadStatus() {
  reloadButton.disabled = true;
  reloadButton.classList.add("is-loading");
  reloadText.textContent = "更新中...";
  messageElement.textContent = "";
  renderSkeletons();

  try {
    const response = await fetch(STATUS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    render(data);

    lastLoadedElement.textContent = `最終取得 ${new Intl.DateTimeFormat(
      "ja-JP",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(new Date())}`;
  } catch (error) {
    console.error(error);
    shopListElement.innerHTML = "";
    messageElement.textContent =
      "空席情報を読み込めませんでした。少し時間を置いて再度お試しください。";
  } finally {
    reloadButton.disabled = false;
    reloadButton.classList.remove("is-loading");
    reloadText.textContent = "最新情報に更新";
  }
}

loadStatus();
