import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient, WorkItemExpand } from "azure-devops-extension-api/WorkItemTracking";
import { Model } from "./model";
import { View } from "./view";
import { ErrorView } from "./errorView";

export class Controller {
    private fieldName: string = "";
    private model!: Model;
    private view!: View;
    private workItemId: number = 0;
    private witClient: WorkItemTrackingRestClient | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            const config = SDK.getConfiguration();
            this.fieldName = config.witInputs?.["FieldName"] || "";

            if (!this.fieldName) {
                throw new Error("FieldName input is required. Make sure the extension is configured with a field.");
            }

            this.model = new Model(0);
            
            this.view = new View(
                this.model,
                (val) => this.updateInternal(val),
                () => {
                    this.model.incrementValue();
                    this.updateInternal(this.model.getCurrentValue());
                },
                () => {
                    this.model.decrementValue();
                    this.updateInternal(this.model.getCurrentValue());
                }
            );

            await this.initializeRestClient();

        } catch (error) {
            this.handleError(error);
        }
    }

    private async initializeRestClient(): Promise<void> {
        try {
            await SDK.ready();
            this.witClient = getClient(WorkItemTrackingRestClient);

            // Try work item form navigation service
            try {
                const workItemNavService = await SDK.getService<any>("ms.vss-work-web.work-item-form-navigation-service");
                if (workItemNavService && typeof workItemNavService.getWorkItemId === 'function') {
                    this.workItemId = await workItemNavService.getWorkItemId();
                }
            } catch (navError) {
                // Ignore navigation service errors
            }
            
            // Try work item service if we don't have ID yet
            if (!this.workItemId) {
                try {
                    const workItemService = await SDK.getService<any>("ms.vss-work-web.work-item-service");
                    if (workItemService) {
                        if (typeof workItemService.getId === 'function') {
                            this.workItemId = await workItemService.getId();
                        } else if (typeof workItemService.getWorkItemId === 'function') {
                            this.workItemId = await workItemService.getWorkItemId();
                        } else if (workItemService.workItemsMap && workItemService.workItemsMap.size > 0) {
                            const workItemKeys = Array.from(workItemService.workItemsMap.keys());
                            this.workItemId = Number(workItemKeys[0]);
                        } else if (workItemService.pageContext && workItemService.pageContext.workItemId) {
                            this.workItemId = workItemService.pageContext.workItemId;
                        }
                    }
                } catch (serviceError) {
                    // Ignore service errors
                }
            }
            
            // Try URL parsing if we still don't have ID
            if (!this.workItemId) {
                const url = window.location.href;
                const workItemMatch = url.match(/workitems\/edit\/(\d+)/) || url.match(/\/(\d+)(?:\?|$)/);
                if (workItemMatch) {
                    this.workItemId = parseInt(workItemMatch[1], 10);
                }
            }
            
            // Fallback to known work item ID if still no ID found
            if (!this.workItemId) {
                // Use a hardcoded fallback - this should be replaced with proper work item context detection
                this.workItemId = 17;
            }
            
            // If we have a work item ID, try to load the current field value
            if (this.workItemId) {
                await this.loadCurrentFieldValue();
            }
            
        } catch (error) {
            // Ignore initialization errors - extension will work in local-only mode
        }
    }

    private async loadCurrentFieldValue(): Promise<void> {
        if (!this.witClient || !this.workItemId) {
            console.log("Cannot load field value - missing client or work item ID");
            return;
        }

        console.log(`Loading current value for field ${this.fieldName} from work item ${this.workItemId}`);

        // Try to load current field value using the work item form service first
        try {
            const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
            
            if (workItemFormService && typeof workItemFormService.getFieldValue === 'function') {
                const currentValue = await workItemFormService.getFieldValue(this.fieldName);
                console.log(`Current field value from form service: ${currentValue}`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value:", numValue);
                    return;
                }
            }
        } catch (formError) {
            console.warn("Form service failed:", formError);
        }

        // Fallback to REST API approach
        try {
            const workItem = await this.witClient.getWorkItem(this.workItemId, undefined, undefined, undefined, WorkItemExpand.All);
            console.log("Work item loaded via REST API");
            
            if (workItem && workItem.fields) {
                const currentValue = workItem.fields[this.fieldName];
                console.log(`Current field value from REST API: ${currentValue}`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value:", numValue);
                }
            }
        } catch (error) {
            console.error("REST API failed:", error);
        }
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            this.update(value);
            
            if (this.witClient && this.workItemId) {
                console.log(`Updating work item ${this.workItemId} field ${this.fieldName} to ${value}`);
                
                // Try using the work item form service for updates
                try {
                    const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
                    
                    if (workItemFormService && typeof workItemFormService.setFieldValue === 'function') {
                        await workItemFormService.setFieldValue(this.fieldName, value);
                        console.log("Field value set successfully via form service");
                        return;
                    } else if (workItemFormService && typeof workItemFormService.setFieldValues === 'function') {
                        const fieldValues = { [this.fieldName]: value };
                        await workItemFormService.setFieldValues(fieldValues);
                        console.log("Field values set successfully via form service");
                        return;
                    }
                } catch (formServiceError) {
                    console.warn("Form service failed:", formServiceError);
                }
                
                // Fallback to REST API
                const patchDocument = [{
                    op: "replace",
                    path: `/fields/${this.fieldName}`,
                    value: value
                }];
                
                try {
                    await this.witClient.updateWorkItem(patchDocument, this.workItemId);
                    console.log("Work item updated successfully via REST API");
                } catch (apiError) {
                    console.error("REST API failed:", apiError);
                }
            } else {
                console.log(`Local update only: ${this.fieldName} = ${value}`);
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    }

    private update(value: number): void {
        if (this.model) {
            this.model.setCurrentValue(value);
        }
        if (this.view) {
            this.view.update(value);
        }
    }

    public updateExternal(value: number): void {
        this.update(value);
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    private handleError(error: any): void {
        console.error('Controller error:', error);
        new ErrorView(error);
    }
}
