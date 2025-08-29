import * as SDK from "azure-devops-extension-sdk";
import { Controller } from "./control";

// Import CSS - webpack will handle this
import '../styles/style-ado-native.css';

// Work Item Form Control implementation
class WorkItemFormControl {
    private controller: Controller | null = null;

    public onLoaded(workItemLoadedArgs: any): void {
        console.log("Work item loaded:", workItemLoadedArgs);
        
        // Initialize the controller when work item is loaded
        setTimeout(() => {
            console.log("Initializing controller...");
            this.controller = new Controller();
        }, 100);
    }

    public onUnloaded(): void {
        console.log("Work item unloaded");
        this.controller = null;
    }

    public onFieldChanged(fieldChangedArgs: any): void {
        console.log("Field changed:", fieldChangedArgs);
        
        if (this.controller) {
            const fieldName = this.controller.getFieldName();
            if (fieldChangedArgs.changedFields[fieldName] !== undefined) {
                this.controller.updateExternal(fieldChangedArgs.changedFields[fieldName]);
            }
        }
    }
}

// Initialize and register the contribution
SDK.init().then(() => {
    console.log("SDK initialized, registering contribution...");
    
    // Register our work item form control with the contribution ID from manifest
    const contributionId = SDK.getContributionId();
    console.log("Contribution ID:", contributionId);
    
    const control = new WorkItemFormControl();
    
    // Register the control object
    SDK.register(contributionId, control);
    
    console.log("Contribution registered successfully");
    SDK.notifyLoadSucceeded();
}).catch(error => {
    console.error("Failed to initialize SDK:", error);
    SDK.notifyLoadFailed(error);
});
