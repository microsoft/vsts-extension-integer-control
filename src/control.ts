import * as SDK from "azure-devops-extension-sdk";
import { Model } from "./model";
import { View } from "./view";
import { ErrorView } from "./errorView";

interface IWorkItemFormService {
    getFieldValue(fieldReferenceName: string): Promise<any>;
    setFieldValue(fieldReferenceName: string, value: any): Promise<void>;
    beginSaveWorkItem(successCallback?: () => void, errorCallback?: (error: any) => void): Promise<void>;
}

export class Controller {
    private fieldName: string = "";
    private model!: Model;
    private view!: View;
    private workItemFormService: IWorkItemFormService | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Get the configuration inputs
            const config = SDK.getConfiguration();
            this.fieldName = config.witInputs?.["FieldName"] || "";

            if (!this.fieldName) {
                throw new Error("FieldName input is required");
            }

            // Get the work item form service with retry
            await this.initializeService();
            
            // Get the current field value
            const currentValue = await this.getFieldValue();
            
            // Initialize the model
            this.model = new Model(Number(currentValue) || 0);
            
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

        } catch (error) {
            this.handleError(error);
        }
    }

    private async initializeService(retries: number = 3): Promise<void> {
        for (let i = 0; i < retries; i++) {
            try {
                this.workItemFormService = await SDK.getService("ms.vss-work-web.work-item-form-service") as IWorkItemFormService;
                if (this.workItemFormService) {
                    return;
                }
            } catch (error) {
                console.warn(`Failed to get work item form service, attempt ${i + 1}/${retries}:`, error);
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
                }
            }
        }
        throw new Error("Failed to initialize work item form service after multiple attempts");
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
            if (!this.workItemFormService) {
                await this.initializeService();
            }
            
            if (this.workItemFormService) {
                await this.workItemFormService.setFieldValue(this.fieldName, value);
                this.update(value);
            } else {
                throw new Error("Work item form service not available");
            }
        } catch (error) {
            this.handleError(error);
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
