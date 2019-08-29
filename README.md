[apple icon]: https://icomoon.io/icons9f9702a/13/340.svg "iOS"
[android icon]: https://icomoon.io/icons9f9702a/13/342.svg "Android"

# NativeScript Playgrounds
A collection of NativeScript playground projects demonstrating what you can do with NativeScript; and at least _one_ way to do it.

* To view a project on your device, select the project file and scan the QR Code using the _Playground App_.
  * [Playground App (Android)](https://play.google.com/store/apps/details?id=org.nativescript.play)
  * [Playground App (iOS)](https://apps.apple.com/au/app/nativescript-playground/id1263543946)

* To visit the projects _Playground_ and inspect the code, click the title above the QR Code.

---

## Contributing

### Contribute a New Project
To contribute a new project please follow the below steps.
  1. Fork the repository.
  1. Create a new branch named `new_<your-project-name>`.
  1. Open the `.github` directory and copy the contents of `readme_template.md`.
  1. In the root of your new branch create a new folder named, `Your Project Name`.
     * Note the _capitalised_ and _spaced_ naming format.
  1. Add a `README.md` to this project directory, and past in the previously copied text from step 3.
  1. Update the placeholder _title_ and _description_ to suit your project.
  1. Find the table for the type of project you have created _(i.e. JavaScript, Veu etc...)_. Follow the instruction comments in the _README_ to update the appropriate table.
  1. Check the _title_ link and QR Code both point to the same, most recent, and complete Playground.
  1. Commit your changes and create a pull request.
  
### Contribute a Missing Project
If an existing project is incomplete, say there's no Angular implementation, you can fix that by following the below steps.
  1. Fork the repository.
  1. Create a new branch named `missing_<existing-project-name>`.
  1. Update the appropiate tables _title_ with the link to your Playground implementation.
  1. Replace `Project Missing` from the tables content cell with the QR Code provided by Playgrounds' UI.
  1. Add the QR Code `.png` to the directory. Following the naming convention of the existing images.
  1. Check the _title_ link and QR Code both point to the same, most recent, and complete Playground.
  1. Commit your changes and create a pull request.
  
### Contribute an Update
If you inspect a projects' Playground code and find some errors, or just want to make some kind of improvement;
  1. Fork the repository.
  1. Create a new branch named `update_<existing-project-name>`.
  1. Navigate to the Playground code and make your changes.
  1. Save the project with the Playgrounds' UI, and copy the new url. Then update the _title_ link with this new url.
  1. Replace the existing QR Code with the new one provided by Playgrounds' UI.
  1. Double check both the _title_ link and QR Code go the the same version.
  1. Commit your changes and create a pull request.
