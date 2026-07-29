const API_BASE =
  "https://tight-snowflake-f83f.kameyama.workers.dev";

const form =
  document.querySelector("#community-create-form");

const button =
  document.querySelector("#community-create-button");

const result =
  document.querySelector("#community-create-result");

form.addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const payload =
    Object.fromEntries(
      new FormData(form).entries()
    );

  button.disabled = true;
  button.textContent = "作成中...";

  result.className = "form-result";
  result.textContent = "";

  try {
    const response = await fetch(
      `${API_BASE}/communities`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const responseData =
      await response.json().catch(
        () => ({})
      );

    console.log(
      "コミュニティ作成APIレスポンス:",
      responseData
    );

    if (
      !response.ok ||
      !responseData.success
    ) {
      throw new Error(
        responseData.message ||
        `作成に失敗しました。HTTP ${response.status}`
      );
    }

    const communityData =
      responseData.data;

    if (
      !communityData ||
      !communityData.communityId
    ) {
      throw new Error(
        "コミュニティIDを取得できませんでした。"
      );
    }

    const communityId =
      communityData.communityId;

    const managementCode =
      communityData.managementCode || "";

    if (managementCode) {
      localStorage.setItem(
        `communityOwnerToken:${communityId}`,
        managementCode
      );
    }

    result.className =
      "form-result is-success create-result-box";

    result.innerHTML = `
      <strong>
        コミュニティ作成申請を受け付けました。
      </strong>

      <span>
        現在は公開確認待ちです。
      </span>

      <dl>
        <div>
          <dt>コミュニティID</dt>
          <dd>
            <code>${escapeHtml(communityId)}</code>
          </dd>
        </div>

        <div>
          <dt>管理コード</dt>
          <dd>
            <code>${escapeHtml(managementCode)}</code>
          </dd>
        </div>
      </dl>

      <span>
        この管理コードは必ず保存してください。
      </span>
    `;

    form.reset();
  } catch (error) {
    console.error(
      "コミュニティ作成エラー:",
      error
    );

    result.className =
      "form-result is-error";

    result.textContent =
      error.message ||
      "コミュニティを作成できませんでした。";
  } finally {
    button.disabled = false;
    button.textContent =
      "コミュニティを作成する";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
