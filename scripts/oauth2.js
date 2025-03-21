// eslint-disable-next-line no-unused-vars
const oAuth2 = {
  /**
   * Initialize
   */
  init() {
    this.KEY = "code_challenge_uploader_token";
    this.ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    this.AUTHORIZATION_URL = "https://github.com/login/oauth/authorize";
    this.CLIENT_ID = "INPUT_YOUR_OWN";
    this.CLIENT_SECRET = "INPUT_YOUR_OWN";
    this.REDIRECT_URL = "https://github.com/";
    this.SCOPES = ["repo"];
  },

  /**
   * Begin
   */
  begin() {
    this.init(); // secure token params.

    let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri${this.REDIRECT_URL}&scope=`;

    for (let i = 0; i < this.SCOPES.length; i += 1) {
      url += this.SCOPES[i];
    }

    chrome.storage.local.set({ pipe_code_challenge_uploader: true }, () => {
      // opening pipe temporarily

      chrome.tabs.create({ url, selected: true }, function () {
        window.close();
        chrome.tabs.getCurrent(function (tab) {});
      });
    });
  },
};
