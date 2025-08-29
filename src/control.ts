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

            // Get the work item form service
            const workItemFormService = await SDK.getService("ms.vss-work-web.work-item-form-service") as IWorkItemFormService;
            
            // Get the current field value
            const currentValue = await workItemFormService.getFieldValue(this.fieldName);
            
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

    private handleError(error: any): void {
        console.error('Controller error:', error);
        new ErrorView(error);
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            const workItemFormService = await SDK.getService("ms.vss-work-web.work-item-form-service") as IWorkItemFormService;
            await workItemFormService.setFieldValue(this.fieldName, value);
            this.update(value);
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
