const STATUS_CONFIG = {
  available: {
    label: "空席あり",
    className: "status-available",
    icon: "🟢",
  },
  limited: {
    label: "残りわずか",
    className: "status-limited",
    icon: "🟡",
  },
  full: {
    label: "満席",
    className: "status-full",
    icon: "🔴",
  },
  unknown: {
    label: "情報未確認",
    className: "status-unknown",
    icon: "⚪",
  },
};

const STALE_MINUTES = 30;

const communityNameElement = document.querySelector("#community-name");
const shopCountElement = document.querySelector("#shop-count");
const shopListElement = document.querySelector("#shop-list");
const messageElement = document.querySelector("#message");
const lastLoadedElement = document.querySelector("#last-loaded");
const reloadButton = document.querySelector("#reload-button");
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

  const elapsedMinutes = Math.floor((Date.now() - updatedAt.getTime()) / 1000 / 60);

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
  const effectiveStatus = getEffectiveStatus(shop);
  const config = STATUS_CONFIG[effectiveStatus];

  fragment.querySelector(".shop-genre").textContent = shop.genre || "飲食店";
  fragment.querySelector(".shop-name").textContent = shop.name || "店舗名未設定";

  const statusBadge = fragment.querySelector(".status-badge");
  statusBadge.textContent = `${config.icon} ${config.label}`;
  statusBadge.classList.add(config.className);

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

function render(data) {
  communityNameElement.textContent =
    data.communityName || "飲食店コミュニティ";

  const shops = Array.isArray(data.shops) ? data.shops : [];
  shopCountElement.textContent = shops.length;
  shopListElement.innerHTML = "";

  if (shops.length === 0) {
    messageElement.textContent = "現在、掲載中の店舗はありません。";
    return;
  }

  shops
    .sort((a, b) => {
      const order = {
        available: 0,
        limited: 1,
        full: 2,
        unknown: 3,
      };

      return (
        order[getEffectiveStatus(a)] - order[getEffectiveStatus(b)]
      );
    })
    .forEach((shop) => {
      shopListElement.appendChild(createShopCard(shop));
    });

  messageElement.textContent = "";
}

async function loadStatus() {
  reloadButton.disabled = true;
  reloadButton.textContent = "更新中...";
  messageElement.textContent = "空席情報を読み込んでいます。";

  try {
    const response = await fetch(`./status.json?time=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    render(data);

    lastLoadedElement.textContent =
      `最終取得 ${new Intl.DateTimeFormat("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date())}`;
  } catch (error) {
    console.error(error);
    shopListElement.innerHTML = "";
    messageElement.textContent =
      "空席情報を読み込めませんでした。少し時間を置いて再度お試しください。";
  } finally {
    reloadButton.disabled = false;
    reloadButton.textContent = "最新情報に更新";
  }
}

loadStatus();
