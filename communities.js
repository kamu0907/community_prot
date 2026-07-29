const API_BASE =
  "https://tight-snowflake-f83f.kameyama.workers.dev";

const listElement =
  document.querySelector("#community-list");

const messageElement =
  document.querySelector("#community-message");

const countElement =
  document.querySelector("#community-count");

const template =
  document.querySelector(
    "#community-card-template"
  );

function renderCommunity(community) {
  const fragment =
    template.content.cloneNode(true);

  fragment.querySelector(
    ".community-area-badge"
  ).textContent = "公開中";

  fragment.querySelector(
    ".community-initial"
  ).textContent =
    String(
      community.name || "飲"
    ).slice(0, 1);

  fragment.querySelector(
    ".community-area"
  ).textContent =
    community.area || "エリア未設定";

  fragment.querySelector(
    ".community-name"
  ).textContent =
    community.name || "名称未設定";

  fragment.querySelector(
    ".community-description"
  ).textContent =
    community.description ||
    "コミュニティの紹介文は準備中です。";

  fragment.querySelector(
    ".community-shop-count"
  ).textContent =
    Number(community.shopCount) || 0;

  fragment.querySelector(
    ".community-status"
  ).textContent =
    "空席情報を確認できます";

  const communityLink =
    fragment.querySelector(
      ".community-link"
    );

  communityLink.href =
    `./community.html?id=${encodeURIComponent(
      community.id
    )}`;

  return fragment;
}

async function loadCommunities() {
  messageElement.textContent =
    "コミュニティを読み込んでいます...";

  listElement.innerHTML = "";
  countElement.textContent = "0";

  try {
    const response = await fetch(
      `${API_BASE}/communities`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        `HTTP ${response.status}`
      );
    }

    const communities =
      Array.isArray(data.communities)
        ? data.communities
        : [];

    countElement.textContent =
      communities.length;

    if (communities.length === 0) {
      messageElement.textContent =
        "現在公開中のコミュニティはありません。";

      return;
    }

    communities.forEach(
      (community) => {
        listElement.appendChild(
          renderCommunity(community)
        );
      }
    );

    messageElement.textContent = "";
  } catch (error) {
    console.error(
      "コミュニティ一覧取得エラー:",
      error
    );

    messageElement.textContent =
      "コミュニティ一覧を読み込めませんでした。";
  }
}

loadCommunities();
