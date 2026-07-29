const listElement = document.querySelector("#community-list");
const messageElement = document.querySelector("#community-message");
const countElement = document.querySelector("#community-count");
const template = document.querySelector("#community-card-template");

function renderCommunity(community) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".community-card");

  fragment.querySelector(".community-area-badge").textContent =
    community.status === "active" ? "公開中" : "準備中";
  fragment.querySelector(".community-initial").textContent =
    (community.name || "飲").slice(0, 1);
  fragment.querySelector(".community-area").textContent = community.area || "エリア未設定";
  fragment.querySelector(".community-name").textContent = community.name || "名称未設定";
  fragment.querySelector(".community-description").textContent =
    community.description || "コミュニティの紹介文は準備中です。";
  fragment.querySelector(".community-shop-count").textContent = Number(community.shopCount) || 0;
  fragment.querySelector(".community-status").textContent =
    community.status === "active" ? "空席情報を確認できます" : "近日公開";

  const link = fragment.querySelector(".community-link");
  if (community.status === "active") {
    link.href = `./community.html?id=${encodeURIComponent(community.id)}`;
  } else {
    link.removeAttribute("href");
    link.textContent = "準備中";
    link.setAttribute("aria-disabled", "true");
    card.classList.add("is-disabled");
  }
  return fragment;
}

async function loadCommunities() {
  messageElement.textContent = "コミュニティを読み込んでいます...";
  try {
    const response = await fetch("./communities.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const communities = Array.isArray(data.communities) ? data.communities : [];
    countElement.textContent = communities.length;
    listElement.innerHTML = "";
    if (communities.length === 0) {
      messageElement.textContent = "現在公開中のコミュニティはありません。";
      return;
    }
    communities.forEach((community) => listElement.appendChild(renderCommunity(community)));
    messageElement.textContent = "";
  } catch (error) {
    console.error(error);
    messageElement.textContent = "コミュニティ一覧を読み込めませんでした。";
  }
}

loadCommunities();
