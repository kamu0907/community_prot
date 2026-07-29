const API_BASE = "https://tight-snowflake-f83f.kameyama.workers.dev";
const form = document.querySelector("#request-form");
const resultElement = document.querySelector("#result");
const submitButton = form.querySelector('button[type="submit"]');
const communitySelect = document.querySelector("#communityId");
const requestedCommunityId = new URLSearchParams(window.location.search).get("communityId") || "";

form.addEventListener("submit", handleSubmit);
loadCommunities();

async function loadCommunities() {
  try {
    const response = await fetch(`${API_BASE}/communities`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const communities = Array.isArray(data.communities) ? data.communities.filter((item) => item.status === "active") : [];
    communities.forEach((community) => {
      const option = document.createElement("option");
      option.value = community.id;
      option.textContent = `${community.name}（${community.area || "エリア未設定"}）`;
      option.selected = community.id === requestedCommunityId;
      communitySelect.appendChild(option);
    });
  } catch (error) {
    console.error("コミュニティ取得エラー:", error);
    showResult("申請先コミュニティを読み込めませんでした。", "error");
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearResult();
  const communityId = communitySelect.value;
  const requestData = {
    communityId,
    shopName: document.querySelector("#shopName").value.trim(),
    genre: document.querySelector("#genre").value.trim(),
    address: document.querySelector("#address").value.trim(),
    url: document.querySelector("#url").value.trim(),
    contactName: document.querySelector("#contactName").value.trim(),
    email: document.querySelector("#email").value.trim(),
    note: document.querySelector("#note").value.trim()
  };
  const validationMessage = validateRequest(requestData);
  if (validationMessage) return showResult(validationMessage, "error");
  setSubmitting(true);
  try {
    const response = await fetch(`${API_BASE}/communities/${encodeURIComponent(communityId)}/shop-requests`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestData)
    });
    const responseData = await parseResponse(response);
    if (!response.ok) throw new Error(responseData?.message || responseData?.error || `申請に失敗しました。HTTP ${response.status}`);
    showResult("店舗掲載の申請を受け付けました。内容を確認後、掲載についてご連絡します。", "success");
    const selected = communitySelect.value;
    form.reset();
    communitySelect.value = selected;
  } catch (error) {
    console.error("店舗掲載申請エラー:", error);
    showResult(error.message || "申請を送信できませんでした。", "error");
  } finally { setSubmitting(false); }
}

function validateRequest(data) {
  if (!data.communityId) return "申請先コミュニティを選択してください。";
  if (!data.shopName) return "店舗名を入力してください。";
  if (!data.genre) return "ジャンルを入力してください。";
  if (data.shopName.length > 100) return "店舗名は100文字以内で入力してください。";
  if (data.genre.length > 50) return "ジャンルは50文字以内で入力してください。";
  if (data.address.length > 200) return "住所は200文字以内で入力してください。";
  if (data.contactName.length > 100) return "担当者名は100文字以内で入力してください。";
  if (data.note.length > 1000) return "備考は1000文字以内で入力してください。";
  if (data.url && !isValidHttpUrl(data.url)) return "URLはhttp:// または https:// から入力してください。";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "メールアドレスの形式を確認してください。";
  return "";
}
function isValidHttpUrl(value) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; } }
async function parseResponse(response) { const type = response.headers.get("content-type") || ""; return type.includes("application/json") ? response.json() : { message: await response.text() }; }
function setSubmitting(value) { submitButton.disabled = value; submitButton.textContent = value ? "送信中..." : "掲載申請する"; }
function clearResult() { resultElement.textContent = ""; resultElement.className = "form-result"; }
function showResult(message, type) { resultElement.textContent = message; resultElement.className = `form-result is-${type}`; }
