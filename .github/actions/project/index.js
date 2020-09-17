const core = require("@actions/core");
const github = require("@actions/github");
const utils = require("./utils");
const fs = require("fs");
const yaml = require("js-yaml");

const octokit = github.getOctokit(process.env.token);
const owner = github.context.payload.repository.owner.login;
const issue_number = github.context.payload.issue.number;
const repo  = github.context.payload.repository.name;
const sender = github.context.payload.sender;

const Flavours = {
  js: "JavaScript",
  ng: "Angular",
  tsc: "TypeScript",
  vue: "Vue",
  react: "React",
  svelte: "Svelte"
}


const getSection = text => (from, to = "") => {
  const start = text.indexOf(from) + from.length;
  return to === ""
    ? text.substring(start).trim()
    : text.substring(start, text.indexOf(to)).trim();
}

const extractTitle = text => {
  const title = getSection(text)("## Project Title", "## Platform Support")
  return title.match(/^[a-z0-9 ]+$/i) ? utils.capitalise(title) : null;
};

const extractDescription = text => {
  const description = getSection(text)("## Description", "## Resources");
  return description !== "" ? description : null;
}

const extractResources = text => {
  const resources = getSection(text)("## Resources", "## Playgrounds");
  return resources;
}

const extractPlatformSupport = text => platform => {
  const platforms = getSection(text)("## Platform Support", "## Description");
  return utils.platformSupport(platforms)(platform);
}

const extractPlaygrounds = text => {
  const section = getSection(text)("## Playgrounds");
  const url = "play.nativescript.org/?template=play-";
  const exp = new RegExp(/(play.nativescript.org\/\?template\=play-(?:js|tsc|ng|react|vue|svelte)\&id\=(?:\w)+(?:\&v\=(?:\d)+)?)|[^]/, "g");
  const playgrounds = section.split(" ")
    .filter(playground => playground.includes(url))
    .map(url => url.replace(exp, "$1"));

  if (playgrounds.length < 1) return null;

  return playgrounds.reduce((obj, item) => {
    const start = item.indexOf("play-") + 5;
    const flavour = item.substring(start, item.indexOf("&id"));
    obj[flavour] = `https://${item}`;
    return obj;
  }, {});
}


switch (github.context.payload.action) {
  case "opened":
    projectSubmission();
    break;
  case "created":
    commentParser();
    break;
}

// 1. Get all the project data from the users issue body
// 2. Create the project directory and data.yaml file


async function projectSubmission() {
  try {
    const body = utils.stripComments(github.context.payload.issue.body);
    const title = process.env.project;

    if (!fs.existsSync(`projects/${title}`)) {
      const description = extractDescription(body);
      const resources = extractResources(body);
      const ios = extractPlatformSupport(body)("ios");
      const android = extractPlatformSupport(body)("android");
      const playgrounds = extractPlaygrounds(body);
      
      // all minimum requirements in place
      if (title && description && playgrounds && (ios + android)) {
        const directoryPath = `projects/${title}`;
        const filePath = `${directoryPath}/data.yaml`;
        const projectYAML = buildProjectYml({
          title, ios, android, description, resources, playgrounds
        });
        
        await fs.promises.mkdir(directoryPath);
        await fs.promises.writeFile(filePath, projectYAML)
        await octokit.request({ url: sender.url }).name;
        const email = `${sender.login}@users.noreply.github.com`;
       
        core.setOutput("status", "readme")
        core.setOutput("title", title);
        core.setOutput("pr-title", `[pr][project][${issue_number}] ${title}`)
        core.setOutput("author", `${sender.login} <${email}>`)
        core.setOutput("branch", `project_${title}`.replace(/( )/g, ""))
        return;
      } else {
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number,
          body: `@${sender.login}, there was an unidetified problem parsing your submition. @mudlabs has been notified and will get back to you.`
        });
        await octokit.issues.addAssignees({owner,repo,issue_number,assignees: ["mudlabs"]});
        return;
      }
    } else {
      console.log("Directory already exists"); 
      const data = await fs.promises.readFile("projects/${title}/data.yaml")
      const issue = yaml.safeLoad(data).issue;
      await octokit.pulls.create({owner,repo,title:"My First PR",body:"PR body"});
      await octokit.issues.createComment({
        owner, 
        repo,
        issue_number, 
        body: `Duplicate of #${issue}\r\n\n@${sender.login}, the project [${title}](${github.context.payload.repository.html_url}/tree/master/projects/${title.replace(/( )/g, "%20")}) already exits. If you wanted to _update_ or _add_ a playground to this project, please do so via the links provided in that projects' README; or manually using the provided issue templates.`
      });
      await octokit.issues.update({
        owner, 
        repo, 
        issue_number, 
        title: `[project][duplicate] ${title}`, 
        state: "closed",
        labels: ["duplicate"]
      });
      await octokit.issues.lock({owner, repo, issue_number});

    }

  } catch (error) {
    console.log(error);
  }
}

function buildProjectYml(data) {
  try {
    const author = {
      id: sender.id,
      login: sender.login,
      date: utils.dateString(github.context.payload.issue.created_at)
    }
    const buildPlayground = name => playgrounds => ({
        flavour: Flavours[name],
        url: playgrounds && playgrounds[name] ? playgrounds[name] : null,
        ios: false,
        android: false,
        author: playgrounds && playgrounds[name] ? author : null,
        contributor: null
    });
    return yaml.safeDump({
      issue: github.context.payload.issue.number,
      ios: data.ios,
      android: data.android,
      title: data.title,
      author: author,
      description: data.description,
      resources: data.resources,
      playgrounds: {
        js: buildPlayground("js")(data.playgrounds),
        ng: buildPlayground("ng")(data.playgrounds),
        tsc: buildPlayground("tsc")(data.playgrounds),
        vue: buildPlayground("vue")(data.playgrounds),
        react: buildPlayground("react")(data.playgrounds),
        svelte: buildPlayground("svelte")(data.playgrounds),
      }
    });
  } catch(e) {
    console.log(e);
  }
}


async function commentParser() {
  const comments_url = github.context.payload.issue.comments_url;
  const comments = await octokit.request({ url: comments_url });

  if (github.context.payload.issue.pull_request !== undefined) {
    // we must be dealing with a comment from a PR
    // 1. parse latest comment and check if it is a data.yaml update request
    // 1.1. If it is get the data file from the PR commit and update the field.
    const comment = comments[comments.length - 1]; // the latest comment.
    /**
     * data
     *   playgrounds.js.ios.true
     *   playgrounds.js.android.true
     */
    
    // was the pr automatically created?
    //  - if so the project title is in the pr title
    
  } else {
    // we must be dealing with a commnet from an issue
  }
}
