const fs = require("fs");
const yaml = require("js-yaml");
const core = require("@actions/core");
const github = require("@actions/github");

(async function(){
  try { 
    const setProjectAction = project => action => type => {
      const repo = github.context.payload.repository.html_url;
      const title = encodeURIComponent(`[${action}][${type}] ${project}`);
      const template = action === "add" ? "add.md" : "update.md";

      return `[![${action}][${action}-badge]](${repo}/issues/new/?title=${title}&template=${template})`;
    };

    const userOnDate = user => {
      const usercontent = "https://avatars3.githubusercontent.com/u";
      const avatar = `${usercontent}/${user.id}?s=60&v=4`;
      const img = `<img src="${avatar}" width="21" align="center"/>`;
      return `[${img} @${user.login}](https://github.com/${user.login}) on _${user.date}_`;
    };

    const directory = process.env.project
    const file = await fs.promises.readFile(`projects/${directory}/data.yaml`);
    const template = await fs.promises.readFile(
      "./.github/actions/templates/TEMPLATE.md",
      { encoding: "utf-8", flag: "r" }
    );
    const data = yaml.safeLoad(file);
      
    const readme = template.replace(/\{\{(?:[a-z]|\.)+\}\}/g, match => {
      switch (match) {
        case "{{issue}}":
          return data.issue;
        case "{{ios}}":
          return data.ios ? "![ios-badge]" : "";
        case "{{android}}":
          return data.android ? "![android-badge]" : "";
        case "{{title}}":
          return data.title
        case "{{description}}":
          return data.description;
        case "{{resources}}":
          return data.resources;
        default:
          // match must be of 'playground.flavour?action/author/contributor'
          let replacement = "";
          const index = match.indexOf(".");
          const lastIndex = match.lastIndexOf(".");
          const flavour = match.substring(index + 1, lastIndex);
          const playground = data.playgrounds[flavour];

          switch (match) {
            case `{{playground.${flavour}.badge}}`:
              replacement = playground.url ? playground.url : "";
              break;
            case `{{playground.${flavour}.action}}`:
              const action = playground.url ? "update" : "add";
              const type = playground.flavour.toLowerCase();
              replacement = setProjectAction(data.title)(action)(type);
              break;
            case `{{playground.${flavour}.url}}`:
              replacement = playground.url 
                ? `${playground.url}` 
                : `This project has no _${playground.flavour}_ playground.`;
              break;
            case `{{playground.${flavour}.author}}`:
              replacement = playground.author
                ? `- Authored by ${userOnDate(playground.author)}.`
                : "";
              break;
            case `{{playground.${flavour}.contributor}}`:
              replacement = playground.contributor
                ? `- Last contribution by ${userOnDate(playground.contributor)}.`
                : "";
              break;
            case `{{playground.${flavour}.ios}}`:
              replacement = playground.ios
                ? `[![iOS][ios-badge--simple]]()` 
                : "";
              break;
            case `{{playground.${flavour}.android}}`:
              replacement = playground.android
                ? `[![Android][android-badge--simple]]()`
                : "";
              break;
          }

          return replacement;
      }
    });

    await fs.promises.writeFile(`projects/${directory}/README.md`, readme); 
    core.setOutput("status", "pull-request")
    core.setOutput("issue", data.issue);
  } catch (error) {
    console.log(error);
  }
})();