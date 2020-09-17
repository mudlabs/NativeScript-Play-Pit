const fs = require("fs");
const yaml = require("js-yaml");
const utils = require("../utils");
const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(process.env.token);
const owner = github.context.payload.repository.owner;
const repo = github.context.payload.repository;
const sender =github.context.payload.sender;
const issue = github.context.payload.issue;

const parseProjectNumber = text => {
  const id_title = "## Project Id";
  const playground_title = "## Playground";
  const start = text.indexOf(id_title) + id_title.length;
  const section = utils.stribEmptyLines(
    text.substring(start, text.indexOf(playground_title))
  );
  const number = section.replace(/\D/gm, "");
  
  return parseInt(number) ? number : null;
}

const parsePlayground = text => {
  const base_url = "play.nativescript.org/?template=play-";
  const title = "## Playground";
  const start = text.indexOf(title) + title.length;
  const section = text.substring(start);
  const url_start = section.indexOf(base_url);
  const id_start = section.indexOf("&id=");

  const url = utils.getPlaygroundLink(section);
  const flavour = section.substring(url_start + base_url.length, id_start);
  return utils.validatePlaygroundLink(url) ? { url, flavour } : null;
}

switch (github.context.payload.action) {
  case "opened": // workflow triggured by a new issue
    handleNewSubmission()
    break;
  case "created": // workflow triggured by a comment
    handleComment();
    break;
}


async function handleNewSubmission(){
  try {
    const body = utils.stripComments(issue.body);
    const date = utils.dateString(issue.created_at);
    const project_number = parseProjectNumber(body);
    const playground = parsePlayground(body);   
    const accronim = playground.flavour; 

    const path = `projects/${process.env.project}/data.yaml`;
    const file = await fs.promises.readFile(path);
    const data = yaml.safeLoad(file);

    if (process.env.type === "add" && data.playgrounds[accronim].url !== null) {
      await octokit.issues.createComment({
        owner: owner.login,
        repo: repo.name,
        issue_number: issue.number,
        body: `@${sender.login} The project [${project}]() already has ${data.playgrounds[accronim].flavour} playground.\r\n\nIf you're looking to submit an update of that playground please submit your contribution using the **Update Playground** issue template.\r\n- Clicking the blue add/update next to the playground link will ensure you always use the right issue template.\r\n\nThank you.`
      });
      await octokit.issues.update({
        owner: owner.login,
        repo: repo.name,
        issue_number: issue.number,
        title: '[add][wrong-template] ${project}',
        state: "closed"
      })
      return;
    }
    
    data.playgrounds[accronim].url = playground.url;
    process.env.type === "update" && data.playgrounds[accronim] !== null
      ? data.playgrounds[accronim].contributor = {
          id: sender.id,
          login: sender.login,
          date: date
        }
      : data.playgrounds[accronim].author = {
          id: sender.id,
          login: sender.login,
          date: date
        }

    await fs.promises.writeFile(path, yaml.safeDump(data));
    const flavour = data.playgrounds[accronim].flavour;
    const branch = utils.branchify(`${type}_${flavour}_${project}`);
    const title = `[pr][${type}][${accronim}][${issue.number}] ${project}`;

    core.setOutput("status", "readme");
    core.setOutput("message", mesage);
    core.setOutput("branch", branch);
    core.setOutput("title", title);

    await octokit.issues.update({
      owner: owner.login,
      repo: repo.name,
      issue_number: issue.number,
      title: `[${process.env.type}][${accronim}] ${project}`,
      labels: [ `${process.env.type} playground` ]
    });

  } catch (error) {
    console.log(error);
  }
}