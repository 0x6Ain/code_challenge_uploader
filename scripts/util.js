/**
 *현재 익스텐션의 버전정보를 반환합니다.
 * @returns {string} - 현재 익스텐션의 버전정보
 */
function getVersion() {
  return chrome.runtime.getManifest().version;
}

/** element가 존재하는지 반환합니다.
 * @param {DOMElement} element - 존재하는지 확인할 element
 * @returns {boolean} - 존재하면 true, 존재하지 않으면 false
 */
function elementExists(element) {
  return element !== undefined && element !== null && element.length > 0; // TODO: find unexpected error by deleting element.hasOwnProperty("length")
}

/**
 * 해당 값이 null 또는 undefined인지 체크합니다.
 * @param {any} value - 체크할 값
 * @returns {boolean} - null이면 true, null이 아니면 false
 */
function isNull(value) {
  return value === null || value === undefined;
}

/**
 * 해당 값이 비어있거나 빈 문자열인지 체크합니다.
 * @param {any} value - 체크할 값
 * @returns {boolean} - 비어있으면 true, 비어있지 않으면 false
 */
function isEmpty(value) {
  return isNull(value) || (value.hasOwnProperty("length") && value.length === 0);
}

/** 객체 또는 배열의 모든 요소를 재귀적으로 순회하여 값이 비어있지 않은지 체크합니다.
 * 자기 자신의 null값이거나 빈 문자열, 빈 배열, 빈 객체인 경우이거나, 요소 중 하나라도 값이 비어있으면 false를 반환합니다.
 * @param {any} obj - 체크할 객체 또는 배열
 * @returns {boolean} - 비어있지 않으면 true, 비어있으면 false
 */
function isNotEmpty(obj) {
  if (isEmpty(obj)) return false;
  if (typeof obj !== "object") return true;
  if (obj.length === 0) return false;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!isNotEmpty(obj[key])) return false;
    }
  }
  return true;
}
/**
 * 문자열을 escape 하여 반환합니다.
 * @param {string} text - escape 할 문자열
 * @returns {string} - escape된 문자열
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

/** 문자열을 escape 하여 반환합니다. */
String.prototype.escapeHtml = function () {
  return escapeHtml(this);
};

/**
 * escape된 문자열을 unescape하여 반환합니다.
 * @param {string} text - unescape할 문자열
 * @returns {string} - unescape된 문자열
 */
function unescapeHtml(text) {
  const unescaped = {
    "&amp;": "&",
    "&#38;": "&",
    "&lt;": "<",
    "&#60;": "<",
    "&gt;": ">",
    "&#62;": ">",
    "&apos;": "'",
    "&#39;": "'",
    "&quot;": '"',
    "&#34;": '"',
    "&nbsp;": " ",
    "&#160;": " ",
  };
  return text.replace(/&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160);/g, function (m) {
    return unescaped[m];
  });
}

/** 문자열을 unescape 하여 반환합니다. */
String.prototype.unescapeHtml = function () {
  return unescapeHtml(this);
};

/** 일반 특수문자를 전각문자로 변환하는 함수
 * @param {string} text - 변환할 문자열
 * @returns {string} - 전각문자로 변환된 문자열
 */
function convertSingleCharToDoubleChar(text) {
  // singleChar to doubleChar mapping
  const map = {
    "!": "！",
    "%": "％",
    "&": "＆",
    "(": "（",
    ")": "）",
    "*": "＊",
    "+": "＋",
    ",": "，",
    "-": "－",
    ".": "．",
    "/": "／",
    ":": "：",
    ";": "；",
    "<": "＜",
    "=": "＝",
    ">": "＞",
    "?": "？",
    "@": "＠",
    "[": "［",
    "\\": "＼",
    "]": "］",
    "^": "＾",
    _: "＿",
    "`": "｀",
    "{": "｛",
    "|": "｜",
    "}": "｝",
    "~": "～",
    " ": " ", // 공백만 전각문자가 아닌 FOUR-PER-EM SPACE로 변환
  };
  return text.replace(/[!%&()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]/g, function (m) {
    return map[m];
  });
}

/**
 * base64로 문자열을 base64로 인코딩하여 반환합니다.
 * @param {string} str - base64로 인코딩할 문자열
 * @returns {string} - base64로 인코딩된 문자열
 */
function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(`0x${p1}`);
    })
  );
}

/**
 * base64로 인코딩된 문자열을 base64로 디코딩하여 반환합니다.
 * @param {string} b64str - base64로 인코딩된 문자열
 * @returns {string} - base64로 디코딩된 문자열
 */
function b64DecodeUnicode(b64str) {
  return decodeURIComponent(
    atob(b64str)
      .split("")
      .map(function (c) {
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
      })
      .join("")
  );
}

/** 배열 내의 key에 val 값을 포함하고 있는 요소만을 반환합니다.
 * @param {array} arr - array to be filtered
 * @param {object} conditions - object of key, values to be used in filter
 * @returns {array} - filtered array
 */
function filter(arr, conditions) {
  return arr.filter((item) => {
    for (const [key, value] of Object.entries(conditions)) if (!item[key].includes(value)) return false;
    return true;
  });
}

/** calculate github blob file SHA
 * @param {string} content - file content
 * @returns {string} - SHA hash
 */
function calculateBlobSHA(content) {
  return sha1(`blob ${new Blob([content]).size}\0${content}`);
}

/**
 * combine two array<Object> same index.
 * @param {array<Object>} a
 * @param {array<Object>} b
 * @return {array<Object>}
 */
function combine(a, b) {
  return a.map((x, i) => ({ ...x, ...b[i] }));
}

if (typeof __DEV__ !== "undefined") {
  var exports = (module.exports = {});
  exports.filter = filter;
}

function log(...args) {
  if (debug) console.log(...args);
}

function getDateString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
