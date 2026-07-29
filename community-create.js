const API_BASE = "https://tight-snowflake-f83f.kameyama.workers.dev";
const form = document.querySelector("#community-create-form");
const button = document.querySelector("#community-create-button");
const result = document.querySelector("#community-create-result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  button.disabled = true;
  button.textContent = "作成中...";
  result.className = "form-result";
  result.textContent = "";
  try {
    const response = await fetch(`${API_BASE}/communities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.message || `作成に失敗しました。HTTP ${response.status}`);
    localStorage.setItem(`communityOwnerToken:${data.community.id}`, data.ownerToken);
    result.className = "form-result is-success create-result-box";
    result.innerHTML = `
      <strong>コミュニティを作成しました。</strong>
      <span>現在は公開確認待ちです。</span>
      <dl>
        <div><dt>コミュニティID</dt><dd><code>${escapeHtml(data.community.id)}</code></dd></div>
        <div><dt>管理コード</dt><dd><code>${escapeHtml(data.ownerToken)}</code></dd></div>
      </dl>
      <span>この管理コードは必ず保存してください。</span>`;
    form.reset();
  } catch (error) {
    console.error("コミュニティ作成エラー:", error);
    result.className = "form-result is-error";
    result.textContent = error.message || "コミュニティを作成できませんでした。";
  } finally {
    button.disabled = false;
    button.textContent = "コミュニティを作成する";
  }
});

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
