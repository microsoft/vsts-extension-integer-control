# Plus/Minus Custom Control for the Work Item Form

This extension adds a plus/minus component to an input field, allowing the user to change the field value with a button instead of typing.

![Control](img/hitCountControl.png)

# Documentation 

You can learn how to setup and use the extension from the documentation in the Azure DevOps [Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.hitcount-control). 

# Support

## How to file issues and get help

This project uses [GitHub Issues](https://github.com/microsoft/AzureDevOps-WSJF-Extension/issues) to track bugs and feature requests. Please search the existing issues before filing new issues to avoid duplicates. For new issues, file your bug or feature request as a new Issue. 

## Microsoft Support Policy

Support for this project is limited to the resources listed above.

# Contributing

We welcome contributions to improve the extension. If you would like to contribute, please fork the repository and create a pull request with your changes. Your 
contributions help enhance the functionality and usability of the extension for the entire community.

**Note:** do not publish the extension as a public extension under a different publisher as this will create a clone of the extension and it will be unclear to the 
community which one to use. If you feel you don't want to contribute to this repository then publish a private version for your use-case.

Check out https://learn.microsoft.com/en-us/azure/devops/extend/get-started to learn how to develop Azure DevOps extensions and https://www.visualstudio.com/en-us/docs/integrate/extensions/develop/custom-control to learn how to build your own custom control for the work item form..

## Building the extention

1. Clone the repository.
2. Open the Command Prompt and change to the directory where you cloned the project.  For instance, if it is cloned in a folder called "extensions" and saved as "vsts-extension-integer-control", you will navigate to the following command line.

        > cd C:\extensions\vsts-extension-integer-control
        
1. Run `npm install` to install required local dependencies.
2. Run `npm install -g grunt` to install a global copy of grunt (unless it's already installed).
2. Run `grunt package-dev`.
3. In your browser, navigate to your local instance of TFS, `http://YourTFSInstance:8080/tfs`.
4. Go to your personal Marketplace.
6. Click the Marketplace icon in the upper righthand corner.
7. Click "Browse local extensions" in the dropdown.
7. Scroll down and click on the "Manage Extensions" widget.
8. Click the button "Upload new extension".
9. Browse to the *.vsix* file generated when you packaged your extension.
10. Select the extension, and then click "Open".  Click "Upload" when the button activates.
11. Hover over the extension when it appears in the list, and click "Install".

You have now installed the extension inside your collection.  You are now able to put the control on the work item form.

## Grunt tasks

Three basic `grunt` tasks are defined:

* `build` - Compiles TS files in `scripts` folder
* `package-dev` - Builds the development version of the vsix package
* `package-release` - Builds the release version of the vsix package
* `publish-dev` - Publishes the development version of the extension to the marketplace using `tfx-cli`
* `publish-release` - Publishes the release version of the extension to the marketplace using `tfx-cli`

## VS Code

The included `.vscode` config allows you to open and build the project using [VS Code](https://code.visualstudio.com/).

## Unit Testing

The project is setup for unit testing using `mocha`, `chai`, and the `karma` test runner. A simple example unit test is included in `scripts/logic/messageHelper.tests.ts`. To run tests just execute:

```
grunt test
```

# About Microsoft DevLabs

Microsoft DevLabs is an outlet for experiments from Microsoft, experiments that represent some of the latest ideas around developer tools. Solutions in this 
category are designed for broad usage, and you are encouraged to use and provide feedback on them; however, these extensions are not supported nor are any commitments made as to their longevity.