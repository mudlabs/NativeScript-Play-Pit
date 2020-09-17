const fs = require("fs");

(async function() {
  try {
    const options = { encoding: "utf-8", flag: "r" };
    const current_readme = await fs.promises.readFile("README.md", options)
    const projects_dir = await fs.promises.readdir("projects", options);
    const list_regexp = new RegExp(/(- \[(?:\w|\s)+\]\((?:\w|\%|\d|\/)+\)\n)+/, "gim");
    
    const list = projects_dir.reduce((prev, curr) => {
      const curr_urlified = curr.replace(/( )/g, "%20");
      return prev + `- [${curr}](projects/${curr_urlified})\n`
    }, "");
    console.log(list);
    const new_readme = current_readme.replace(list_regexp, list);
    console.log(new_readme);
    await fs.promises.writeFile("README.md", new_readme);
  } catch (error) {
    console.log(error);
  }
})()