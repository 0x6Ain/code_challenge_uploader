/* state of upload for progress */
const uploadState = { uploading: false };
/**
 * 로딩 버튼 추가
 */
function startUpload() {
  let elem = document.getElementById("progress_anchor_element");
  if (elem !== undefined) {
    elem = document.createElement("span");
    elem.id = "progress_anchor_element";
    elem.className = "runcode-wrapper__8rXm";
    elem.style = "margin-left: 10px;padding-top: 0px;";
  }
  elem.innerHTML = `<div id="progress_elem" class="progress_spinner"></div>`;
  const target = document.querySelector("#modal-dialog > div.modal-dialog > div.modal-content > div.modal-footer");
  if (!isNull(target)) {
    target.prepend(elem);
  }
  // start the countdown
  startUploadCountDown();
}

/**
 * 업로드 완료 아이콘 표시 및 링크 생성
 * @param {object} branches - 브랜치 정보 ('userName/repositoryName': 'branchName')
 * @param {string} directory - 디렉토리 정보 ('백준/Gold/1. 문제이름')
 * 1. 업로드 완료 아이콘을 표시합니다.
 * 2. 아이콘 클릭 시 업로드된 GitHub 링크로 이동하는 이벤트 리스너를 등록합니다.
 */
function markUploadedCSS(branches, directory) {
  uploadState.uploading = false;
  const elem = document.getElementById("progress_elem");
  elem.className = "markuploaded";
  const uploadedUrl = "https://github.com/" + Object.keys(branches)[0] + "/tree/" + branches[Object.keys(branches)[0]] + "/" + directory;
  elem.addEventListener("click", function () {
    window.location.href = uploadedUrl;
  });
  elem.style.cursor = "pointer";
}

/**
 * 업로드 실패 아이콘 표시
 */
function markUploadFailedCSS() {
  uploadState.uploading = false;
  const elem = document.getElementById("progress_elem");
  elem.className = "markuploadfailed";
}

/**
 * 총 실행시간이 10초를 초과한다면 실패로 간주합니다.
 */
function startUploadCountDown() {
  uploadState.uploading = true;
  uploadState.countdown = setTimeout(() => {
    if (uploadState.uploading === true) {
      markUploadFailedCSS();
    }
  }, 10000);
}
