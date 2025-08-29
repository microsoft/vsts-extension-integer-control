import * as SDK from "azure-devops-extension-sdk";
import { Model } from "./model";
import { View } from "./view";
import { ErrorView } from "./errorView";

export class Controller {
    private fieldName: string = "";
    private model!: Model;
    private view!: View;
    private workItemFormService: any = null;

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

            // Try to initialize service and load current value in background
            this.initializeServiceAsync();

        } catch (error) {
            this.handleError(error);
        }
    }

    private async initializeServiceAsync(): Promise<void> {
        try {
            // Wait for SDK to be fully ready
            await SDK.ready();
            await this.initializeService();
            const currentValue = await this.getFieldValue();
            const numValue = Number(currentValue) || 0;
            this.model.setCurrentValue(numValue);
            this.view.update(numValue);
            console.log("Loaded current field value:", numValue);
        } catch (error) {
            console.warn("Could not load current field value, will work in offline mode:", error);
            // Extension will still work for incrementing/decrementing, just won't sync with work item
        }
    }

    private async initializeService(): Promise<void> {
        try {
            console.log("Attempting to get work item form service...");
            
            // Use the most common service identifier
            this.workItemFormService = await SDK.getService("ms.vss-work-web.work-item-form-service");
            
            if (this.workItemFormService) {
                console.log("Work item form service initialized successfully");
                return;
            }
        } catch (error) {
            console.warn("Failed to get work item form service:", error);
        }
        
        throw new Error("Work item form service not available");
    }

    private async getFieldValue(): Promise<any> {
        if (!this.workItemFormService) {
            throw new Error("Work item form service not initialized");
        }
        return await this.workItemFormService.getFieldValue(this.fieldName);
    }

    private handleError(error: any): void {
        console.error('Controller error:', error);
        new ErrorView(error);
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            // Update the local model and view first
            this.update(value);
            
            // Try to sync with work item if service is available
            if (!this.workItemFormService) {
                console.log("Work item service not available, trying to initialize...");
                await this.initializeService();
            }
            
            if (this.workItemFormService) {
                await this.workItemFormService.setFieldValue(this.fieldName, value);
                console.log(`Updated field ${this.fieldName} to ${value}`);
            } else {
                console.warn("Work item form service not available, update only applied locally");
            }
        } catch (error) {
            console.warn("Failed to update work item field, keeping local change:", error);
            // Keep the local update even if work item sync fails
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
}
