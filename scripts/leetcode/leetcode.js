/* KEYS */
const STORAGE_KEYS = {
  TOKEN: "code_challenge_uploader_token",
  MODE: "mode_type",
  HOOK: "code_challenge_uploader_hook",
  STATS: "stats",
};

const PUSH_BTN_ID = "manualGitSubmit";

/* Enum for languages supported by LeetCode. */
const languages = {
  C: ".c",
  "C++": ".cpp",
  "C#": ".cs",
  Bash: ".sh",
  Dart: ".dart",
  Elixir: ".ex",
  Erlang: ".erl",
  Go: ".go",
  Java: ".java",
  JavaScript: ".js",
  Javascript: ".js",
  Kotlin: ".kt",
  MySQL: ".sql",
  "MS SQL Server": ".sql",
  Oracle: ".sql",
  PHP: ".php",
  Pandas: ".py",
  PostgreSQL: ".sql",
  Python: ".py",
  Python3: ".py",
  Racket: ".rkt",
  Ruby: ".rb",
  Rust: ".rs",
  Scala: ".scala",
  Swift: ".swift",
  TypeScript: ".ts",
};

/* Commit messages */
const readmeMsg = "Create README";

/* returns today's date in MM-DD-YYYY format */
function getTodaysDate() {
  const today = new Date();
  const month = today.getMonth() + 1; // fix months are zero-indexed
  const day = today.getDate();
  const year = today.getFullYear();

  const formattedMonth = month < 10 ? "0" + month : month;
  const formattedDay = day < 10 ? "0" + day : day;

  return `${formattedMonth}-${formattedDay}-${year}`;
}

const parseCustomCommitMessage = (text, problemContext) => {
  return text.replace(/{(\w+)}/g, (match, key) => {
    // check if the variable exists in the problemContext and replace the matching text
    return problemContext.hasOwnProperty(key) ? problemContext[key] : match;
  });
};

/* returns custom commit message or null if doesn't exist */
const getCustomCommitMessage = (problemContext) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("custom_commit_message", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (
        !result.custom_commit_message ||
        !result.custom_commit_message.trim()
      ) {
        resolve(null); // no custom message is set
      } else {
        const finalCommitMessage = parseCustomCommitMessage(
          result.custom_commit_message,
          problemContext
        );
        resolve(finalCommitMessage);
      }
    });
  });
};

/* Main function for uploading code to GitHub repo, and callback cb is called if success */
const upload = async (
  token,
  hook,
  code,
  problem,
  filename,
  sha,
  commitMsg,
  cb = undefined
) => {
  /* Define Payload */
  let data = {
    message: commitMsg,
    content: code,
    sha,
  };

  data = JSON.stringify(data);

  let options = {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    body: data,
  };

  const URL = `https://api.github.com/repos/${hook}/contents/LeetCode/${difficulty}/${problem}/${filename}`;
  let updatedSha;
  const res = await fetch(URL, options);
  var body;

  if (res.status === 200 || res.status === 201) {
    return res.json();
  } else if (res.status === 409) {
    throw new Error("409");
  }
  updatedSha = body.content.sha; // get updated SHA.
  stats = await getAndInitializeStats(problem);
  stats.shas[problem][filename] = updatedSha;

  console.log(`Successfully committed ${filename} to github`);
  if (cb != undefined) cb();
};

const getAndInitializeStats = async (problem) => {
  let { stats } = await chrome.storage.local.get(STORAGE_KEYS.STATS);
  if (stats == null || stats == {}) {
    // create stats object
    stats = {};
    stats.shas = {};
  }

  if (stats.shas[problem] == null) {
    stats.shas[problem] = {};
  }

  return stats;
};

/* Main function for updating code on GitHub Repo */
/* Read from existing file on GitHub */
/* Discussion posts prepended at top of README */
/* Future implementations may require appending to bottom of file */
const update = (
  token,
  hook,
  addition,
  directory,
  filename,
  commitMsg,
  shouldPreprendDiscussionPosts,
  cb = undefined
) => {
  let responseSHA;
  return getUpdatedData(token, hook, directory, filename)
    .then((data) => {
      responseSHA = data.sha;
      return decodeURIComponent(escape(atob(data.content)));
    })
    .then((existingContent) =>
      shouldPreprendDiscussionPosts
        ? // https://web.archive.org/web/20190623091645/https://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
          // In order to preserve mutation of the data, we have to encode it, which is usually done in base64.
          // But btoa only accepts ASCII 7 bit chars (0-127) while Javascript uses 16-bit minimum chars (0-65535).
          // EncodeURIComponent converts the Unicode Points UTF-8 bits to hex UTF-8.
          // Unescape converts percent-encoded hex values into regular ASCII (optional; it shrinks string size).
          // btoa converts ASCII to base64.
          btoa(unescape(encodeURIComponent(addition + existingContent)))
        : btoa(unescape(encodeURIComponent(existingContent)))
    )
    .then((newContent) =>
      upload(
        token,
        hook,
        newContent,
        directory,
        filename,
        responseSHA,
        commitMsg,
        cb
      )
    );
};

const uploadGit = async (
  code,
  problemName,
  fileName,
  commitMsg,
  action,
  shouldPrependDiscussionPosts = false,
  cb = undefined,
  _diff = undefined
) => {
  // Assign difficulty
  if (_diff) difficulty = _diff.trim();

  const { [STORAGE_KEYS.TOKEN]: token } = await chrome.storage.local.get(
    STORAGE_KEYS.TOKEN
  );
  if (!token) throw new Error("token is undefined");

  const { [STORAGE_KEYS.MODE]: mode_type } = await chrome.storage.local.get(
    STORAGE_KEYS.MODE
  );
  if (mode_type !== "commit") throw new Error("mode is not commit");

  // hook 가져오기
  const { [STORAGE_KEYS.HOOK]: hook } = await chrome.storage.local.get(
    STORAGE_KEYS.HOOK
  );
  if (!hook) throw new Error("hook not defined");

  const { [STORAGE_KEYS.STATS]: stats } = await chrome.storage.local.get(
    STORAGE_KEYS.STATS
  );
  try {
    switch (action) {
      case "upload":
        // SHA 가져오기 (있는 경우)
        const sha = stats?.shas?.[problemName]?.[fileName] || "";
        return await upload(
          token,
          hook,
          code,
          problemName,
          fileName,
          sha,
          commitMsg,
          cb
        );
      case "update":
        return await update(
          token,
          hook,
          code,
          problemName,
          fileName,
          commitMsg,
          shouldPrependDiscussionPosts,
          cb
        );
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (err) {
    if (err.message === "409") {
      const data = await getUpdatedData(token, hook, problemName, fileName);
      if (data) {
        return await upload(
          token,
          hook,
          code,
          problemName,
          fileName,
          data.sha,
          commitMsg,
          cb
        );
      }
    }
    throw err;
  }
};

/* Gets updated GitHub data for the specific file in repo in question */
async function getUpdatedData(token, hook, directory, filename) {
  const URL = `https://api.github.com/repos/${hook}/contents/LeetCode/${difficulty}/${directory}/${filename}`;

  let options = {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  };

  return fetch(URL, options).then((res) => {
    if (res.status === 200 || res.status === 201) {
      return res.json();
    } else {
      throw new Error("" + res.status);
    }
  });
}

/* Checks if an elem/array exists and has length */
function checkElem(elem) {
  return elem && elem.length > 0;
}

function addLeadingZeros(title) {
  const maxTitlePrefixLength = 4;
  var len = title.split("-")[0].length;
  if (len < maxTitlePrefixLength) {
    return "0".repeat(4 - len) + title;
  }
  return title;
}

function formatStats(time, timePercentile, space, spacePercentile) {
  return `Time: ${time} (${timePercentile}%), Space: ${space} (${spacePercentile}%)`;
}

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

function LeetCodeV2() {
  this.submissionData;
  this.progressSpinnerElementId = PUSH_BTN_ID;
  this.progressSpinnerElementClass = "progress";
  this.injectSpinnerStyle();
}
LeetCodeV2.prototype.init = async function () {
  const problem = document.URL.match(/leetcode.com\/problems\/([^\/]*)\//);
  const val = await chrome.storage.local.get(problem[1]);
  if (!val) {
    alert("Have you submitted this problem yet?");
    return false;
  }
  const submissionId = val[problem[1]];

  // Query for getting the solution runtime and memory stats, the code, the coding language, the question id, question title and question difficulty
  const submissionDetailsQuery = {
    query:
      "\n    query submissionDetails($submissionId: Int!) {\n  submissionDetails(submissionId: $submissionId) {\n    runtime\n    runtimeDisplay\n    runtimePercentile\n    runtimeDistribution\n    memory\n    memoryDisplay\n    memoryPercentile\n    memoryDistribution\n    code\n    timestamp\n    statusCode\n    lang {\n      name\n      verboseName\n    }\n    question {\n      questionId\n    title\n    titleSlug\n    content\n    difficulty\n    }\n    notes\n    topicTags {\n      tagId\n      slug\n      name\n    }\n    runtimeError\n  }\n}\n    ",
    variables: { submissionId: submissionId },
    operationName: "submissionDetails",
  };
  const options = {
    method: "POST",
    headers: {
      cookie: document.cookie, // required to authorize the API request
      "content-type": "application/json",
    },
    body: JSON.stringify(submissionDetailsQuery),
  };
  const data = await fetch("https://leetcode.com/graphql/", options)
    .then((res) => res.json())
    .then((res) => res.data.submissionDetails);

  this.submissionData = data;
};

LeetCodeV2.prototype.findAndUploadCode = function (
  problemName,
  fileName,
  commitMsg,
  action,
  cb = undefined
) {
  const code = this.getCode();
  if (!code) throw new Error("No solution code found");

  return uploadGit(
    btoa(unescape(encodeURIComponent(code))),
    problemName,
    fileName,
    commitMsg,
    action,
    false,
    cb
  );
};

LeetCodeV2.prototype.getCode = function () {
  if (this.submissionData != null) {
    return this.submissionData.code;
  }

  const code = document.getElementsByTagName("code");
  if (!checkElem(code)) {
    return null;
  }

  return code[0].innerText;
};
LeetCodeV2.prototype.getLanguageExtension = function () {
  if (this.submissionData != null) {
    return languages[this.submissionData.lang.verboseName];
  }

  const tag = document.querySelector('button[id^="headlessui-listbox-button"]');
  if (!tag) {
    throw new Error("No language button found");
  }

  const lang = tag.innerText;
  if (languages[lang] === undefined) {
    throw new Error("Unknown Language: " + { lang });
  }

  return languages[lang];
};

LeetCodeV2.prototype.extractQuestionNumber = function () {
  let qNum = this.submissionData.question.questionId; // Default to questionId

  const content = document.getElementById("qd-content");
  if (content) {
    const elementSelector =
      'a[href^="/problems/' + window.location.pathname.split("/")[2] + '/"]';
    const titleElement = content.querySelector(elementSelector);

    if (titleElement) {
      const numbersMatch = titleElement.textContent.match(/(\d+)\./);
      if (numbersMatch) {
        qNum = numbersMatch[1]; // Update qNum if a number is found
      }
    } else {
      console.log("Element for number not found in the specified container.");
    }
  } else {
    console.log("Content div not found.");
  }
  return qNum;
};

/**
 * Gets a formatted problem name slug from the LeetCodeV2 instance.
 * @returns {string} A string combining the problem number and the slug title.
 */
LeetCodeV2.prototype.getProblemNameSlug = function () {
  const slugTitle = this.submissionData.question.titleSlug;
  const qNum = this.extractQuestionNumber();
  return addLeadingZeros(qNum + "-" + slugTitle);
};

LeetCodeV2.prototype.getSuccessStateAndUpdate = function () {
  const successTag = document.querySelectorAll(
    '[data-e2e-locator="submission-result"]'
  );
  if (checkElem(successTag)) {
    console.log(successTag[0]);
    successTag[0].classList.add("marked_as_success");
    return true;
  }
  return false;
};

LeetCodeV2.prototype.parseStats = function () {
  if (this.submissionData != null) {
    const runtimePercentile =
      Math.round(
        (this.submissionData.runtimePercentile + Number.EPSILON) * 100
      ) / 100;
    const spacePercentile =
      Math.round(
        (this.submissionData.memoryPercentile + Number.EPSILON) * 100
      ) / 100;
    return {
      time: this.submissionData.runtimeDisplay,
      timePercentile: runtimePercentile,
      space: this.submissionData.memoryDisplay,
      spacePercentile: spacePercentile,
      difficulty: this.submissionData.difficulty,
    };
  }

  // Doesn't work unless we wait for page to finish loading.
  setTimeout(() => {}, 1000);
  const probStats = document
    .getElementsByClassName("flex w-full pb-4")[0]
    .innerText.split("\n");
  if (!checkElem(probStats)) {
    return null;
  }

  const time = probStats[1];
  const timePercentile = probStats[3];
  const space = probStats[5];
  const spacePercentile = probStats[7];

  return formatStats(time, timePercentile, space, spacePercentile);
};

LeetCodeV2.prototype.parseQuestion = function () {
  let markdown;
  if (this.submissionData != null) {
    const questionUrl = window.location.href.split("/submissions")[0];
    const qTitle = `${this.extractQuestionNumber()}. ${
      this.submissionData.question.title
    }`;
    const qBody = this.parseQuestionDescription();

    difficulty = this.submissionData.question.difficulty;

    // Final formatting of the contents of the README for each problem
    markdown = `<h2><a href="${questionUrl}">${qTitle}</a></h2><h3>${difficulty}</h3><hr>${qBody}`;
  } else {
    // TODO: get the README markdown via scraping. Right now this isn't possible.
    markdown = null;
  }

  return markdown;
};

LeetCodeV2.prototype.parseQuestionDescription = function () {
  if (this.submissionData != null) {
    return this.submissionData.question.content;
  }

  const description = document.getElementsByName("description");
  if (!checkElem(description)) {
    return null;
  }
  return description[0].content;
};

LeetCodeV2.prototype.startSpinner = function () {
  let elem = document.getElementById(this.progressSpinnerElementId);
  if (!elem) {
    elem = document.createElement("span");
    elem.id = this.progressSpinnerElementId;
    elem.style = "margin-right: 20px;padding-top: 2px;";
  }
  elem.innerHTML = `<div id="${this.progressSpinnerElementId}" class="${this.progressSpinnerElementClass}"></div>`;
};

LeetCodeV2.prototype.injectSpinnerStyle = function () {
  const style = document.createElement("style");
  style.textContent = `.${this.progressSpinnerElementClass} {pointer-events: none;width: 2.0em;height: 2.0em;border: 0.4em solid transparent;border-color: #eee;border-top-color: #3E67EC;border-radius: 50%;animation: loadingspin 1s linear infinite;} @keyframes loadingspin { 100% { transform: rotate(360deg) }}`;
  document.head.append(style);
};

LeetCodeV2.prototype.markUploaded = function () {
  const elem = document.getElementById(this.progressSpinnerElementId);
  if (elem) {
    elem.className = "";
    style =
      "display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid #78b13f;border-right:7px solid #78b13f;";
    elem.style = style;
    elem.innerHTML = "";
  }
};
LeetCodeV2.prototype.markUploadFailed = function () {
  const elem = document.getElementById(this.progressSpinnerElementId);
  if (elem) {
    elem.className = "";
    style =
      "display: inline-block;transform: rotate(45deg);height:24px;width:12px;border-bottom:7px solid red;border-right:7px solid red;";
    elem.style = style;
    elem.innerHTML = "";
  }
};

LeetCodeV2.prototype.addManualSubmitButton = function () {
  let elem = document.getElementById(PUSH_BTN_ID);
  const domain = document.URL.match(/:\/\/(www\.)?(.[^/:]+)/)[2].split(".")[0];
  if (elem || domain != "leetcode") return;

  var submitButton = document.createElement("button");
  submitButton.id = PUSH_BTN_ID;
  submitButton.className =
    "relative inline-flex gap-2 items-center justify-center font-medium cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors bg-transparent enabled:hover:bg-fill-secondary enabled:active:bg-fill-primary text-caption rounded text-text-primary group ml-auto p-1";
  submitButton.textContent = "Push ";
  submitButton.appendChild(getGitIcon());
  submitButton.addEventListener("click", () => loader(this));

  let notesIcon = document.querySelectorAll(".ml-auto svg.fa-bookmark");
  if (checkElem(notesIcon)) {
    const target = notesIcon[0].closest("button.ml-auto").parentElement;
    target.prepend(submitButton);
  }
};

LeetCodeV2.prototype.addUrlChangeListener = function () {
  window.navigation.addEventListener("navigate", (event) => {
    const problem = window.location.href.match(
      /leetcode.com\/problems\/(.*)\/submissions/
    );
    const submissionId = window.location.href.match(/\/(\d+)(\/|\?|$)/);
    if (
      problem &&
      problem.length > 1 &&
      submissionId &&
      submissionId.length > 1
    ) {
      chrome.storage.local.set({ [problem[1]]: submissionId[1] });
    }
  });
};

/* Sync to local storage */
chrome.storage.local.get("isSync", (data) => {
  keys = [
    "leethub_token",
    "leethub_username",
    "pipe_leethub",
    "stats",
    "leethub_hook",
    "mode_type",
    "custom_commit_message",
  ];
  if (!data || !data.isSync) {
    keys.forEach((key) => {
      chrome.storage.sync.get(key, (data) => {
        chrome.storage.local.set({ [key]: data[key] });
      });
    });
    chrome.storage.local.set({ isSync: true }, (data) => {
      console.log("LeetHub Synced to local values");
    });
  } else {
    console.log("LeetHub Local storage already synced!");
  }
});

const loader = (leetCode, suffix) => {
  let iterations = 0;
  // start upload indicator here
  leetCode.startSpinner();
  const intervalId = setInterval(async () => {
    try {
      const isSuccessfulSubmission = leetCode.getSuccessStateAndUpdate();
      if (!isSuccessfulSubmission) {
        iterations++;
        if (iterations > 9) {
          clearInterval(intervalId); // poll for max 10 attempts (10 seconds)
          leetCode.markUploadFailed();
        }
        return;
      }

      // If successful, stop polling
      clearInterval(intervalId);

      // For v2, query LeetCode API for submission results
      await leetCode.init();

      const probStats = leetCode.parseStats();
      if (!probStats) {
        throw new Error("Could not get submission stats");
      }

      const probStatement = leetCode.parseQuestion();
      if (!probStatement) {
        throw new Error("Could not find problem statement");
      }

      const problemName = leetCode.getProblemNameSlug();
      const language = leetCode.getLanguageExtension();
      if (!language) {
        throw new Error("Could not find language");
      }

      /* Upload README */
      const updateReadMe = await chrome.storage.local
        .get("stats")
        .then(({ stats }) => {
          const shaExists =
            stats?.shas?.[problemName]?.["README.md"] !== undefined;

          if (!shaExists) {
            return uploadGit(
              btoa(unescape(encodeURIComponent(probStatement))),
              problemName,
              "README.md",
              readmeMsg,
              "upload",
              false
            );
          }
        });

      const problemContext = {
        time: `${probStats.time} (${probStats.timePercentile}%)`,
        space: `${probStats.space} (${probStats.spacePercentile}%)`,
        language: language,
        problemName: problemName,
        difficulty: difficulty,
        date: getTodaysDate(),
      };

      const commitMsg =
        (await getCustomCommitMessage(problemContext)) ||
        formatStats(
          probStats.time,
          probStats.timePercentile,
          probStats.space,
          probStats.spacePercentile
        );

      /* Upload code to Git */
      const updateCode = leetCode.findAndUploadCode(
        problemName,
        suffix ? problemName + suffix + language : problemName + language,
        commitMsg,
        "upload"
      );

      await Promise.all([updateReadMe, updateCode]);

      leetCode.markUploaded();
    } catch (err) {
      leetCode.markUploadFailed();
      clearInterval(intervalId);
      console.error(err);
    }
  }, 1000);
};

// Use MutationObserver to determine when the submit button elements are loaded
const observer = new MutationObserver(function (_mutations, observer) {
  const submitBtn = document.querySelector(
    '[data-e2e-locator="console-submit-button"]'
  );
  const textareaList = document.getElementsByTagName("textarea");
  const textarea =
    textareaList.length === 4
      ? textareaList[2]
      : textareaList.length === 2
      ? textareaList[0]
      : textareaList[1];

  if (submitBtn && textarea) {
    observer.disconnect();
    const leetCode = new LeetCodeV2();
    submitBtn.addEventListener("click", () => loader(leetCode));
    leetCode.addManualSubmitButton();
    leetCode.addUrlChangeListener();
  }
});

setTimeout(() => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}, 2000);
