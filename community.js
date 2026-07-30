const STATUS_CONFIG = {
  available: { label: "空席あり", className: "status-available" },
  limited: { label: "残りわずか", className: "status-limited" },
  full: { label: "満席", className: "status-full" },
  unknown: { label: "情報未確認", className: "status-unknown" },
};

const STALE_MINUTES = 30;

const API_BASE =
  "https://tight-snowflake-f83f.kameyama.workers.dev";

const SESSION_TOKEN_STORAGE_KEY =
  "community_subscription_session_token";

const communityNameElement =
  document.querySelector("#community-name");
const communityAreaElement =
  document.querySelector("#community-area");
const shopCountElement =
  document.querySelector("#shop-count");
const countAvailableElement =
  document.querySelector("#count-available");
const countLimitedElement =
  document.querySelector("#count-limited");
const countFullElement =
  document.querySelector("#count-full");
const shopListElement =
  document.querySelector("#shop-list");
const messageElement =
  document.querySelector("#message");
const lastLoadedElement =
  document.querySelector("#last-loaded");
const reloadButton =
  document.querySelector("#reload-button");
const reloadText =
  document.querySelector(".reload-text");
const template =
  document.querySelector("#shop-card-template");

let selectedCommunity = null;
let sessionToken = null;
let subscribedShopIds = new Set();
let subscriptionLoaded = false;
let processingShopIds = new Set();

reloadButton.addEventListener("click", loadStatus);

function getUrlParams() {
  return new URLSearchParams(window.location.search);
}

function getCommunityId() {
  return getUrlParams().get("id") || "shinagawa";
}

function getReturnShopId() {
  return getUrlParams().get("shopId");
}

function getLoginTicket() {
  return getUrlParams().get("loginTicket");
}

function getFriendFlag() {
  return getUrlParams().get("friendFlag");
}

function getStoredSessionToken() {
  return localStorage.getItem(
    SESSION_TOKEN_STORAGE_KEY
  );
}

function saveSessionToken(token) {
  sessionToken = token;

  localStorage.setItem(
    SESSION_TOKEN_STORAGE_KEY,
    token
  );
}

function clearSessionToken() {
  sessionToken = null;
  subscribedShopIds.clear();

  localStorage.removeItem(
    SESSION_TOKEN_STORAGE_KEY
  );
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function removeLoginParamsFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete("lineLogin");
  url.searchParams.delete("loginTicket");
  url.searchParams.delete("friendFlag");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`
  );
}

function showMessage(message, type = "info") {
  messageElement.textContent = message;
  messageElement.dataset.type = type;
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.removeAttribute("data-type");
}

async function processLineLoginCallback() {
  const loginTicket = getLoginTicket();

  if (!loginTicket) {
    return;
  }

  const communityId = getCommunityId();
  const shopId = getReturnShopId();
  const friendFlag = getFriendFlag();

  try {
    if (!shopId) {
      throw new Error(
        "通知対象の店舗が指定されていません。"
      );
    }

    if (friendFlag !== "true") {
      throw new Error(
        "通知を受け取るには、LINE公式アカウントを友だち追加してください。"
      );
    }

    showMessage(
      "通知設定を登録しています..."
    );

    const response = await fetch(
      `${API_BASE}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          communityId,
          shopId,
          loginTicket,
        }),
      }
    );

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `通知登録に失敗しました。HTTP ${response.status}`
      );
    }

    if (!data.sessionToken) {
      throw new Error(
        "通知登録APIからsessionTokenが返されませんでした。"
      );
    }

    saveSessionToken(data.sessionToken);
    subscribedShopIds.add(shopId);

    showMessage(
      "空席通知を登録しました。",
      "success"
    );
  } catch (error) {
    console.error(error);

    showMessage(
      error.message ||
      "通知登録に失敗しました。",
      "error"
    );
  } finally {
    removeLoginParamsFromUrl();
  }
}

function normalizeSubscriptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.subscriptions)) {
    return data.subscriptions;
  }

  if (Array.isArray(data.shopIds)) {
    return data.shopIds.map((shopId) => ({
      communityId: getCommunityId(),
      shopId,
    }));
  }

  return [];
}

async function loadMySubscriptions() {
  sessionToken = getStoredSessionToken();

  if (!sessionToken) {
    subscribedShopIds.clear();
    subscriptionLoaded = true;
    return;
  }

  const communityId = getCommunityId();

  try {
    const url = new URL(
      `${API_BASE}/subscriptions/me`
    );

    url.searchParams.set(
      "communityId",
      communityId
    );

    const response = await fetch(
      url.toString(),
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${sessionToken}`,
        },
        cache: "no-store",
      }
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSessionToken();
      subscriptionLoaded = true;
      return;
    }

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `通知状態の取得に失敗しました。HTTP ${response.status}`
      );
    }

    const subscriptions =
      normalizeSubscriptions(data);

    subscribedShopIds = new Set(
      subscriptions
        .filter((subscription) => {
          return (
            !subscription.communityId ||
            subscription.communityId ===
              communityId
          );
        })
        .map((subscription) =>
          subscription.shopId
        )
        .filter(Boolean)
    );
  } catch (error) {
    console.error(
      "通知状態の取得に失敗しました。",
      error
    );
  } finally {
    subscriptionLoaded = true;
  }
}

function redirectToLineLogin(shopId) {
  const communityId = getCommunityId();

  const loginUrl = new URL(
    `${API_BASE}/auth/line/start`
  );

  loginUrl.searchParams.set(
    "communityId",
    communityId
  );

  loginUrl.searchParams.set(
    "shopId",
    shopId
  );

  window.location.href =
    loginUrl.toString();
}

async function unsubscribe(shopId) {
  if (!sessionToken) {
    redirectToLineLogin(shopId);
    return;
  }

  if (processingShopIds.has(shopId)) {
    return;
  }

  processingShopIds.add(shopId);
  updateNotificationButtons();

  try {
    const response = await fetch(
      `${API_BASE}/subscriptions`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          communityId: getCommunityId(),
          shopId,
        }),
      }
    );

    const data = await readJson(response);

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSessionToken();

      throw new Error(
        "ログイン情報の有効期限が切れました。"
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `通知解除に失敗しました。HTTP ${response.status}`
      );
    }

    subscribedShopIds.delete(shopId);

    showMessage(
      "空席通知を解除しました。",
      "success"
    );
  } catch (error) {
    console.error(error);

    showMessage(
      error.message ||
      "通知解除に失敗しました。",
      "error"
    );
  } finally {
    processingShopIds.delete(shopId);
    updateNotificationButtons();
  }
}

function createNotificationButton(shopId) {
  const button =
    document.createElement("button");

  button.type = "button";
  button.className =
    "notification-button";
  button.dataset.shopId = shopId;

  button.addEventListener(
    "click",
    async () => {
      if (
        processingShopIds.has(shopId)
      ) {
        return;
      }

      if (
        subscribedShopIds.has(shopId)
      ) {
        await unsubscribe(shopId);
        return;
      }

      redirectToLineLogin(shopId);
    }
  );

  button.addEventListener(
    "mouseenter",
    () => {
      if (
        subscribedShopIds.has(shopId) &&
        !processingShopIds.has(shopId)
      ) {
        button.textContent =
          "通知を解除";
      }
    }
  );

  button.addEventListener(
    "mouseleave",
    () => {
      updateNotificationButton(
        button
      );
    }
  );

  updateNotificationButton(button);

  return button;
}

function updateNotificationButton(
  button
) {
  const shopId =
    button.dataset.shopId;

  const isProcessing =
    processingShopIds.has(shopId);

  const isSubscribed =
    subscribedShopIds.has(shopId);

  button.disabled = isProcessing;

  button.classList.toggle(
    "is-subscribed",
    isSubscribed
  );

  if (isProcessing) {
    button.textContent =
      "処理中...";
    return;
  }

  if (!subscriptionLoaded) {
    button.textContent =
      "確認中...";
    return;
  }

  if (isSubscribed) {
    button.textContent =
      "通知中";
    return;
  }

  button.textContent =
    "通知を受け取る";
}

function updateNotificationButtons() {
  document
    .querySelectorAll(
      ".notification-button"
    )
    .forEach((button) => {
      updateNotificationButton(
        button
      );
    });
}

async function getCommunityConfig() {
  const response = await fetch(
    `${API_BASE}/communities`,
    {
      cache: "no-store",
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
  const updatedAt =
    new Date(shop.updatedAt);

  if (
    Number.isNaN(
      updatedAt.getTime()
    )
  ) {
    return "unknown";
  }

  const elapsedMinutes =
    (
      Date.now() -
      updatedAt.getTime()
    ) /
    1000 /
    60;

  if (
    elapsedMinutes >=
    STALE_MINUTES
  ) {
    return "unknown";
  }

  return STATUS_CONFIG[shop.status]
    ? shop.status
    : "unknown";
}

function formatUpdatedAt(
  updatedAtText
) {
  const updatedAt =
    new Date(updatedAtText);

  if (
    Number.isNaN(
      updatedAt.getTime()
    )
  ) {
    return "更新時刻不明";
  }

  const elapsedMinutes =
    Math.floor(
      (
        Date.now() -
        updatedAt.getTime()
      ) /
      1000 /
      60
    );

  if (elapsedMinutes < 1) {
    return "たった今更新";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}分前に更新`;
  }

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(updatedAt);
}

function createShopCard(shop) {
  const fragment =
    template.content.cloneNode(true);

  const card =
    fragment.querySelector(
      ".shop-card"
    );

  const effectiveStatus =
    getEffectiveStatus(shop);

  const config =
    STATUS_CONFIG[
      effectiveStatus
    ];

  card.classList.add(
    `is-${effectiveStatus}`
  );

  fragment.querySelector(
    ".shop-genre"
  ).textContent =
    shop.genre || "飲食店";

  fragment.querySelector(
    ".shop-name"
  ).textContent =
    shop.name || "店舗名未設定";

  const statusBadge =
    fragment.querySelector(
      ".status-badge"
    );

  statusBadge.classList.add(
    config.className
  );

  fragment.querySelector(
    ".status-badge-label"
  ).textContent =
    config.label;

  fragment.querySelector(
    ".shop-note"
  ).textContent =
    effectiveStatus === "unknown"
      ? "最新の空席状況は店舗へご確認ください。"
      : shop.note ||
        "店舗からの補足情報はありません。";

  fragment.querySelector(
    ".shop-updated"
  ).textContent =
    `更新：${formatUpdatedAt(
      shop.updatedAt
    )}`;

  const shopLink =
    fragment.querySelector(
      ".shop-link"
    );

  if (shop.url) {
    shopLink.href = shop.url;
  } else {
    shopLink.removeAttribute(
      "href"
    );

    shopLink.textContent =
      "店舗情報は準備中";

    shopLink.setAttribute(
      "aria-disabled",
      "true"
    );
  }

const notificationButton =
  createNotificationButton(shop.id);

card.appendChild(notificationButton);

return fragment;
}

function renderSkeletons() {
  shopListElement.innerHTML = "";

  for (
    let i = 0;
    i < 2;
    i += 1
  ) {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      "shop-card is-skeleton";

    card.innerHTML = `
      <div class="skeleton-line" style="width:30%;margin-bottom:12px"></div>
      <div class="skeleton-line" style="width:58%;height:20px;margin-bottom:34px"></div>
      <div class="skeleton-line" style="width:90%;margin-bottom:10px"></div>
      <div class="skeleton-line" style="width:48%;margin-bottom:42px"></div>
      <div class="skeleton-line" style="width:100%;height:46px"></div>
    `;

    shopListElement.appendChild(
      card
    );
  }
}

function updateSummary(shops) {
  const counts = {
    available: 0,
    limited: 0,
    full: 0,
    unknown: 0,
  };

  shops.forEach((shop) => {
    counts[
      getEffectiveStatus(shop)
    ] += 1;
  });

  shopCountElement.textContent =
    shops.length;

  countAvailableElement.textContent =
    counts.available;

  countLimitedElement.textContent =
    counts.limited;

  countFullElement.textContent =
    counts.full;
}

function render(data) {
  const communityName =
    data.communityName ||
    selectedCommunity?.name ||
    "飲食店コミュニティ";

  communityNameElement.textContent =
    communityName;

  communityAreaElement.textContent =
    selectedCommunity?.area || "";

  document.title =
    `${communityName}｜今入れるお店`;

  const shops =
    Array.isArray(data.shops)
      ? data.shops
      : [];

  updateSummary(shops);
  shopListElement.innerHTML = "";

  if (shops.length === 0) {
    messageElement.textContent =
      "現在、掲載中の店舗はありません。";
    return;
  }

  const order = {
    available: 0,
    limited: 1,
    full: 2,
    unknown: 3,
  };

  shops
    .slice()
    .sort(
      (a, b) =>
        order[
          getEffectiveStatus(a)
        ] -
        order[
          getEffectiveStatus(b)
        ]
    )
    .forEach((shop) => {
      shopListElement.appendChild(
        createShopCard(shop)
      );
    });

  if (
    messageElement.dataset.type !==
      "success" &&
    messageElement.dataset.type !==
      "error"
  ) {
    clearMessage();
  }
}

async function loadStatus() {
  reloadButton.disabled = true;
  reloadButton.classList.add(
    "is-loading"
  );
  reloadText.textContent =
    "更新中...";

  if (
    messageElement.dataset.type !==
      "success" &&
    messageElement.dataset.type !==
      "error"
  ) {
    clearMessage();
  }

  renderSkeletons();

  try {
    if (!selectedCommunity) {
      selectedCommunity =
        await getCommunityConfig();
    }

    if (!selectedCommunity) {
      throw new Error(
        `コミュニティ「${getCommunityId()}」が見つかりません`
      );
    }

    const communityId =
      getCommunityId();

    const response = await fetch(
      `${API_BASE}/communities/${encodeURIComponent(
        communityId
      )}/status`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `status API: HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    render(data);

    lastLoadedElement.textContent =
      `最終取得 ${
        new Intl.DateTimeFormat(
          "ja-JP",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ).format(new Date())
      }`;
  } catch (error) {
    console.error(error);

    shopListElement.innerHTML = "";

    messageElement.textContent =
      "空席情報を読み込めませんでした。URLまたはAPI設定をご確認ください。";

    messageElement.dataset.type =
      "error";

    lastLoadedElement.textContent =
      "取得失敗";
  } finally {
    reloadButton.disabled = false;

    reloadButton.classList.remove(
      "is-loading"
    );

    reloadText.textContent =
      "最新情報に更新";
  }
}

async function initialize() {
  /*
   * LINE Loginから戻ってきた場合、
   * 最初に通知登録を処理する。
   */
  await processLineLoginCallback();

  /*
   * 保存済みsessionTokenを使い、
   * 通知中の店舗を取得する。
   */
  await loadMySubscriptions();

  /*
   * 通知状態取得後に店舗カードを描画する。
   */
  await loadStatus();
}
initialize();
