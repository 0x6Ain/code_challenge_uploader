const STORAGE_KEYS = {
  MODE: "mode_type",
  TOKEN: "code_challenge_uploader_token",
  HOOK: "code_challenge_uploader_hook",
  USERNAME: "code_challenge_uploader_username",
};

const ERROR_MESSAGES = {
  // Authorize
  NO_TOKEN:
    "Authorization error - Grant code_challenge_uploader access to your GitHub account to continue (click code_challenge_uploader extension on the top right to proceed)",
  NO_HOOK:
    "Improper Authorization error - Grant code_challenge_uploader access to your GitHub account to continue (click code_challenge_uploader extension on the top right to proceed)",

  // Create
  CREATE_304: (name) =>
    `Error creating ${name} - Unable to modify repository. Try again later!`,
  CREATE_400: (name) =>
    `Error creating ${name} - Bad POST request, make sure you're not overriding any existing scripts`,
  CREATE_401: (name) =>
    `Error creating ${name} - Unauthorized access to repo. Try again later!`,
  CREATE_403: (name) =>
    `Error creating ${name} - Forbidden access to repository. Try again later!`,
  CREATE_422: (name) =>
    `Error creating ${name} - Unprocessable Entity. Repository may have already been created. Try Linking instead (select 2nd option).`,

  // Hook
  LINK_301: (name) =>
    `Error linking <a target="_blank" href="https://github.com/${name}">${name}</a> to code_challenge_uploader. <br> This repository has been moved permanently. Try creating a new one.`,
  LINK_403: (name) =>
    `Error linking <a target="blank" href="https://github.com/${name}">${name}</a> to code_challenge_uploader. <br> Forbidden action. Please make sure you have the right access to this repository.`,
  LINK_404: (name) =>
    `Error linking <a target="blank" href="https://github.com/${name}">${name}</a> to code_challenge_uploader. <br> Resource not found. Make sure you enter the right repository name.`,
};

const UI = {
  showError: (htmlMessage) => {
    $("#success").hide();
    $("#error").html(htmlMessage).show();
    $("#unlink").show();
  },

  showSuccess: (url, name) => {
    $("#error").hide();
    $("#success")
      .html(
        `Successfully created <a target="blank" href="${url}">${name}</a>. Start now!`
      )
      .show();
    $("#unlink").show();
  },

  showCommitMode: () => {
    document.getElementById("hook_mode").style.display = "none";
    document.getElementById("commit_mode").style.display = "inherit";
  },

  showHookMode: () => {
    document.getElementById("hook_mode").style.display = "inherit";
    document.getElementById("commit_mode").style.display = "none";
  },
};

const option = () => {
  return $("#type").val();
};

const repositoryName = () => {
  if (option() == "new") return $("#name").val().trim();
  else return $("#existing_repo").val().trim();
};

/* Status codes for creating of repo */
const statusCode = (res, status, name) => {
  switch (status) {
    case 304:
    case 400:
    case 401:
    case 403:
    case 422:
      UI.showError(ERROR_MESSAGES[`CREATE_${status}`](name));
      break;
    default:
      /* Change mode type to commit */
      chrome.storage.local.set({ mode_type: "commit" }, () => {
        UI.showSuccess(res.html_url, name);
        UI.showCommitMode();
      });
      /* Set Repo Hook */
      chrome.storage.local.set(
        { code_challenge_uploader_hook: res.full_name },
        () => console.log("Successfully set new repo hook")
      );
      break;
  }
};

const createRepo = (token, name) => {
  const AUTHENTICATION_URL = "https://api.github.com/user/repos";
  let data = {
    name,
    private: true,
    auto_init: true,
    description:
      "This is an auto push repository for code challenge created with code challenge uploader[https://github.com/0x6Ain/code_challenge_uploader]",
  };
  data = JSON.stringify(data);

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      statusCode(JSON.parse(xhr.responseText), xhr.status, name);
    }
  });

  xhr.open("POST", AUTHENTICATION_URL, true);
  xhr.setRequestHeader("Authorization", `token ${token}`);
  xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
  xhr.send(data);
};

/* Status codes for linking of repo */
const linkStatusCode = (status, name) => {
  let bool = false;
  switch (status) {
    case 301:
    case 403:
    case 404:
      UI.showError(ERROR_MESSAGES[`LINK_${status}`](name));
      break;
    default:
      bool = true;
      break;
  }
  $("#unlink").show();
  return bool;
};

/* Handle inputBox by type selection */
$("#type").change(function () {
  const selectedType = $(this).val();
  if (selectedType === "link") {
    $("#name").hide();
    $("#existing_repo").show();
    loadRepositories();
  } else {
    $("#name").show();
    $("#existing_repo").hide();
  }
});

/* Load repositories from GitHub */
function loadRepositories() {
  chrome.storage.local.get("code_challenge_uploader_token", (data) => {
    const token = data.code_challenge_uploader_token;

    let repos = [];
    let page = 1;
    let hasNextPage = true;

    function fetchRepos() {
      $.ajax({
        url: "https://api.github.com/user/repos",
        type: "GET",
        data: {
          per_page: 100, // Max per_page to reduce the number of requests
          page: page, // Page number for pagination
          affiliation: "owner",
        },
        headers: {
          Authorization: `token ${token}`,
        },
        success: function (response, status, xhr) {
          repos = repos.concat(response);

          // Check for the next page by looking at the 'Link' header
          const linkHeader = xhr.getResponseHeader("Link");
          hasNextPage = linkHeader && linkHeader.includes('rel="next"');

          // If there's a next page, fetch the next page
          if (hasNextPage) {
            page++;
            fetchRepos(); // Recursively fetch the next page
          } else {
            // All repos have been fetched, populate the dropdown
            $("#existing_repo")
              .empty()
              .append('<option value="">Select a Repository</option>');
            repos.forEach((repo) => {
              $("#existing_repo").append(
                `<option value="${repo.name}">${repo.name}</option>`
              );
            });
          }
        },
        error: function (xhr, status, error) {
          console.error("Failed to load repositories:", error);
          $("#error")
            .text("Failed to load repositories. Please try again.")
            .show();
        },
      });
    }

    fetchRepos();
  });
}

/*
    Method for linking hook with an existing repository
    Steps:
    1. Check if existing repository exists and the user has write access to it.
    2. Link Hook to it (chrome Storage).
*/
const linkRepo = (token, name) => {
  const AUTHENTICATION_URL = `https://api.github.com/repos/${name}`;

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      const res = JSON.parse(xhr.responseText);
      const bool = linkStatusCode(xhr.status, name);
      console.log("🚀 ~ file: welcome.js:153 ~ bool:", bool);
      if (xhr.status === 200) {
        // BUG FIX
        if (!bool) {
          // unable to gain access to repo in commit mode. Must switch to hook mode.
          /* Set mode type to hook */
          chrome.storage.local.set({ mode_type: "hook" }, () => {
            console.log(`Error linking ${name} to code_challenge_uploader`);
          });
          /* Set Repo Hook to NONE */
          chrome.storage.local.set(
            { code_challenge_uploader_hook: null },
            () => {
              console.log("Defaulted repo hook to NONE");
            }
          );

          UI.showHookMode();
        } else {
          /* Change mode type to commit */
          /* Save repo url to chrome storage */
          chrome.storage.local.set(
            { mode_type: "commit", repo: res.html_url },
            () => UI.showSuccess(res.html_url, name)
          );
          /* Set Repo Hook */
          chrome.storage.local
            .set({ code_challenge_uploader_hook: res.full_name })
            .then(() => {
              console.log("Successfully set new repo hook");
              return chrome.storage.local.get("stats");
            })
            .then((psolved) => {
              /* Get problems solved count */
              const { stats } = psolved;
              if (stats && stats.solved) {
                $("#p_solved").text(stats.solved);
                $("#p_solved_easy").text(stats.easy);
                $("#p_solved_medium").text(stats.medium);
                $("#p_solved_hard").text(stats.hard);
              }
            });

          UI.showCommitMode();
        }
      }
    }
  });

  xhr.open("GET", AUTHENTICATION_URL, true);
  xhr.setRequestHeader("Authorization", `token ${token}`);
  xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
  xhr.send();
};

const unlinkRepo = () => {
  /* Set mode type to hook */
  chrome.storage.local.set({ mode_type: "hook" }, () => {
    console.log(`Unlinking repo`);
  });
  /* Set Repo Hook to NONE */
  chrome.storage.local.set({ code_challenge_uploader_hook: null }, () => {
    console.log("Setting repo hook to NONE");
  });

  UI.showHookMode();
};

/* Check for value of select tag, Get Started disabled by default */

$("#type").on("change", function () {
  const valueSelected = this.value;
  if (valueSelected) {
    $("#hook_button").attr("disabled", false);
  } else {
    $("#hook_button").attr("disabled", true);
  }
});

$("#hook_button").on("click", () => {
  /* on click should generate: 1) option 2) repository name */
  if (!option()) {
    $("#error").text(
      "No option selected - Pick an option from dropdown menu below that best suits you!"
    );
    $("#error").show();
  } else if (!repositoryName()) {
    $("#error").text(
      "No repository name added - Enter the name of your repository!"
    );
    $("#name").focus();
    $("#error").show();
  } else {
    $("#error").hide();
    $("#success").text("Attempting to create Hook... Please wait.");
    $("#success").show();

    /*
      Perform processing
      - step 1: Check if current stage === hook.
      - step 2: store repo name as repoName in chrome storage.
      - step 3: if (1), POST request to repoName (iff option = create new repo) ; else display error message.
      - step 4: if proceed from 3, hide hook_mode and display commit_mode (show stats e.g: files pushed/questions-solved/leaderboard)
    */
    chrome.storage.local.get(
      [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USERNAME],
      ({
        code_challenge_uploader_token: token,
        code_challenge_uploader_username: username,
      }) => {
        if (!token) {
          UI.showError(ERROR_MESSAGES.NO_TOKEN);
          return;
        }

        if (option() === "new") {
          createRepo(token, repositoryName());
          return;
        }

        if (!username) {
          UI.showError(ERROR_MESSAGES.NO_HOOK);
          return;
        }

        linkRepo(token, `${username}/${repositoryName()}`, false);
      }
    );
  }
});

$("#unlink a").on("click", () => {
  unlinkRepo();
  $("#unlink").hide();
  $("#success").text(
    "Successfully unlinked your current git repo. Please create/link a new hook."
  );
});

/* Detect mode type */
chrome.storage.local.get(
  [STORAGE_KEYS.MODE, STORAGE_KEYS.TOKEN, STORAGE_KEYS.HOOK],
  ({
    mode_type: mode,
    code_challenge_uploader_token: token,
    code_challenge_uploader_hook: hook,
  }) => {
    if (mode !== "commit") {
      UI.showHookMode();
      return;
    }

    UI.showCommitMode();

    if (!token) {
      UI.showError(ERROR_MESSAGES.NO_TOKEN);
      UI.showHookMode();
      return;
    }

    if (!hook) {
      UI.showError(ERROR_MESSAGES.NO_HOOK);
      UI.showHookMode();
      return;
    }

    linkRepo(token, hook);
  }
);
