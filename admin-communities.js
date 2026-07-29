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

const communityEditModal =
  document.querySelector(
    "#community-edit-modal"
  );

const communityEditForm =
  document.querySelector(
    "#community-edit-form"
  );

const editCommunityId =
  document.querySelector(
    "#edit-community-id"
  );

const editCommunityName =
  document.querySelector(
    "#edit-community-name"
  );

const editCommunityArea =
  document.querySelector(
    "#edit-community-area"
  );

const editCommunityDescription =
  document.querySelector(
    "#edit-community-description"
  );

const editCommunityOwnerName =
  document.querySelector(
    "#edit-community-owner-name"
  );

const editCommunityEmail =
  document.querySelector(
    "#edit-community-email"
  );

const editCommunityStatus =
  document.querySelector(
    "#edit-community-status"
  );

const communityEditMessage =
  document.querySelector(
    "#community-edit-message"
  );

const closeCommunityModalButton =
  document.querySelector(
    "#close-community-modal-button"
  );

const cancelCommunityEditButton =
  document.querySelector(
    "#cancel-community-edit-button"
  );

const saveCommunityButton =
  document.querySelector(
    "#save-community-button"
  );

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

communityEditForm?.addEventListener(
  "submit",
  handleCommunityEditSubmit
);

closeCommunityModalButton?.addEventListener(
  "click",
  closeCommunityEditModal
);

cancelCommunityEditButton?.addEventListener(
  "click",
  closeCommunityEditModal
);

document
  .querySelectorAll(
    "[data-close-community-modal]"
  )
  .forEach((element) => {
    element.addEventListener(
      "click",
      closeCommunityEditModal
    );
  });

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      communityEditModal?.classList.contains(
        "is-open"
      )
    ) {
      closeCommunityEditModal();
    }
  }
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
  community.status === "pending"
    ? "request-status-pending"
    : community.status === "active"
      ? "request-status-approved"
      : "request-status-inactive"
}">

${
  community.status === "pending"
    ? "承認待ち"
    : community.status === "active"
      ? "公開中"
      : "非公開"
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

  const editButton =
    event.target.closest(
      ".edit-community-button"
    );

  if (editButton) {

    const communityId =
      editButton.dataset.communityId;

    openCommunityEditModal(
      communityId
    );

    return;
  }

  const deleteButton =
    event.target.closest(
      ".delete-community-button"
    );

  if (deleteButton) {

    const communityId =
      deleteButton.dataset.communityId;

    const communityName =
      deleteButton.dataset.communityName;

    await deleteCommunity(
      communityId,
      communityName,
      deleteButton
    );

    return;
  }

  const approveButton =
    event.target.closest(
      ".approve-request-button"
    );

  if (!approveButton) {
    return;
  }

  const communityId =
    approveButton.dataset.communityId;

  if (!communityId) {
    return;
  }

  await approveCommunity(
    communityId,
    approveButton
  );

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

function showCommunityEditMessage(
  message,
  error = false
) {

  communityEditMessage.textContent =
    message;

  communityEditMessage.classList.toggle(
    "is-error",
    error
  );

}

async function readJsonResponse(
  response
) {

  try {

    return await response.json();

  } catch {

    return {
      success: false,
      message:
        "サーバーから不正な応答が返されました。"
    };

  }

}

function logout() {

  sessionStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  location.href =
    "./admin-login.html";

}

async function approveCommunity(
  communityId,
  button
) {

  const confirmed =
    confirm(
      "このコミュニティを承認して公開しますか？"
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
      await readJsonResponse(
        response
      );

    if (response.status === 401) {
      logout();
      return;
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "コミュニティを承認できませんでした。"
      );
    }

    await loadCommunities();

    showMessage(
      "コミュニティを承認して公開しました。"
    );

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

function openCommunityEditModal(
  communityId
) {

  const community =
    communities.find(
      (item) =>
        item.id === communityId
    );

  if (!community) {

    showMessage(
      "編集対象のコミュニティが見つかりません。",
      true
    );

    return;
  }

  editCommunityId.value =
    community.id || "";

  editCommunityName.value =
    community.name || "";

  editCommunityArea.value =
    community.area || "";

  editCommunityDescription.value =
    community.description || "";

  editCommunityOwnerName.value =
    community.ownerName || "";

  editCommunityEmail.value =
    community.email || "";

  editCommunityStatus.value =
    community.status === "inactive"
      ? "inactive"
      : "active";

  communityEditMessage.textContent =
    "";

  communityEditMessage.classList.remove(
    "is-error"
  );

  communityEditModal.classList.add(
    "is-open"
  );

  communityEditModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  editCommunityName.focus();

}

function closeCommunityEditModal() {

  communityEditModal.classList.remove(
    "is-open"
  );

  communityEditModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

  communityEditForm.reset();

  communityEditMessage.textContent =
    "";

  communityEditMessage.classList.remove(
    "is-error"
  );

}

async function handleCommunityEditSubmit(
  event
) {

  event.preventDefault();

  const communityId =
    editCommunityId.value.trim();

  const name =
    editCommunityName.value.trim();

  const area =
    editCommunityArea.value.trim();

  const description =
    editCommunityDescription.value.trim();

  const ownerName =
    editCommunityOwnerName.value.trim();

  const email =
    editCommunityEmail.value.trim();

  const status =
    editCommunityStatus.value;

  if (!communityId) {

    showCommunityEditMessage(
      "コミュニティIDが取得できませんでした。",
      true
    );

    return;
  }

  if (!name) {

    showCommunityEditMessage(
      "コミュニティ名を入力してください。",
      true
    );

    editCommunityName.focus();

    return;
  }

  if (!area) {

    showCommunityEditMessage(
      "エリアを入力してください。",
      true
    );

    editCommunityArea.focus();

    return;
  }

  const originalText =
    saveCommunityButton.textContent;

  saveCommunityButton.disabled =
    true;

  saveCommunityButton.textContent =
    "保存中...";

  showCommunityEditMessage("");

  try {

    const response =
      await fetch(
        `${API_BASE}/admin/communities/${encodeURIComponent(
          communityId
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${sessionStorage.getItem(
                ADMIN_TOKEN_KEY
              )}`
          },

          body: JSON.stringify({
            name,
            area,
            description,
            ownerName,
            email,
            status
          })
        }
      );

    const result =
      await readJsonResponse(
        response
      );

    if (response.status === 401) {
      logout();
      return;
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "コミュニティを更新できませんでした。"
      );
    }

    closeCommunityEditModal();

    await loadCommunities();

    showMessage(
      result.message ||
      "コミュニティを更新しました。"
    );

  } catch (error) {

    console.error(error);

    showCommunityEditMessage(
      error.message,
      true
    );

  } finally {

    saveCommunityButton.disabled =
      false;

    saveCommunityButton.textContent =
      originalText;

  }

}
async function deleteCommunity(
  communityId,
  communityName,
  button
) {

  if (!communityId) {
    return;
  }

  const displayName =
    communityName ||
    "このコミュニティ";

  const confirmed =
    confirm(
      `「${displayName}」を削除します。\n\n` +
      "登録店舗と店舗掲載申請も削除されます。\n" +
      "この操作は元に戻せません。\n\n" +
      "本当に削除しますか？"
    );

  if (!confirmed) {
    return;
  }

  const secondConfirmed =
    confirm(
      `最終確認です。\n\n` +
      `「${displayName}」を完全に削除しますか？`
    );

  if (!secondConfirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "削除中...";

  try {

    const response =
      await fetch(
        `${API_BASE}/admin/communities/${encodeURIComponent(
          communityId
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${sessionStorage.getItem(
                ADMIN_TOKEN_KEY
              )}`
          }
        }
      );

    const result =
      await readJsonResponse(
        response
      );

    if (response.status === 401) {
      logout();
      return;
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "コミュニティを削除できませんでした。"
      );
    }

    await loadCommunities();

    showMessage(
      result.message ||
      "コミュニティを削除しました。"
    );

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
