/* global oAuth2 */
/* eslint no-undef: "error" */
// UI update
const UI = {
  showAuthMode: () => {
    action = true;
    $("#auth_mode").show();
  },

  updateStats: (stats) => {
    if (!stats?.solved) return;

    $("#p_solved").text(stats.solved);
    $("#p_solved_easy").text(stats.easy);
    $("#p_solved_medium").text(stats.medium);
    $("#p_solved_hard").text(stats.hard);
  },

  updateRepoUrl: (hook) => {
    if (!hook) return;

    $("#repo_url").html(
      `<a target="blank" style="color: cadetblue !important; font-size:0.8em;"
          href="https://github.com/${hook}">${hook}</a>`
    );
  },

  updateUserInfo: (avatar, username) => {
    updateUI.avatar(avatar);
    updateUI.username(username);
  },
};

let action = false;

$("#authenticate").on("click", () => action && oAuth2.begin());
$("#welcome_URL").attr("href", chrome.runtime.getURL("welcome.html"));
$("#hook_URL").attr("href", chrome.runtime.getURL("welcome.html"));

const validateGithubToken = async (token) => {
  const response = await fetch(GITHUB_API.USER, {
    headers: { Authorization: `token ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.set({ [STORAGE_KEYS.TOKEN]: null });
      console.log("BAD oAuth!!! Redirecting back to oAuth process");
      UI.showAuthMode();
    }
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  return response.json();
};

const initializePopup = async () => {
  try {
    // 토큰 확인
    const { [STORAGE_KEYS.TOKEN]: token } = await chrome.storage.local.get(
      STORAGE_KEYS.TOKEN
    );
    if (!token) return UI.showAuthMode();

    // GitHub 토큰 검증
    await validateGithubToken(token);

    // 모드 확인 및 UI 업데이트
    const { [STORAGE_KEYS.MODE]: mode } = await chrome.storage.local.get(
      STORAGE_KEYS.MODE
    );

    switch (mode) {
      case "commit":
        $("#commit_mode").show();
        // stats와 hook 정보 가져오기
        const { [STORAGE_KEYS.STATS]: stats, [STORAGE_KEYS.HOOK]: hook } =
          await chrome.storage.local.get([
            STORAGE_KEYS.STATS,
            STORAGE_KEYS.HOOK,
          ]);

        UI.updateStats(stats);
        UI.updateRepoUrl(hook);
        break;
      default:
        $("#hook_mode").show();
        // 사용자 정보 가져오기
        const {
          [STORAGE_KEYS.AVATAR]: avatar,
          [STORAGE_KEYS.USERNAME]: username,
        } = await chrome.storage.local.get([
          STORAGE_KEYS.AVATAR,
          STORAGE_KEYS.USERNAME,
        ]);

        UI.updateUserInfo(avatar, username);
        break;
    }
  } catch (error) {
    console.error("Failed to initialize popup:", error);
    UI.showAuthMode();
  }
};

// 팝업 초기화 실행
initializePopup();
