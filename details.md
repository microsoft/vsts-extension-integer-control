> This extension is currently only available on Azure DevOps Services and Azure DevOps Server 2019 or later.

![Work Item Form](img/form.png)

# Make integer fields more interactive

![Hit Count Control](img/hitCountControl.png)

# Increase/decrease counters with a single click

![Control keys](img/logo.png)

# How to get started
## Azure DevOps Services

Navigate to your work item form customization page and add a plus/minus integer control.

![Layout Customization](img/layoutCustomization.png)

Edit the control so it can use the right integer field.

![Configuration](img/configuration.png)

## Azure DevOps/TFS On-Premise 

The version published to the Azure DevOps Marketplace only supports Azure DevOps Server 2019.

If you want to use this extension for an older version of TFS then you need to manually build and publish the extension after changing the category in the extension manifest to:

    "categories": [
       "Plan and Track"
    ],

[Learn more](https://github.com/Microsoft/vsts-extension-integer-control/blob/master/README.md) about how to customize the integer control directly on XML.

# Source code 

The [source](https://github.com/Microsoft/vsts-extension-integer-control) for this extension can be found on Github - feel free to take, fork and extend. 

You can also learn how to build your own custom control extension for the work item form [here](https://www.visualstudio.com/en-us/docs/integrate/extensions/develop/custom-control). 

# Contributors

We thank the following contributor(s) for this extension: Alison Chow, Maria McLaughlin and Nelson Troncoso Aldas. 

# Feedback 

We need your feedback! Here are some ways to connect with us:

* Add a review below.
* Report issues in [GitHub](https://github.com/Microsoft/vsts-extension-integer-control/issues).

> Microsoft DevLabs is an outlet for experiments from Microsoft, experiments that represent some of the latest ideas around developer tools. Solutions in this category are designed for broad usage, and you are encouraged to use and provide feedback on them; however, these extensions are not supported nor are any commitments made as to their longevity.
