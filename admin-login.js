const ADMIN_LOGIN_ENDPOINT =
  "https://tight-snowflake-f83f.kameyama.workers.dev/admin/login";

const ADMIN_TOKEN_KEY =
  "communityAdminToken";

const loginForm =
  document.querySelector(
    "#admin-login-form"
  );

const loginButton =
  document.querySelector(
    "#login-button"
  );

const loginMessage =
  document.querySelector(
    "#login-message"
  );

const existingToken =
  sessionStorage.getItem(
    ADMIN_TOKEN_KEY
  );

if (existingToken) {
  window.location.href =
    "./admin-requests.html";
}

loginForm.addEventListener(
  "submit",
  handleLogin
);

async function handleLogin(event) {
  event.preventDefault();

  const formData =
    new FormData(loginForm);

  const username =
    String(
      formData.get("username") || ""
    ).trim();

  const password =
    String(
      formData.get("password") || ""
    );

  if (!username || !password) {
    showMessage(
      "ユーザー名とパスワードを入力してください。",
      true
    );

    return;
  }

  setLoading(true);
  showMessage("");

  try {
    const response = await fetch(
      ADMIN_LOGIN_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "ログインに失敗しました。"
      );
    }

    sessionStorage.setItem(
      ADMIN_TOKEN_KEY,
      data.token
    );

    window.location.href =
      "./admin-requests.html";
  } catch (error) {
    console.error(
      "ログインエラー:",
      error
    );

    showMessage(
      error.message ||
      "ログインに失敗しました。",
      true
    );
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;

  loginButton.textContent =
    isLoading
      ? "ログイン中..."
      : "ログイン";
}

function showMessage(
  message,
  isError = false
) {
  loginMessage.textContent = message;

  loginMessage.classList.toggle(
    "is-error",
    isError
  );
}
