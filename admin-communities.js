const API_BASE =
  "https://tight-snowflake-f83f.kameyama.workers.dev";

const ADMIN_TOKEN_KEY =
  "communityAdminToken";

const communityListElement =
  document.querySelector("#admin-community-list");

const messageElement =
  document.querySelector("#community-message");

const pendingCountElement =
  document.querySelector("#pending-count");

const activeCountElement =
  document.querySelector("#active-count");

const communityCountElement =
  document.querySelector("#community-count");

const lastLoadedElement =
  document.querySelector("#community-last-loaded");

const reloadButton =
  document.querySelector("#reload-communities-button");

const logoutButton =
  document.querySelector("#logout-button");

let communities = [];

document.addEventListener(
  "DOMContentLoaded",
  initialize
);

reloadButton?.addEventListener(
  "click",
  loadCommunities
);

logoutButton?.addEventListener(
  "click",
  logout
);

communityListElement?.addEventListener(
  "click",
  handleCommunityClick
);

async function initialize() {

  const token =
    sessionStorage.getItem(
      ADMIN_TOKEN_KEY
    );

  if (!token) {
    location.href =
      "./admin-login.html";
    return;
  }

  await loadCommunities();
}

async function loadCommunities() {

  reloadButton.disabled = true;

  try {

    const response = await fetch(
      `${API_BASE}/admin/communities`,
      {
        headers: {
          Authorization:
            `Bearer ${sessionStorage.getItem(
              ADMIN_TOKEN_KEY
            )}`
        }
      }
    );

    const result =
      await response.json();

    if (response.status === 401) {

      sessionStorage.removeItem(
        ADMIN_TOKEN_KEY
      );

      location.href =
        "./admin-login.html";

      return;
    }

    if (!result.success) {
      throw new Error(
        result.message
      );
    }

    communities =
      result.communities || [];

    renderCommunities();

    updateSummary();

    lastLoadedElement.textContent =
      "最終取得：" +
      new Date().toLocaleString(
        "ja-JP"
      );

    showMessage("");

  } catch (error) {

    console.error(error);

    showMessage(
      error.message,
      true
    );

  } finally {

    reloadButton.disabled = false;

  }

}

function renderCommunities() {

  if (communities.length === 0) {

    communityListElement.innerHTML = `
      <article class="request-card">
        <p>コミュニティはありません。</p>
      </article>
    `;

    return;

  }

  communityListElement.innerHTML =
    communities
      .map(createCommunityCard)
      .join("");

}

function createCommunityCard(
  community
) {

  const pending =
    community.status === "pending";

  return `
<article class="request-card">

<div class="request-card-header">

<div>

<p class="request-genre">
${escapeHtml(
  community.area || ""
)}
</p>

<h3 class="request-shop-name">
${escapeHtml(
  community.name
)}
</h3>

</div>

<span class="request-status ${
  pending
    ? "request-status-pending"
    : "request-status-approved"
}">

${
  pending
    ? "承認待ち"
    : "公開中"
}

</span>

</div>

<dl class="request-detail-list">

${detailRow(
  "説明",
  community.description
)}

${detailRow(
  "申請者",
  community.ownerName
)}

${detailRow(
  "メール",
  community.email
)}

${detailRow(
  "店舗数",
  `${community.shopCount || 0}件`
)}

${detailRow(
  "管理コード",
  community.managementCode
)}

${detailRow(
  "ID",
  community.id
)}

</dl>

${
  pending
    ? `
<div class="request-actions">

<button
class="approve-request-button"
type="button"
data-community-id="${community.id}">

承認して公開

</button>

</div>
`
: `
<div class="request-actions">

<button
  class="approve-request-button edit-community-button"
  type="button"
  data-community-id="${community.id}"
>
  編集
</button>

<button
  class="delete-community-button"
  type="button"
  data-community-id="${community.id}"
  data-community-name="${escapeHtml(
    community.name
  )}"
>
  削除
</button>

</div>
`
}

</article>
`;

}

function detailRow(
  title,
  value
) {

  return `
<div class="request-detail-row">

<dt>${escapeHtml(title)}</dt>

<dd>

${escapeHtml(
  value || ""
)}

</dd>

</div>
`;

}
async function handleCommunityClick(
  event
) {

  const button =
    event.target.closest(
      ".approve-request-button"
    );

  if (!button) {
    return;
  }

  const communityId =
    button.dataset.communityId;

  if (!communityId) {
    return;
  }

  const confirmed =
    confirm(
      "このコミュニティを公開しますか？"
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "承認中...";

  try {

    const response =
      await fetch(
        `${API_BASE}/admin/communities/${encodeURIComponent(
          communityId
        )}/approve`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${sessionStorage.getItem(
                ADMIN_TOKEN_KEY
              )}`
          }
        }
      );

    const result =
      await response.json();

    if (response.status === 401) {

      sessionStorage.removeItem(
        ADMIN_TOKEN_KEY
      );

      location.href =
        "./admin-login.html";

      return;
    }

    if (!result.success) {
      throw new Error(
        result.message
      );
    }

    showMessage(
      "コミュニティを公開しました。"
    );

    await loadCommunities();

  } catch (error) {

    console.error(error);

    showMessage(
      error.message,
      true
    );

    button.disabled = false;
    button.textContent =
      originalText;

  }

}

function updateSummary() {

  const pending =
    communities.filter(
      (
        community
      ) =>
        community.status ===
        "pending"
    ).length;

  const active =
    communities.filter(
      (
        community
      ) =>
        community.status ===
        "active"
    ).length;

  pendingCountElement.textContent =
    pending;

  activeCountElement.textContent =
    active;

  communityCountElement.textContent =
    communities.length;

}

function showMessage(
  message,
  error = false
) {

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    message;

  messageElement.classList.toggle(
    "is-error",
    error
  );

}

function escapeHtml(
  value
) {

  return String(
    value || ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#39;"
    );

}

function logout() {

  sessionStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  location.href =
    "./admin-login.html";

}
