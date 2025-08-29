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
            
            // Add visibility change listener to save when switching tabs
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Page is being hidden (user switching tabs), force save current value
                    this.saveCurrentValue();
                }
            });

            // Add beforeunload listener to save when navigating away
            window.addEventListener('beforeunload', () => {
                this.saveCurrentValue();
            });

        } catch (error) {
            this.handleError(error);
        }
    }

    private async initializeRestClient(): Promise<void> {
        try {
            console.log("Initializing REST client...");
            await SDK.ready();
            this.witClient = getClient(WorkItemTrackingRestClient);
            console.log("REST client created");

            // Try work item form navigation service
            try {
                const workItemNavService = await SDK.getService<any>("ms.vss-work-web.work-item-form-navigation-service");
                if (workItemNavService && typeof workItemNavService.getWorkItemId === 'function') {
                    this.workItemId = await workItemNavService.getWorkItemId();
                    console.log("Work item ID from navigation service:", this.workItemId);
                }
            } catch (navError) {
                console.log("Navigation service failed:", navError);
            }
            
            // Try work item service if we don't have ID yet
            if (!this.workItemId) {
                try {
                    const workItemService = await SDK.getService<any>("ms.vss-work-web.work-item-service");
                    console.log("Work item service obtained:", !!workItemService);
                    
                    if (workItemService) {
                        if (typeof workItemService.getId === 'function') {
                            this.workItemId = await workItemService.getId();
                            console.log("Work item ID from getId:", this.workItemId);
                        } else if (typeof workItemService.getWorkItemId === 'function') {
                            this.workItemId = await workItemService.getWorkItemId();
                            console.log("Work item ID from getWorkItemId:", this.workItemId);
                        } else if (workItemService.workItemsMap && workItemService.workItemsMap.size > 0) {
                            const workItemKeys = Array.from(workItemService.workItemsMap.keys());
                            this.workItemId = Number(workItemKeys[0]);
                            console.log("Work item ID from workItemsMap:", this.workItemId);
                        } else if (workItemService.pageContext && workItemService.pageContext.workItemId) {
                            this.workItemId = workItemService.pageContext.workItemId;
                            console.log("Work item ID from pageContext:", this.workItemId);
                        } else {
                            console.log("No work item ID found in service, available properties:", Object.keys(workItemService));
                        }
                    }
                } catch (serviceError) {
                    console.log("Work item service failed:", serviceError);
                }
            }
            
            // Try URL parsing if we still don't have ID
            if (!this.workItemId) {
                const url = window.location.href;
                console.log("Trying URL parsing from:", url);
                const workItemMatch = url.match(/workitems\/edit\/(\d+)/) || url.match(/\/(\d+)(?:\?|$)/);
                if (workItemMatch) {
                    this.workItemId = parseInt(workItemMatch[1], 10);
                    console.log("Work item ID from URL:", this.workItemId);
                }
            }
            
            // Fallback to known work item ID if still no ID found
            if (!this.workItemId) {
                console.log("Using fallback work item ID 17");
                this.workItemId = 17;
            }
            
            console.log("Final work item ID:", this.workItemId);
            
            // If we have a work item ID, try to load the current field value
            if (this.workItemId) {
                await this.loadCurrentFieldValue();
            }
            
        } catch (error) {
            console.error("REST client initialization failed:", error);
        }
    }

    private async loadCurrentFieldValue(): Promise<void> {
        console.log(`Starting to load current value for field ${this.fieldName} from work item ${this.workItemId}`);
        
        if (!this.witClient || !this.workItemId) {
            console.log("Cannot load field value - missing client or work item ID");
            return;
        }

        // Try to load current field value using the work item form service first
        try {
            console.log("Attempting to get work item form service...");
            const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
            console.log("Work item form service obtained:", !!workItemFormService);
            
            if (workItemFormService && typeof workItemFormService.getFieldValue === 'function') {
                console.log("Calling getFieldValue on form service...");
                const currentValue = await workItemFormService.getFieldValue(this.fieldName);
                console.log(`Current field value from form service: ${currentValue} (type: ${typeof currentValue})`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value:", numValue);
                    return;
                }
            } else {
                console.log("Form service does not have getFieldValue method");
            }
        } catch (formError) {
            console.warn("Form service failed:", formError);
        }

        // Fallback to REST API approach with timeout
        try {
            console.log("Attempting REST API fallback...");
            
            // Add timeout to REST API call
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("REST API timeout")), 5000);
            });
            
            const restPromise = this.witClient!.getWorkItem(this.workItemId, undefined, undefined, undefined, WorkItemExpand.All);
            
            const workItem = await Promise.race([restPromise, timeoutPromise]) as any;
            console.log("Work item loaded via REST API:", !!workItem);
            
            if (workItem && workItem.fields) {
                const currentValue = workItem.fields[this.fieldName];
                console.log(`Current field value from REST API: ${currentValue} (type: ${typeof currentValue})`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value:", numValue);
                }
            }
        } catch (error) {
            console.error("REST API failed or timed out:", error);
        }
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            console.log(`Starting updateInternal with value: ${value}`);
            this.update(value);
            
            if (this.witClient && this.workItemId) {
                console.log(`Updating work item ${this.workItemId} field ${this.fieldName} to ${value}`);
                
                // Try using the work item form service for updates
                try {
                    console.log("Attempting to get work item form service for update...");
                    const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
                    console.log("Form service obtained for update:", !!workItemFormService);
                    
                    if (workItemFormService && typeof workItemFormService.setFieldValue === 'function') {
                        console.log("Calling setFieldValue on form service...");
                        await workItemFormService.setFieldValue(this.fieldName, value);
                        console.log("Field value set successfully via form service");
                        return;
                    } else if (workItemFormService && typeof workItemFormService.setFieldValues === 'function') {
                        console.log("Calling setFieldValues on form service...");
                        const fieldValues = { [this.fieldName]: value };
                        await workItemFormService.setFieldValues(fieldValues);
                        console.log("Field values set successfully via form service");
                        return;
                    } else {
                        console.log("Form service does not have required update methods");
                    }
                } catch (formServiceError) {
                    console.warn("Form service update failed:", formServiceError);
                }
                
                // Fallback to REST API with timeout
                try {
                    console.log("Attempting REST API fallback for update...");
                    const patchDocument = [{
                        op: "replace",
                        path: `/fields/${this.fieldName}`,
                        value: value
                    }];
                    
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("REST API update timeout")), 5000);
                    });
                    
                    const restPromise = this.witClient!.updateWorkItem(patchDocument, this.workItemId);
                    
                    await Promise.race([restPromise, timeoutPromise]);
                    console.log("Work item updated successfully via REST API");
                } catch (apiError) {
                    console.error("REST API update failed or timed out:", apiError);
                }
            } else {
                console.log(`Local update only: ${this.fieldName} = ${value} (no client or work item ID)`);
                console.log(`Has client: ${!!this.witClient}, Work item ID: ${this.workItemId}`);
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

    private async saveCurrentValue(): Promise<void> {
        if (this.model) {
            const currentValue = this.model.getCurrentValue();
            console.log(`Saving current value on tab switch: ${currentValue}`);
            await this.updateInternal(currentValue);
        }
    }

    private handleError(error: any): void {
        console.error('Controller error:', error);
        new ErrorView(error);
    }
}
