/*
    (needs patch)
    IMPLEMENTATION OF AUTHENTICATION ROUTE AFTER REDIRECT FROM GITHUB.
*/

const localAuth = {
  /**
   * Initialize
   */
  init() {
    this.KEY = "code_challenge_uploader_token";
    this.ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    this.CLIENT_ID = "INPUT_YOUR_OWN";
    this.CLIENT_SECRET = "INPUT_YOUR_OWN";
    this.REDIRECT_URL = "https://github.com/";
    this.SCOPES = ["repo"];
  },

  /**
   * Parses Access Code
   *
   * @param url The url containing the access code.
   */
  parseAccessCode(url) {
    if (url.match(/\?error=(.+)/)) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs[0];
        chrome.tabs.remove(tab.id, function () {});
      });
    } else {
      // eslint-disable-next-line
      this.requestToken(url.match(/\?code=([\w\/\-]+)/)[1]);
    }
  },

  /**
   * Request Token
   *
   * @param code The access code returned by provider.
   */
  requestToken(code) {
    const that = this;
    const data = new FormData();
    data.append("client_id", this.CLIENT_ID);
    data.append("client_secret", this.CLIENT_SECRET);
    data.append("code", code);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          that.finish(xhr.responseText.match(/access_token=([^&]*)/)[1]);
        } else {
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: false,
          });
        }
      }
    });
    xhr.open("POST", this.ACCESS_TOKEN_URL, true);
    xhr.send(data);
  },

  /**
   * Finish
   *
   * @param token The OAuth2 token given to the application from the provider.
   */
  finish(token) {
    /* Get username */
    // To validate user, load user object from GitHub.
    const AUTHENTICATION_URL = "https://api.github.com/user";

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: true,
            token,
            username: data.login,
            avatar: data.avatar_url,
            KEY: this.KEY,
          });
        }
      }
    });
    xhr.open("GET", AUTHENTICATION_URL, true);
    xhr.setRequestHeader("Authorization", `token ${token}`);
    xhr.send();
  },
};

localAuth.init(); // load params.
const link = window.location.href;
/* Check for open pipe */
if (window.location.host === "github.com") {
  chrome.storage.local.get("pipe_code_challenge_uploader", (data) => {
    if (data && data.pipe_code_challenge_uploader) {
      localAuth.parseAccessCode(link);
    }
  });
}
