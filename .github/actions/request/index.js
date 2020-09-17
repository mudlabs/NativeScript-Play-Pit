
switch (core.getInput("task")) {
  case "number":
    getPrNumber();
    break;
  case "comment":
    parseComment();
    break;
}

async function getPullRequestNumber() {
  try {
    const url = github.context.payload.issue.pull_request.url;
    const pull_request = await octokit.request({ url });
    core.setOutput("number", pull_request.data.number);
  } catch (e) {
    console.log(e);
  }
}

async function parseComment() {
  
}