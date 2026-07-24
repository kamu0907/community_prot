const SHOP_REQUESTS_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/shop-requests";

const requestCountElement =
  document.querySelector("#request-count");

const requestListElement =
  document.querySelector("#request-list");

const requestMessageElement =
  document.querySelector("#request-message");

const lastLoadedElement =
  document.querySelector("#request-last-loaded");

const reloadButton =
  document.querySelector("#reload-requests-button");

const reloadText =
  reloadButton.querySelector(".reload-text");

const ADMIN_TOKEN_KEY =
  "communityAdminToken";

const adminToken =
  sessionStorage.getItem(
    ADMIN_TOKEN_KEY
  );

if (!adminToken) {
  window.location.href =
    "./admin-login.html";
}


reloadButton.addEventListener(
  "click",
  loadShopRequests
);

async function loadShopRequests() {
  setLoading(true);
  requestMessageElement.textContent = "";
  requestListElement.innerHTML = "";

  try {
    const response = await fetch(
      SHOP_REQUESTS_ENDPOINT,
      {
        headers: {
          Authorization:
            `Bearer ${adminToken}`
        }
      }
    );
    
    if (response.status === 401) {
      sessionStorage.removeItem(
        ADMIN_TOKEN_KEY
      );
    
      window.location.href =
        "./admin-login.html";
    
      return;
    }
    
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }
    
    const data = await response.json();
    
    const requests = Array.isArray(data.requests)
      ? data.requests
      : [];

    renderRequests(requests);

    lastLoadedElement.textContent =
      `最終取得 ${new Intl.DateTimeFormat(
        "ja-JP",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      ).format(new Date())}`;
  } catch (error) {
    console.error(
      "申請一覧取得エラー:",
      error
    );

    requestCountElement.textContent = "0";

    requestMessageElement.textContent =
      "申請一覧を取得できませんでした。";
  } finally {
    setLoading(false);
  }
}

function renderRequests(requests) {
  requestCountElement.textContent =
    requests.length;

  requestListElement.innerHTML = "";

  if (requests.length === 0) {
    requestMessageElement.textContent =
      "現在、店舗掲載申請はありません。";

    return;
  }

  requests.forEach((request) => {
    requestListElement.appendChild(
      createRequestCard(request)
    );
  });
}

function createRequestCard(request) {
  const article =
    document.createElement("article");

  article.className = "request-card";

  const requestedAt =
    formatDateTime(request.requestedAt);

  article.innerHTML = `
    <div class="request-card-header">
      <div>
        <p class="request-genre">
          ${escapeHtml(request.genre || "ジャンル未設定")}
        </p>
        <h3 class="request-shop-name">
          ${escapeHtml(request.shopName || "店舗名未設定")}
        </h3>
      </div>

      <span class="request-status">
        ${escapeHtml(getStatusLabel(request.status))}
      </span>
    </div>

    <dl class="request-detail-list">
      <div class="request-detail-row">
        <dt>住所</dt>
        <dd>${escapeHtml(request.address || "未入力")}</dd>
      </div>

      <div class="request-detail-row">
        <dt>担当者</dt>
        <dd>${escapeHtml(request.contactName || "未入力")}</dd>
      </div>

      <div class="request-detail-row">
        <dt>メール</dt>
        <dd>${escapeHtml(request.email || "未入力")}</dd>
      </div>

      <div class="request-detail-row">
        <dt>備考</dt>
        <dd>${escapeHtml(request.note || "未入力")}</dd>
      </div>

      <div class="request-detail-row">
        <dt>申請日時</dt>
        <dd>${escapeHtml(requestedAt)}</dd>
      </div>

      <div class="request-detail-row">
        <dt>申請ID</dt>
        <dd class="request-id">
          ${escapeHtml(request.requestId || "")}
        </dd>
      </div>
    </dl>

    ${
      request.url
        ? `
          <a
            class="shop-link"
            href="${escapeAttribute(request.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            店舗URLを開く
            <span class="shop-link-arrow" aria-hidden="true">
              &rarr;
            </span>
          </a>
        `
        : ""
    }
  `;

  return article;
}

function getStatusLabel(status) {
  const labels = {
    pending: "確認待ち",
    approved: "承認済み",
    rejected: "却下"
  };

  return labels[status] || "不明";
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

function setLoading(isLoading) {
  reloadButton.disabled = isLoading;

  reloadButton.classList.toggle(
    "is-loading",
    isLoading
  );

  reloadText.textContent = isLoading
    ? "更新中..."
    : "最新情報に更新";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

const logoutButton =
  document.querySelector(
    "#logout-button"
  );

logoutButton.addEventListener(
  "click",
  () => {
    sessionStorage.removeItem(
      ADMIN_TOKEN_KEY
    );

    window.location.href =
      "./admin-login.html";
  }
);

loadShopRequests();

