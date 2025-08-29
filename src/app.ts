import * as SDK from "azure-devops-extension-sdk";
import { IWorkItemFieldChangedArgs, IWorkItemLoadedArgs } from "azure-devops-extension-api/WorkItemTracking";
import { Controller } from "./control";

class App {
    private controller: Controller | null = null;

    public async initialize(): Promise<void> {
        try {
            // Initialize the SDK and wait for it to be ready
            await SDK.init();

            // Wait a bit more to ensure the host is fully ready
            await SDK.ready();

            // Register for work item events
            await SDK.register(SDK.getContributionId(), {
                onLoaded: (args: IWorkItemLoadedArgs) => {
                    this.onWorkItemLoaded(args);
                },
                onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
                    this.onFieldChanged(args);
                }
            });

            // Handle save keyboard shortcut (Ctrl+S)
            document.addEventListener('keydown', (event: KeyboardEvent) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                    event.preventDefault();
                    this.saveWorkItem();
                }
            });

            // Notify the host that the extension has loaded
            await SDK.notifyLoadSucceeded();
        } catch (error) {
            console.error('Failed to initialize extension:', error);
        }
    }

    private onWorkItemLoaded(args: IWorkItemLoadedArgs): void {
        // Add a delay to ensure work item is fully initialized
        setTimeout(() => {
            console.log("Work item loaded, initializing controller...");
            this.controller = new Controller();
        }, 500);
    }

    private onFieldChanged(args: IWorkItemFieldChangedArgs): void {
        if (this.controller) {
            const fieldName = this.controller.getFieldName();
            const changedValue = args.changedFields[fieldName];
            if (changedValue !== undefined) {
                this.controller.updateExternal(changedValue);
            }
        }
    }

    private async saveWorkItem(): Promise<void> {
        try {
            const workItemFormService = await SDK.getService("ms.vss-work-web.work-item-form-service") as any;
            await workItemFormService.beginSaveWorkItem(() => {}, () => {});
        } catch (error) {
            console.error('Failed to save work item:', error);
        }
    }
}

// Initialize the application
const app = new App();
app.initialize().catch(error => {
    console.error('Failed to initialize extension:', error);
});
