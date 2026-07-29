const SHOP_REQUESTS_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/admin/shop-requests";

const APPROVE_REQUEST_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/admin/shop-requests";

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

    <span class="request-status request-status-${escapeHtml(
      request.status || "pending"
    )}">
      ${escapeHtml(getStatusLabel(request.status))}
    </span>
  </div>

  <dl class="request-detail-list">
  <div class="request-detail-row">
    <dt>コミュニティ</dt>
    <dd>
      ${escapeHtml(
        request.communityName || "未設定"
      )}
    </dd>
  </div>
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
          <span
            class="shop-link-arrow"
            aria-hidden="true"
          >
            &rarr;
          </span>
        </a>
      `
      : ""
  }

  ${
    request.status === "pending"
      ? `
        <div class="request-actions">
          <button
            class="approve-request-button"
            type="button"
            data-request-id="${escapeAttribute(
              request.requestId
            )}"
            data-community-id="${escapeAttribute(
              request.communityId || ""
            )}"
            data-shop-name="${escapeAttribute(
              request.shopName || ""
            )}"
          >
            この店舗を承認する
          </button>
        </div>
      `
      : `
  <div class="request-approved-box">
    <p class="request-approved-message">
      承認済み
    </p>

    ${
      request.registrationCode
        ? `
          <div class="registration-code-block">
            <p class="registration-code-label">
              LINE店舗登録コード
            </p>

            <div class="registration-code-row">
              <code class="registration-code">
                ${escapeHtml(request.registrationCode)}
              </code>

              <button
                class="copy-registration-code-button"
                type="button"
                data-registration-code="${escapeAttribute(
                  request.registrationCode
                )}"
              >
                コピー
              </button>
            </div>

            <p class="registration-code-help">
              LINEで「店舗登録 ${escapeHtml(
                request.registrationCode
              )}」と送信してください。
            </p>
          </div>
        `
        : `
          <p class="registration-code-missing">
            登録コードがありません。
          </p>
        `
    }
  </div>
`
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

requestListElement.addEventListener(
  "click",
  handleRequestListClick
);

async function handleRequestListClick(event) {
  const approveButton =
    event.target.closest(
      ".approve-request-button"
    );

  if (approveButton) {
    const requestId =
      approveButton.dataset.requestId;
    
    const communityId =
      approveButton.dataset.communityId;
    
    const shopName =
      approveButton.dataset.shopName ||
      "この店舗";

    if (!communityId || !requestId) {
      return;
    }
    
    const confirmed =
      window.confirm(
        `${shopName}を承認して、店舗一覧へ公開しますか？`
      );

    if (!confirmed) {
      return;
    }

    await approveShopRequest(
      communityId,
      requestId,
      approveButton
    );

    return;
  }

  const copyButton =
    event.target.closest(
      ".copy-registration-code-button"
    );

  if (copyButton) {
    const registrationCode =
      copyButton.dataset.registrationCode;

    if (!registrationCode) {
      return;
    }

    await copyRegistrationCode(
      registrationCode,
      copyButton
    );
  }
}
async function approveShopRequest(
  communityId,
  requestId,
  button
) {
  const adminToken =
    sessionStorage.getItem(
      ADMIN_TOKEN_KEY
    );

  if (!adminToken) {
    window.location.href =
      "./admin-login.html";

    return;
  }

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent = "承認中...";

  try {
    const response = await fetch(
      `${APPROVE_REQUEST_ENDPOINT}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          communityId,
          requestId
        })
      }
    );
    const data =
      await response.json();

    if (response.status === 401) {
      sessionStorage.removeItem(
        ADMIN_TOKEN_KEY
      );

      window.location.href =
        "./admin-login.html";

      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "承認処理に失敗しました。"
      );
    }

    window.alert(
      data.message ||
      "店舗を承認しました。"
    );

    await loadShopRequests();
  } catch (error) {
    console.error(
      "承認処理エラー:",
      error
    );

    window.alert(
      error.message ||
      "承認処理に失敗しました。"
    );

    button.disabled = false;
    button.textContent =
      originalText;
  }
}

async function copyRegistrationCode(
  registrationCode,
  button
) {
  const text =
    `店舗登録 ${registrationCode}`;

  const originalText =
    button.textContent;

  try {
    await navigator.clipboard.writeText(
      text
    );

    button.textContent =
      "コピーしました";

    setTimeout(() => {
      button.textContent =
        originalText;
    }, 1500);
  } catch (error) {
    console.error(
      "コピーエラー:",
      error
    );

    window.prompt(
      "以下をコピーしてください。",
      text
    );
  }
}
loadShopRequests();


