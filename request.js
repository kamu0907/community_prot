const SHOP_REQUEST_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/shop-requests";

const form = document.querySelector("#request-form");
const resultElement = document.querySelector("#result");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  clearResult();

  const requestData = {
    shopName: document.querySelector("#shopName").value.trim(),
    genre: document.querySelector("#genre").value.trim(),
    address: document.querySelector("#address").value.trim(),
    url: document.querySelector("#url").value.trim(),
    contactName: document.querySelector("#contactName").value.trim(),
    email: document.querySelector("#email").value.trim(),
    note: document.querySelector("#note").value.trim(),
  };

  const validationMessage = validateRequest(requestData);

  if (validationMessage) {
    showResult(validationMessage, "error");
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch(SHOP_REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const responseData = await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
          responseData?.error ||
          `申請に失敗しました。HTTP ${response.status}`
      );
    }

    showResult(
      "店舗掲載の申請を受け付けました。内容を確認後、掲載についてご連絡します。",
      "success"
    );

    form.reset();
  } catch (error) {
    console.error("店舗掲載申請エラー:", error);

    showResult(
      error.message ||
        "申請を送信できませんでした。時間を置いて再度お試しください。",
      "error"
    );
  } finally {
    setSubmitting(false);
  }
}

function validateRequest(data) {
  if (!data.shopName) {
    return "店舗名を入力してください。";
  }

  if (!data.genre) {
    return "ジャンルを入力してください。";
  }

  if (data.shopName.length > 100) {
    return "店舗名は100文字以内で入力してください。";
  }

  if (data.genre.length > 50) {
    return "ジャンルは50文字以内で入力してください。";
  }

  if (data.address.length > 200) {
    return "住所は200文字以内で入力してください。";
  }

  if (data.contactName.length > 100) {
    return "担当者名は100文字以内で入力してください。";
  }

  if (data.note.length > 1000) {
    return "備考は1000文字以内で入力してください。";
  }

  if (data.url && !isValidHttpUrl(data.url)) {
    return "ホームページ・SNSには、http:// または https:// から始まるURLを入力してください。";
  }

  if (data.email && !isValidEmail(data.email)) {
    return "メールアドレスの形式を確認してください。";
  }

  return "";
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { message: text } : {};
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting
    ? "送信中..."
    : "掲載申請する";
}

function clearResult() {
  resultElement.textContent = "";
  resultElement.className = "form-result";
}

function showResult(message, type) {
  resultElement.textContent = message;
  resultElement.className = `form-result is-${type}`;
}
