import { Controller } from "./control";

export class WorkItemFormControl {
    private controller: Controller | null = null;

    constructor(private createController: () => Controller) {}

    public onLoaded(workItemLoadedArgs: any): void {
        setTimeout(() => {
            this.controller = this.createController();
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