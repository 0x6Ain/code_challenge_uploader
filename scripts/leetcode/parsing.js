const difficultyLevel = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};
/*
  문제가 맞았다면 문제 관련 데이터를 파싱하는 함수의 모음입니다.
  모든 해당 파일의 모든 함수는 parseData()를 통해 호출됩니다.
*/

/*
  bojData를 초기화하는 함수로 문제 요약과 코드를 파싱합니다.
  - directory : 레포에 기록될 폴더명
  - message : 커밋 메시지
  - fileName : 파일명
  - readme : README.md에 작성할 내용
  - code : 소스코드 내용
*/
async function parseData() {
  let link;
  let problemId;
  let level;
  let division;
  let title;
  let problem_description;
  let language_extension;
  let code;
  let result_message;
  let runtime;
  let memory;
  let language;
  const submission = await getSubmissionData();
  if (submission) {
    link = `https://leetcode.com/problems/${submission.question.titleSlug}`;
    problemId = submission.question.questionId;
    level = difficultyLevel[submission.question.difficulty];
    division = "";
    title = submission.question.title;
    problem_description = submission.question.content;
    language_extension = submission.lang.verboseName;
    language = submission.lang.verboseName;
    code = submission.code;
    result_message = "";
    runtime = submission.runtimeDisplay;
    memory = submission.memoryDisplay;
    return makeData({ link, problemId, level, title, problem_description, division, language_extension, code, result_message, runtime, memory, language });
  }
  //TODO: Parsing with html
  throw new Error("No submission");
}

async function makeData(origin) {
  const { link, problem_description, problemId, level, result_message, division, language_extension, title, runtime, memory, code, language } = origin;
  const directory = await getDirNameByOrgOption(`LeetCode/${level}/${problemId}. ${convertSingleCharToDoubleChar(title)}`, language);
  const levelWithLv = `${level}`.includes("lv") ? level : `lv${level}`.replace("lv", "level ");
  const message = `[${levelWithLv}] Title: ${title}, Time: ${runtime}, Memory: ${memory}`;
  const fileName = `${convertSingleCharToDoubleChar(title)}.${language_extension}`;
  const dateInfo = getDateString(new Date(Date.now()));
  // prettier-ignore
  const readme =
    `# [${levelWithLv}] ${title} - ${problemId} \n\n`
    + `[문제 링크](${link}) \n\n`
    + `### 성능 요약\n\n`
    + `메모리: ${memory}, `
    + `시간: ${runtime}\n\n`
    + `### 구분\n\n`
    + `${division.replace('/', ' > ')}\n\n`
    + `### 채점결과\n\n`
    + `${result_message}\n\n`
    + `### 제출 일자\n\n`
    + `${dateInfo}\n\n`
    + `### 문제 설명\n\n`
    + `${problem_description}\n\n`
    + `> 출처: leetcode, https://leetcode.com/problemset/`;
  return { problemId, directory, message, fileName, readme, code };
}

async function getSubmissionData() {
  const problemMatch = document.URL.match(/leetcode.com\/problems\/([^\/]*)\//);
  const submissionId = await getObjectFromLocalStorage(problemMatch[1]);
  if (!submissionId) {
    alert("Have you submitted this problem yet?");
    return false;
  }

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
  return await fetch("https://leetcode.com/graphql/", options)
    .then((res) => res.json())
    .then((res) => res.data.submissionDetails);
}
