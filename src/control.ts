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
            return;
        }

        // Try to load current field value using the work item form service first
        try {
            const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
            
            if (workItemFormService && typeof workItemFormService.getFieldValue === 'function') {
                const currentValue = await workItemFormService.getFieldValue(this.fieldName);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    return;
                }
            }
        } catch (formError) {
            // Ignore form service errors and try REST API
        }

        // Fallback to REST API approach
        try {
            const workItem = await this.witClient.getWorkItem(this.workItemId, undefined, undefined, undefined, WorkItemExpand.All);
            
            if (workItem && workItem.fields) {
                const currentValue = workItem.fields[this.fieldName];
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                }
            }
        } catch (error) {
            // Ignore REST API errors - extension will work with default value
        }
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            this.update(value);
            
            if (this.witClient && this.workItemId) {
                // Try using the work item form service for updates
                try {
                    const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
                    
                    if (workItemFormService && typeof workItemFormService.setFieldValue === 'function') {
                        await workItemFormService.setFieldValue(this.fieldName, value);
                        return;
                    } else if (workItemFormService && typeof workItemFormService.setFieldValues === 'function') {
                        const fieldValues = { [this.fieldName]: value };
                        await workItemFormService.setFieldValues(fieldValues);
                        return;
                    }
                } catch (formServiceError) {
                    // Ignore form service errors and try REST API
                }
                
                // Fallback to REST API
                const patchDocument = [{
                    op: "replace",
                    path: `/fields/${this.fieldName}`,
                    value: value
                }];
                
                try {
                    await this.witClient.updateWorkItem(patchDocument, this.workItemId);
                } catch (apiError) {
                    // Ignore REST API errors - field change was applied locally
                }
            }
        } catch (error) {
            // Ignore all errors - keep local changes working
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
