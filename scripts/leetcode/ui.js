const PUSH_BTN_ID = "manualGitSubmit";
const SPINNER_CLASS = "spinner";

const uploadState = { uploading: false };

function getGitIcon() {
  // Create an SVG element
  var gitSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  gitSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  gitSvg.setAttribute("width", "24");
  gitSvg.setAttribute("height", "24");
  gitSvg.setAttribute("viewBox", "0 0 114.8625 114.8625");

  // Create a path element inside the SVG
  var gitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  gitPath.setAttribute("fill", "#100f0d");
  gitPath.setAttribute(
    "d",
    "m112.693375 52.3185-50.149-50.146875c-2.886625-2.88875-7.57075-2.88875-10.461375 0l-10.412625 10.4145 13.2095 13.2095C57.94975 24.759 61.47025 25.45475 63.9165 27.9015c2.461 2.462 3.150875 6.01275 2.087375 9.09375l12.732 12.7305c3.081-1.062 6.63325-.3755 9.09425 2.088875 3.4375 3.4365 3.4375 9.007375 0 12.44675-3.44 3.4395-9.00975 3.4395-12.45125 0-2.585375-2.587875-3.225125-6.387125-1.914-9.57275l-11.875-11.874V74.06075c.837375.415 1.628375.96775 2.326625 1.664 3.4375 3.437125 3.4375 9.007375 0 12.44975-3.4375 3.436-9.01125 3.436-12.44625 0-3.4375-3.442375-3.4375-9.012625 0-12.44975.849625-.848625 1.8335-1.490625 2.88325-1.920375V42.26925c-1.04975-.42975-2.03125-1.066375-2.88325-1.920875-2.6035-2.602625-3.23-6.424375-1.894625-9.622125L36.55325 17.701875 2.1660125 52.086125c-2.88818 2.891125-2.88818 7.57525 0 10.463875l50.1513625 50.146975c2.88725 2.88818125 7.569875 2.88818125 10.461375 0l49.914625-49.9146c2.889625-2.889125 2.889625-7.575625 0-10.463875"
  );

  gitSvg.appendChild(gitPath);
  return gitSvg;
}

function addManualSubmitButton() {
  let elem = document.getElementById(PUSH_BTN_ID);
  const domain = document.URL.match(/:\/\/(www\.)?(.[^/:]+)/)[2].split(".")[0];
  if (elem || domain != "leetcode") return;

  var submitButton = document.createElement("button");
  submitButton.id = PUSH_BTN_ID;
  submitButton.className =
    "relative inline-flex gap-2 items-center justify-center font-medium cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors bg-transparent enabled:hover:bg-fill-secondary enabled:active:bg-fill-primary text-caption rounded text-text-primary group ml-auto p-1";
  submitButton.textContent = "Push ";
  submitButton.appendChild(getGitIcon());
  submitButton.addEventListener("click", loader);

  let notesIcon = document.querySelectorAll(".ml-auto svg.fa-bookmark");

  if (elementExists(notesIcon)) {
    const target = notesIcon[0].closest("button.ml-auto").parentElement;
    target.prepend(submitButton);
  }
}

function startSpinner() {
  let elem = document.getElementById(PUSH_BTN_ID);
  if (!elem) {
    elem = document.createElement("span");
    elem.id = PUSH_BTN_ID;
  }
  elem.style = "margin-right: 20px;padding-top: 2px;";
  elem.innerHTML = `<div id="${PUSH_BTN_ID}" class="${SPINNER_CLASS}"></div>`;
  startUploadCountDown();
}

function injectSpinnerStyle() {
  const style = document.createElement("style");
  style.textContent = `.${SPINNER_CLASS} {pointer-events: none;width: 2.0em;height: 2.0em;border: 0.4em solid transparent;border-color: #eee;border-top-color: #3E67EC;border-radius: 50%;animation: loadingspin 1s linear infinite;} @keyframes loadingspin { 100% { transform: rotate(360deg) }}`;
  document.head.append(style);
}

function markUploaded() {
  uploadState.uploading = false;
  const elem = document.getElementById(PUSH_BTN_ID);
  if (elem) {
    elem.style = "display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid #78b13f;border-right:7px solid #78b13f;";
    elem.innerHTML = "";
  }
}
function markUploadFailed() {
  uploadState.uploading = false;
  const elem = document.getElementById(PUSH_BTN_ID);
  if (elem) {
    elem.style = "display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid red;border-right:7px solid red;";
    elem.innerHTML = "";
  }
}

/**
 * 총 실행시간이 10초를 초과한다면 실패로 간주합니다.
 */
function startUploadCountDown() {
  uploadState.uploading = true;
  uploadState.countdown = setTimeout(() => {
    if (uploadState.uploading === true) {
      markUploadFailed();
    }
  }, 10000);
}
