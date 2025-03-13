function handleMessage(request, sender, sendResponse) {
  if (request.action === "customCommitMessageUpdated") {
    chrome.storage.local.set({ custom_commit_message: request.message });
  }

  if (request && request.closeWebPage === true && request.isSuccess === true) {
    /* Set user property */
    chrome.storage.local.set({
      code_challenge_uploader_username: request.username,
      code_challenge_uploader_avatar: request.avatar,
      code_challenge_uploader_token: request.token,
    });

    /* Close pipe */
    chrome.storage.local.set({ pipe_code_challenge_uploader: false }, () => {
      console.log("Closed pipe.");
    });

    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
        var tab = tabs[0];
        chrome.tabs.remove(tab.id);
      }
    );

    /* Go to onboarding for UX */
    const urlOnboarding = chrome.runtime.getURL("welcome.html");
    chrome.tabs.create({ url: urlOnboarding, active: true }); // creates new tab
  } else if (
    request &&
    request.closeWebPage === true &&
    request.isSuccess === false
  ) {
    alert("Something went wrong while trying to authenticate your profile!");
    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
        var tab = tabs[0];
        chrome.tabs.remove(tab.id);
      }
    );
  }
}

chrome.runtime.onMessage.addListener(handleMessage);
