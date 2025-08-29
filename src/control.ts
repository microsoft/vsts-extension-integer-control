import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
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
            // Get the configuration inputs
            const config = SDK.getConfiguration();
            console.log("SDK Configuration:", config);
            
            this.fieldName = config.witInputs?.["FieldName"] || "";

            if (!this.fieldName) {
                throw new Error("FieldName input is required. Make sure the extension is configured with a field.");
            }

            console.log("Initializing controller for field:", this.fieldName);

            // Initialize the model with a default value
            this.model = new Model(0);
            
            // Initialize the view
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

            console.log("View initialized successfully");

            // Try to initialize the REST API client and load current value
            await this.initializeRestClient();

        } catch (error) {
            this.handleError(error);
        }
    }

    private async initializeRestClient(): Promise<void> {
        try {
            console.log("Initializing work item tracking REST client...");
            
            // Wait for SDK to be ready
            await SDK.ready();
            
            // Get the work item tracking REST client
            this.witClient = getClient(WorkItemTrackingRestClient);
            console.log("REST client initialized successfully");

            // Get the current work item context
            const workItemContext = SDK.getConfiguration();
            console.log("Work item context:", workItemContext);
            
            // Try to get the work item ID from the context
            // This might be available in the host or through other means
            const host = SDK.getHost();
            console.log("Host information:", host);
            
            // For now, let's see what we can extract from the context
            console.log("Extension context:", SDK.getExtensionContext());
            
            // TODO: Extract work item ID from the context to enable REST API calls
            
        } catch (error) {
            console.warn("Could not initialize REST client:", error);
        }
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            // Update the local model and view first
            this.update(value);
            
            // TODO: Implement REST API call to update work item field
            if (this.witClient && this.workItemId) {
                console.log(`Would update work item ${this.workItemId} field ${this.fieldName} to ${value} via REST API`);
                // await this.witClient.updateWorkItem([{
                //     op: "replace",
                //     path: `/fields/${this.fieldName}`,
                //     value: value
                // }], this.workItemId);
            } else {
                console.log(`Local update only: ${this.fieldName} = ${value}`);
            }
            
        } catch (error) {
            console.warn("Failed to update work item field, keeping local change:", error);
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
