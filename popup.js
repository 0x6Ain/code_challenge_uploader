/* global oAuth2 */
/* eslint no-undef: "error" */
// UI update
const UI = {
  showAuthMode: () => {
    action = true;
    $("#auth_mode").show();
  },

  showHookMode: () => {
    $("#hook_mode").show();
    document.getElementById("common_user_info").hidden = false;
  },

  showCommitMode: (hook) => {
    $("#commit_mode").show();
    document.getElementById("common_user_info").hidden = false;

    if (!hook) return;

    $("#repo_url").html(
      `<a target="blank" style="color: cadetblue !important; font-size:0.8em;"
          href="https://github.com/${hook}">${hook}</a>`
    );
  },

  updateUserInfo: (avatar, username) => {
    document.getElementById("avatar").src = avatar;
    document.getElementById("username").innerText = username;
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
    const { [STORAGE_KEYS.TOKEN]: token } = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
    if (!token) return UI.showAuthMode();

    // GitHub 토큰 검증
    await validateGithubToken(token);

    // 모드 확인 및 UI 업데이트
    const {
      [STORAGE_KEYS.MODE]: mode,
      [STORAGE_KEYS.AVATAR]: avatar,
      [STORAGE_KEYS.USERNAME]: username,
      [STORAGE_KEYS.HOOK]: hook,
    } = await chrome.storage.local.get([STORAGE_KEYS.MODE, STORAGE_KEYS.AVATAR, STORAGE_KEYS.USERNAME, STORAGE_KEYS.HOOK]);
    UI.updateUserInfo(avatar, username);

    switch (mode) {
      case "commit":
        UI.showCommitMode(hook);
        break;
      default:
        UI.showHookMode();
        break;
    }
  } catch (error) {
    console.error("Failed to initialize popup:", error);
    UI.showAuthMode();
  }
};

// 팝업 초기화 실행
initializePopup();

/*
  초기에 활성화 데이터가 존재하는지 확인, 없으면 새로 생성, 있으면 있는 데이터에 맞게 버튼 조정
 */
chrome.storage.local.get("enable", (data4) => {
  if (data4.enable === undefined) {
    $("#onffbox").prop("checked", true);
    chrome.storage.local.set({ enable: $("#onffbox").is(":checked") }, () => {});
  } else {
    $("#onffbox").prop("checked", data4.enable);
    chrome.storage.local.set({ enable: $("#onffbox").is(":checked") }, () => {});
  }
});
/*
    활성화 버튼 클릭 시 storage에 활성 여부 데이터를 저장.
   */
$("#onffbox").on("click", () => {
  chrome.storage.local.set({ enable: $("#onffbox").is(":checked") }, () => {});
});
