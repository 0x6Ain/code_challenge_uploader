// Set to true to enable console log
const debug = true;

async function checkSubmissionStatus() {
  return new Promise((resolve) => {
    let iterations = 0;
    const maxIterations = 10; // 10초

    const intervalId = setInterval(() => {
      const successTag = document.querySelector('[data-e2e-locator="submission-result"]');
      if (successTag) {
        successTag.classList.add("marked_as_success");
        clearInterval(intervalId);
        resolve(true);
      }

      const failTag = document.querySelector('[data-e2e-locator="console-result"]');

      iterations++;
      if (failTag || iterations >= maxIterations) {
        clearInterval(intervalId);
        resolve(false);
      }
    }, 1000); // 1초마다 체크
  });
}

function addUrlChangeListener() {
  window.navigation.addEventListener("navigate", async (event) => {
    const problem = window.location.href.match(/leetcode.com\/problems\/(.*)\/submissions/);
    const submissionId = window.location.href.match(/\/(\d+)(\/|\?|$)/);
    if (problem && problem.length > 1 && submissionId && submissionId.length > 1) {
      await saveObjectInLocalStorage({ [problem[1]]: submissionId[1] });
    }
  });
}

async function loader() {
  const enable = await checkEnable();
  if (!enable) return;
  // start upload indicator here
  const isAccepted = await checkSubmissionStatus();
  if (!isAccepted) return markUploadFailed();
  try {
    const bojData = await parseData();
    await beginUpload(bojData);
  } catch (err) {
    log(err);
  }
}

/* 파싱 직후 실행되는 함수 */
async function beginUpload(bojData) {
  log("bojData", bojData);
  if (isNotEmpty(bojData)) {
    startSpinner();
    const stats = await getStats();
    const hook = await getHook();

    const currentVersion = stats.version;
    /* 버전 차이가 발생하거나, 해당 hook에 대한 데이터가 없는 경우 localstorage의 Stats 값을 업데이트하고, version을 최신으로 변경한다 */
    if (isNull(currentVersion) || currentVersion !== getVersion() || isNull(await getStatsSHAfromPath(hook))) {
      await versionUpdate();
    }

    /* 현재 제출하려는 소스코드가 기존 업로드한 내용과 같다면 중지 */
    cachedSHA = await getStatsSHAfromPath(`${hook}/${bojData.directory}/${bojData.fileName}`);
    calcSHA = calculateBlobSHA(bojData.code);
    log("cachedSHA", cachedSHA, "calcSHA", calcSHA);
    if (cachedSHA == calcSHA) {
      markUploaded();
      log(`현재 제출번호를 업로드한 기록이 있습니다. problemIdID ${bojData.problemId}`);
      return;
    }
    /* 신규 제출 번호라면 새롭게 커밋  */
    await uploadOneSolveProblemOnGit(bojData, markUploaded);
  }
}

async function versionUpdate() {
  log("start versionUpdate");
  const stats = await updateLocalStorageStats();
  // update version.
  stats.version = getVersion();
  await saveStats(stats);
  log("stats updated.", stats);
}

// Use MutationObserver to determine when the submit button elements are loaded
const observer = new MutationObserver(function (_mutations, observer) {
  const submitBtn = document.querySelector('[data-e2e-locator="console-submit-button"]');
  const textareaList = document.getElementsByTagName("textarea");
  const textarea = textareaList.length === 4 ? textareaList[2] : textareaList.length === 2 ? textareaList[0] : textareaList[1];

  if (submitBtn && textarea) {
    observer.disconnect();
    injectSpinnerStyle();
    submitBtn.addEventListener("click", loader);
    addManualSubmitButton();
    addUrlChangeListener();
  }
});

setTimeout(() => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}, 2000);
