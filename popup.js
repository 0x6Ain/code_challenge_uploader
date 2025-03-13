/* global oAuth2 */
/* eslint no-undef: "error" */
const STORAGE_KEYS = {
  TOKEN: "code_challenge_uploader_token",
  AVATAR: "code_challenge_uploader_avatar",
  USERNAME: "code_challenge_uploader_username",
};
// UI update
const updateUI = {
  avatar: (url) => {
    if (!url) return;
    const avatarImg = document.getElementById("avatar");
    avatarImg.src = url;
  },

  username: (name) => {
    if (!name) return;
    const usernameElement = document.getElementById("username");
    usernameElement.textContent = name;
  },
};

let action = false;

$("#authenticate").on("click", () => {
  if (action) {
    oAuth2.begin();
  }
});

$("#welcome_URL").attr("href", chrome.runtime.getURL("welcome.html"));
$("#hook_URL").attr("href", chrome.runtime.getURL("welcome.html"));

chrome.storage.local.get(STORAGE_KEYS.TOKEN, (data) => {
  const token = data.code_challenge_uploader_token;
  if (token === null || token === undefined) {
    action = true;
    $("#auth_mode").show();
  } else {
    // To validate user, load user object from GitHub.
    const AUTHENTICATION_URL = "https://api.github.com/user";

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          /* Show MAIN FEATURES */
          chrome.storage.local.get("mode_type", (data2) => {
            if (data2 && data2.mode_type === "commit") {
              $("#commit_mode").show();
              /* Get problem stats and repo link */
              chrome.storage.local.get(
                ["stats", "code_challenge_uploader_hook"],
                (data3) => {
                  const { stats } = data3;
                  if (stats && stats.solved) {
                    $("#p_solved").text(stats.solved);
                    $("#p_solved_easy").text(stats.easy);
                    $("#p_solved_medium").text(stats.medium);
                    $("#p_solved_hard").text(stats.hard);
                  }
                  const code_challenge_uploaderHook =
                    data3.code_challenge_uploader_hook;
                  if (code_challenge_uploaderHook) {
                    $("#repo_url").html(
                      `<a target="blank" style="color: cadetblue !important; font-size:0.8em;" href="https://github.com/${code_challenge_uploader_hook}">${code_challenge_uploader_hook}</a>`
                    );
                  }
                }
              );
            } else {
              $("#hook_mode").show();
              // 사용자 정보 로드
              chrome.storage.local.get(
                [STORAGE_KEYS.AVATAR, STORAGE_KEYS.USERNAME],
                (result) => {
                  updateUI.avatar(result[STORAGE_KEYS.AVATAR]);
                  updateUI.username(result[STORAGE_KEYS.USERNAME]);
                }
              );
            }
          });
        } else if (xhr.status === 401) {
          // bad oAuth: reset token and redirect to authorization process again!
          chrome.storage.local.set(
            { code_challenge_uploader_token: null },
            () => {
              console.log("BAD oAuth!!! Redirecting back to oAuth process");
              action = true;
              $("#auth_mode").show();
            }
          );
        }
      }
    });
    xhr.open("GET", AUTHENTICATION_URL, true);
    xhr.setRequestHeader("Authorization", `token ${token}`);
    xhr.send();
  }
});
