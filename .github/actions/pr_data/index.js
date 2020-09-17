const core = require("@actions/core");
const utils = require("../utils");

let branch, title, body, labels, message;
const committer = "GitHub <noreply@github.com>"
const branch_title = utils.branchify(process.env.project);
const type = process.env.type;
const issue = core.getInput("issue");

switch (type) {
  case "project":
    branch = `project_${branch_title}`;
    title = `[pr][project][${issue}] ${project}`;
    message = "Add new project to list";
    labels = [ "project", "automated" ]
    break;
  case "add":
  case "update":
    message = type === "add" 
      ? "Add missing playground to project"
      : "Update project playground";
    branch = `${type}_${flavour}_${branch_title}`;
    title = `[pr][${type}][${flavour}][${issue}] ${project}`;
    labels = [ `${type} playground`, "automated" ]
    break;
}

core.setOutput("branch", branch);
core.setOutput("title", title);
core.setOutput("message", message);
core.setOutput("labels", labels);
core.setOutput("committer", committer);
