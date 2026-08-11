const API_BASE =
  "https://tight-snowflake-f83f.kameyama.workers.dev";

const COMMUNITIES_ENDPOINT =
  `${API_BASE}/communities`;

const ADMIN_TOKEN_KEY =
  "communityAdminToken";

const communitySelect =
  document.querySelector(
    "#community-select"
  );

const shopListElement =
  document.querySelector(
    "#shop-list"
  );

const shopMessageElement =
  document.querySelector(
    "#shop-message"
  );

const lastLoadedElement =
  document.querySelector(
    "#shop-last-loaded"
  );

const reloadButton =
  document.querySelector(
    "#reload-shops-button"
  );

const reloadText =
  reloadButton.querySelector(
    ".reload-text"
  );

const logoutButton =
  document.querySelector(
    "#logout-button"
  );

const modal =
  document.querySelector(
    "#shop-edit-modal"
  );

const editForm =
  document.querySelector(
    "#shop-edit-form"
  );

const editShopIdInput =
  document.querySelector(
    "#edit-shop-id"
  );

const editShopNameInput =
  document.querySelector(
    "#edit-shop-name"
  );

const editShopGenreInput =
  document.querySelector(
    "#edit-shop-genre"
  );

const editShopAddressInput =
  document.querySelector(
    "#edit-shop-address"
  );

const editShopUrlInput =
  document.querySelector(
    "#edit-shop-url"
  );

const editShopStatusInput =
  document.querySelector(
    "#edit-shop-status"
  );

const editShopOpenTimeInput =
  document.querySelector(
    "#edit-shop-open-time"
  );

const editShopCloseTimeInput =
  document.querySelector(
    "#edit-shop-close-time"
  );

const businessDayInputs =
  document.querySelectorAll(
    'input[name="businessDay"]'
  );

const businessExceptionList =
  document.querySelector(
    "#business-exception-list"
  );

const addBusinessExceptionButton =
  document.querySelector(
    "#add-business-exception-button"
  );

const saveButton =
  document.querySelector(
    "#save-shop-button"
  );

let currentShops = [];

const adminToken =
  sessionStorage.getItem(
    ADMIN_TOKEN_KEY
  );

if (!adminToken) {
  window.location.href =
    "./admin-login.html";
}

communitySelect.addEventListener(
  "change",
  loadShops
);

reloadButton.addEventListener(
  "click",
  loadShops
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

shopListElement.addEventListener(
  "click",
  handleShopListClick
);

editForm.addEventListener(
  "submit",
  handleEditSubmit
);

document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach((element) => {
    element.addEventListener(
      "click",
      closeEditModal
    );
  });

async function loadCommunities() {
  setLoading(true);

  shopMessageElement.textContent =
    "";

  try {
    const response =
      await fetch(
        COMMUNITIES_ENDPOINT
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    const communities =
      Array.isArray(
        data.communities
      )
        ? data.communities
        : Array.isArray(data)
          ? data
          : [];

    communitySelect.innerHTML = `
      <option value="">
        コミュニティを選択してください
      </option>
    `;

    communities.forEach(
      (community) => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          community.communityId ||
          community.id ||
          "";

        option.textContent =
          community.name ||
          community.communityName ||
          option.value;

        if (option.value) {
          communitySelect.appendChild(
            option
          );
        }
      }
    );

    if (
      communities.length === 0
    ) {
      shopMessageElement.textContent =
        "選択できるコミュニティがありません。";
    }
  } catch (error) {
    console.error(
      "コミュニティ一覧取得エラー:",
      error
    );

    shopMessageElement.textContent =
      "コミュニティ一覧を取得できませんでした。";
  } finally {
    setLoading(false);
  }
}

async function loadShops() {
  const communityId =
    communitySelect.value;

  shopMessageElement.textContent =
    "";

  shopListElement.innerHTML =
    "";

  currentShops = [];

  if (!communityId) {
    lastLoadedElement.textContent =
      "コミュニティを選択してください";

    return;
  }

  setLoading(true);

  try {
    const response =
      await fetch(
        `${API_BASE}/communities/${encodeURIComponent(
          communityId
        )}/status`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        `HTTP ${response.status}`
      );
    }

    currentShops =
      Array.isArray(data.shops)
        ? data.shops
        : [];

    renderShops(
      currentShops
    );

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
      "店舗一覧取得エラー:",
      error
    );

    shopMessageElement.textContent =
      error.message ||
      "店舗一覧を取得できませんでした。";
  } finally {
    setLoading(false);
  }
}

function renderShops(shops) {
  shopListElement.innerHTML =
    "";

  if (shops.length === 0) {
    shopMessageElement.textContent =
      "このコミュニティには登録済み店舗がありません。";

    return;
  }

  shops.forEach((shop) => {
    shopListElement.appendChild(
      createShopCard(shop)
    );
  });
}

function createShopCard(shop) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "request-card";

  article.innerHTML = `
    <div class="request-card-header">
      <div>
        <p class="request-genre">
          ${escapeHtml(
            shop.genre ||
            "ジャンル未設定"
          )}
        </p>

        <h3 class="request-shop-name">
          ${escapeHtml(
            shop.name ||
            "店舗名未設定"
          )}
        </h3>
      </div>

      <span class="request-status">
        ${escapeHtml(
          getShopStatusLabel(
            shop.status
          )
        )}
      </span>
    </div>

    <dl class="request-detail-list">
      <div class="request-detail-row">
        <dt>住所</dt>
        <dd>
          ${escapeHtml(
            shop.note ||
            "未入力"
          )}
        </dd>
      </div>

      <div class="request-detail-row">
        <dt>店舗ID</dt>
        <dd class="request-id">
          ${escapeHtml(
            shop.id || ""
          )}
        </dd>
      </div>

      <div class="request-detail-row">
        <dt>登録コード</dt>
        <dd>
          ${escapeHtml(
            shop.registrationCode ||
            "未発行"
          )}
        </dd>
      </div>
    </dl>

    ${
      shop.url
        ? `
          <a
            class="shop-link"
            href="${escapeAttribute(
              shop.url
            )}"
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

    <div class="request-actions">
      <button
        class="approve-request-button edit-shop-button"
        type="button"
        data-shop-id="${escapeAttribute(
          shop.id || ""
        )}"
      >
        編集
      </button>

      <button
        class="delete-shop-button"
        type="button"
        data-shop-id="${escapeAttribute(
          shop.id || ""
        )}"
        data-shop-name="${escapeAttribute(
          shop.name || ""
        )}"
      >
        削除
      </button>
    </div>
  `;

  return article;
}

async function handleShopListClick(
  event
) {
  const editButton =
    event.target.closest(
      ".edit-shop-button"
    );

  if (editButton) {
    const shop =
      findShop(
        editButton.dataset.shopId
      );

    if (shop) {
      openEditModal(shop);
    }

    return;
  }

  const deleteButton =
    event.target.closest(
      ".delete-shop-button"
    );

  if (deleteButton) {
    await deleteShop(
      deleteButton.dataset.shopId,
      deleteButton.dataset.shopName ||
      "この店舗",
      deleteButton
    );
  }
}

function findShop(shopId) {
  return currentShops.find(
    (shop) =>
      shop.id === shopId
  );
}

function addBusinessExceptionRow(
  exception = {}
) {
  const row =
    document.createElement("div");

  row.className =
    "business-exception-row";

  const type =
    exception.type === "open"
      ? "open"
      : "closed";

  row.innerHTML = `
    <div class="business-exception-main">
      <div class="form-group">
        <label>日付</label>
        <input
          class="form-control business-exception-date"
          type="date"
          value="${escapeAttribute(
            exception.date || ""
          )}"
          required
        />
      </div>

      <div class="form-group">
        <label>設定</label>

        <select
          class="form-control business-exception-type"
        >
          <option
            value="closed"
            ${
              type === "closed"
                ? "selected"
                : ""
            }
          >
            臨時休業
          </option>

          <option
            value="open"
            ${
              type === "open"
                ? "selected"
                : ""
            }
          >
            臨時営業
          </option>
        </select>
      </div>
    </div>

    <div class="business-exception-hours">
      <div class="form-group">
        <label>営業開始</label>
        <input
          class="form-control business-exception-open"
          type="time"
          value="${escapeAttribute(
            exception.hours?.open || ""
          )}"
        />
      </div>

      <div class="form-group">
        <label>営業終了</label>
        <input
          class="form-control business-exception-close"
          type="time"
          value="${escapeAttribute(
            exception.hours?.close || ""
          )}"
        />
      </div>
    </div>

    <div class="form-group">
      <label>備考</label>

      <input
        class="form-control business-exception-note"
        type="text"
        maxlength="100"
        placeholder="例：お盆休み"
        value="${escapeAttribute(
          exception.note || ""
        )}"
      />
    </div>

    <button
      type="button"
      class="remove-business-exception-button"
    >
      削除
    </button>
  `;

  businessExceptionList.appendChild(
    row
  );

  updateBusinessExceptionRow(
    row
  );
}


function updateBusinessExceptionRow(
  row
) {
  if (!row) {
    return;
  }

  const type =
    row.querySelector(
      ".business-exception-type"
    ).value;

  const hours =
    row.querySelector(
      ".business-exception-hours"
    );

  hours.hidden =
    type !== "open";
}


function getBusinessExceptions() {
  return [
    ...businessExceptionList.querySelectorAll(
      ".business-exception-row"
    )
  ].map((row) => {
    const type =
      row.querySelector(
        ".business-exception-type"
      ).value;

    const exception = {
      date:
        row.querySelector(
          ".business-exception-date"
        ).value,

      type,

      note:
        row.querySelector(
          ".business-exception-note"
        ).value.trim()
    };

    if (type === "open") {
      exception.hours = {
        open:
          row.querySelector(
            ".business-exception-open"
          ).value,

        close:
          row.querySelector(
            ".business-exception-close"
          ).value
      };
    }

    return exception;
  });
}


function validateBusinessSchedule(
  exceptions
) {
  const dates =
    exceptions
      .map(
        (item) => item.date
      )
      .filter(Boolean);

  if (
    dates.length !==
    new Set(dates).size
  ) {
    return (
      "同じ日付の臨時設定が複数あります。"
    );
  }

  for (const exception of exceptions) {
    if (!exception.date) {
      return (
        "臨時設定の日付を入力してください。"
      );
    }

    if (
      exception.type === "open" &&
      (
        !exception.hours?.open ||
        !exception.hours?.close
      )
    ) {
      return (
        `${exception.date} の臨時営業の営業時間を入力してください。`
      );
    }
  }

  return "";
}

function openEditModal(shop) {
  editShopIdInput.value =
    shop.id || "";

  editShopNameInput.value =
    shop.name || "";

  editShopGenreInput.value =
    shop.genre || "";

  editShopAddressInput.value =
    shop.note || "";

  editShopUrlInput.value =
    shop.url || "";

  editShopStatusInput.value =
    shop.status ||
    "available";

  const businessSchedule =
  shop.businessSchedule || {};

  const regular =
    businessSchedule.regular || {};
  
  const regularDays =
    Array.isArray(
      regular.days
    )
      ? regular.days
      : [];
  
  businessDayInputs.forEach(
    (input) => {
      input.checked =
        regularDays.includes(
          input.value
        );
    }
  );
  
  editShopOpenTimeInput.value =
    regular.hours?.open || "";
  
  editShopCloseTimeInput.value =
    regular.hours?.close || "";
  
  businessExceptionList.innerHTML =
    "";
  
  const exceptions =
    Array.isArray(
      businessSchedule.exceptions
    )
      ? businessSchedule.exceptions
      : [];
  
  exceptions.forEach(
    (exception) => {
      addBusinessExceptionRow(
        exception
      );
    }
  );
  modal.hidden = false;
  
  modal.classList.add(
    "is-open"
  );
  
  document.body.classList.add(
    "modal-open"
  );
  
  editShopNameInput.focus();
  
}

function closeEditModal() {
  modal.classList.remove(
    "is-open"
  );

  modal.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  editForm.reset();

  editShopIdInput.value =
    "";
}

async function handleEditSubmit(
  event
) {
  event.preventDefault();

  const communityId =
    communitySelect.value;

  const shopId =
    editShopIdInput.value;

  if (
    !communityId ||
    !shopId
  ) {
    return;
  }

  const originalText =
    saveButton.textContent;

  saveButton.disabled =
    true;

  saveButton.textContent =
    "保存中...";

  const businessExceptions =
    getBusinessExceptions();
  
  const businessScheduleError =
    validateBusinessSchedule(
      businessExceptions
    );
  
  if (businessScheduleError) {
    window.alert(
      businessScheduleError
    );
  
    return;
  }
  
  try {
    const response =
      await fetch(
        `${API_BASE}/admin/communities/${encodeURIComponent(
          communityId
        )}/shops/${encodeURIComponent(
          shopId
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${getAdminToken()}`
          },

          body: JSON.stringify({
            name:
              editShopNameInput
                .value
                .trim(),

            genre:
              editShopGenreInput
                .value
                .trim(),

            note:
              editShopAddressInput
                .value
                .trim(),

            url:
              editShopUrlInput
                .value
                .trim(),

            status:
              editShopStatusInput
                .value,

            businessSchedule: {
              regular: {
                days: [
                  ...businessDayInputs
                ]
                  .filter(
                    (input) =>
                      input.checked
                  )
                  .map(
                    (input) =>
                      input.value
                  ),
            
                hours: {
                  open:
                    editShopOpenTimeInput
                      .value,
            
                  close:
                    editShopCloseTimeInput
                      .value
                }
              },
            
              exceptions:
                businessExceptions
            }
          })
        }
      );

    const data =
      await response.json();

    handleUnauthorized(
      response
    );

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "店舗情報の更新に失敗しました。"
      );
    }

    closeEditModal();

    window.alert(
      data.message ||
      "店舗情報を更新しました。"
    );

    await loadShops();
  } catch (error) {
    console.error(
      "店舗更新エラー:",
      error
    );

    window.alert(
      error.message ||
      "店舗情報の更新に失敗しました。"
    );
  } finally {
    saveButton.disabled =
      false;

    saveButton.textContent =
      originalText;
  }
}

async function deleteShop(
  shopId,
  shopName,
  button
) {
  const communityId =
    communitySelect.value;

  if (
    !communityId ||
    !shopId
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `${shopName}を削除しますか？\nこの操作は取り消せません。`
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled =
    true;

  button.textContent =
    "削除中...";

  try {
    const response =
      await fetch(
        `${API_BASE}/admin/communities/${encodeURIComponent(
          communityId
        )}/shops/${encodeURIComponent(
          shopId
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${getAdminToken()}`
          }
        }
      );

    const data =
      await response.json();

    handleUnauthorized(
      response
    );

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "店舗の削除に失敗しました。"
      );
    }

    window.alert(
      data.message ||
      "店舗を削除しました。"
    );

    await loadShops();
  } catch (error) {
    console.error(
      "店舗削除エラー:",
      error
    );

    window.alert(
      error.message ||
      "店舗の削除に失敗しました。"
    );

    button.disabled =
      false;

    button.textContent =
      originalText;
  }
}

function getAdminToken() {
  const token =
    sessionStorage.getItem(
      ADMIN_TOKEN_KEY
    );

  if (!token) {
    window.location.href =
      "./admin-login.html";

    throw new Error(
      "ログインが必要です。"
    );
  }

  return token;
}

function handleUnauthorized(
  response
) {
  if (
    response.status !== 401
  ) {
    return;
  }

  sessionStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  window.location.href =
    "./admin-login.html";

  throw new Error(
    "ログインの有効期限が切れました。"
  );
}

function setLoading(isLoading) {
  reloadButton.disabled =
    isLoading;

  communitySelect.disabled =
    isLoading;

  reloadButton.classList.toggle(
    "is-loading",
    isLoading
  );

  reloadText.textContent =
    isLoading
      ? "更新中..."
      : "最新情報に更新";
}

function getShopStatusLabel(
  status
) {
  const labels = {
    available: "空席あり",
    limited: "残りわずか",
    full: "満席"
  };

  return labels[status] ||
    "状態不明";
}

function escapeHtml(value) {
  return String(value)
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
      "&#039;"
    );
}

function escapeAttribute(
  value
) {
  return escapeHtml(value);
}

addBusinessExceptionButton.addEventListener(
  "click",
  () => {
    addBusinessExceptionRow();
  }
);

businessExceptionList.addEventListener(
  "click",
  (event) => {
    const removeButton =
      event.target.closest(
        ".remove-business-exception-button"
      );

    if (!removeButton) {
      return;
    }

    removeButton
      .closest(
        ".business-exception-row"
      )
      ?.remove();
  }
);

businessExceptionList.addEventListener(
  "change",
  (event) => {
    if (
      !event.target.classList.contains(
        "business-exception-type"
      )
    ) {
      return;
    }

    updateBusinessExceptionRow(
      event.target.closest(
        ".business-exception-row"
      )
    );
  }
);

loadCommunities();
