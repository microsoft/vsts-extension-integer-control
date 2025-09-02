import * as SDK from "azure-devops-extension-sdk";
import { WorkItemTrackingRestClient, WorkItemExpand } from "azure-devops-extension-api/WorkItemTracking";
import { Model } from "./model";
import { View } from "./view";
import { ErrorView } from "./errorView";

export class Controller {
    private fieldName: string = "";
    private model!: Model;
    private view!: View;
    private workItemId?: number;

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
                (val: number) => this.updateInternal(val),
                () => {
                    this.model.incrementValue();
                    this.updateInternal(this.model.getCurrentValue());
                },
                () => {
                    this.model.decrementValue();
                    this.updateInternal(this.model.getCurrentValue());
                }
            );

            await this.loadCurrentFieldValue();

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.saveCurrentValue();
                }
            });

            window.addEventListener('beforeunload', () => {
                this.saveCurrentValue();
            });

        } catch (error) {
            this.handleError(error);
        }
    }

    private async loadCurrentFieldValue(): Promise<void> {
        try {
            console.log("Attempting to get work item form service...");
            const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
            console.log("Work item form service obtained:", !!workItemFormService);

            if (workItemFormService) {
                const currentValue = await workItemFormService.getFieldValue(this.fieldName);
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
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            console.log(`Starting updateInternal with value: ${value}`);
            this.update(value);
                console.log(`Updating work item ${this.workItemId} field ${this.fieldName} to ${value}`);
                try {
                    console.log("Attempting to get work item form service for update...");
                    const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
                    console.log("Form service obtained for update:", !!workItemFormService);
                    if (workItemFormService) {
                        await workItemFormService.setFieldValue(this.fieldName, value);
                        console.log("Field value set successfully via form service");
                        return;
                    }
                } catch (formServiceError) {
                    console.warn("Form service update failed:", formServiceError);
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
