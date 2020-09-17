const github = require("@actions/github");
const core = require("@actions/core");
const utils = require("../utils");

(async function() {
  try {
    let project, issue_number;
    const event_title = core.getInput("title");
    const type = event_title.replace(/^\[(project|update|add)\].+/i, "$1");
    const owner = github.context.payload.repository.owner;
    const octokit = github.getOctokit(process.env.token);
    const body = utils.stripComments(github.context.payload.issue.body);
    const author = `${owner.login} <${owner.login}@users.noreply.github.com>`;
    const job = type === "pr" ? "request" : "submission";
    
    const parseTitle = txt => txt.substring(txt.lastIndexOf("]") + 1).trim();
    const getSection = text => a => b => utils.getSection(text)(a, b);

    switch (type) {
      case "pr":
        project = parseTitle(event_title);
        issue_number = event_title.replace(
          /^\[pr\][\[a-z\]]+\[(\d+)\] {1}.+$/i, "$1"
        );
        break;
    
      case "project":
        const sec = getSection(body)("## Project Title")("## Platform Support");
        issue_number = github.context.payload.issue.number;
        project = sec.match(/^[a-z0-9 ]+$/i) 
          ? utils.capitalise(sec) 
          : null;
        break;

      case "update":
      case "add":
        const section = getSection(body)("## Project Id")("## Playground");
        const number = section.replace(/\D/gm, "");
        issue_number = parseInt(number) ? number : null;
        const issue = await octokit.request({ url: `https://api.github.com/repos/mudlabs/hello-word-javascript-action/issues/${issue_number}`});
        project = parseTitle(issue.data.title);
        console.log(project, type);
        break;
    }

    core.setOutput("action", github.context.payload.action);
    core.setOutput("issue", issue_number)
    core.setOutput("project", project);
    core.setOutput("author", author);
    core.setOutput("type", type);
    core.setOutput("job", job);

  } catch (error) {
    console.log(error);
  }
})();

