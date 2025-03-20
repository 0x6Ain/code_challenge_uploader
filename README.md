A chrome extension that automatically pushes your code to GitHub when you pass all tests.

This project is forked from [LeetHub-3.0](https://github.com/raphaelheinz/LeetHub-3.0) and [BaekjoonHub](https://github.com/BaekjoonHub/BaekjoonHub).

## Manual Installation

- Create your own OAuth app in GitHub (https://github.com/settings/applications/new) and securely store CLIENT_ID and CLIENT_SECRET
  - Application name: [CUSTOM]
  - Homepage URL: [CUSTOM]
  - Authorization callback URL: https://github.com/
- Download the project ZIP or clone this repository
- Update CLIENT_ID and CLIENT_SECRET in `scripts/authorize.js` and `scripts/oauth2.js` with your ids
- Go to [chrome://extensions](chrome://extensions)
- Enable [Developer mode](https://www.mstoic.com/enable-developer-mode-in-chrome/) by toggling the switch in top-right corner
- Click **"Load unpacked"**
- Select the entire downloaded folder

## Setup

1. After installing, launch the plugin
2. Click on "Authorize with GitHub" to set up your account
3. Setup an existing/new repository by clicking "Get Started"

## Currently Supported Platforms

- [프로그래머스](https://programmers.co.kr/)
- [LeetCode](http://leetcode.com/)
