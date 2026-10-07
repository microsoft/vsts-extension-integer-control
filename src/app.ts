import * as SDK from "azure-devops-extension-sdk";
import { Controller } from "./control";
import { WorkItemFormControl } from "./workItemFormControl";

// Import CSS - webpack will handle this
import '../styles/style.css';

// Initialize and register the contribution
SDK.init().then(() => {
    console.log("SDK initialized");
    // Register our work item form control with the contribution ID from manifest
    const contributionId = SDK.getContributionId();
    
    const control = new WorkItemFormControl(() => new Controller(SDK));
    
    // Register the control object
    SDK.register(contributionId, control);
    
    console.log("Contribution registered successfully");
    SDK.notifyLoadSucceeded();
}).catch(error => {
    console.error("Failed to initialize SDK:", error);
    SDK.notifyLoadFailed(error);
});
