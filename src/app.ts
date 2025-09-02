import * as SDK from "azure-devops-extension-sdk";
import { Controller } from "./control";

// Import CSS - webpack will handle this
import '../styles/style.css';

// Work Item Form Control implementation
class WorkItemFormControl {
    private controller: Controller | null = null;

    public onLoaded(workItemLoadedArgs: any): void {
        
        // Initialize the controller when work item is loaded
        setTimeout(() => {
            this.controller = new Controller();
        }, 100);
    }

    public onUnloaded(): void {
        this.controller = null;
    }

    public onFieldChanged(fieldChangedArgs: any): void {
        
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
    console.log("SDK initialized");
    // Register our work item form control with the contribution ID from manifest
    const contributionId = SDK.getContributionId();
    
    const control = new WorkItemFormControl();
    
    // Register the control object
    SDK.register(contributionId, control);
    
    console.log("Contribution registered successfully");
    SDK.notifyLoadSucceeded();
}).catch(error => {
    console.error("Failed to initialize SDK:", error);
    SDK.notifyLoadFailed(error);
});
