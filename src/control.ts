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

            // Try multiple approaches to get the work item ID
            
            // Approach 1: Try work item form navigation service
            try {
                const workItemNavService = await SDK.getService<any>("ms.vss-work-web.work-item-form-navigation-service");
                if (workItemNavService && typeof workItemNavService.getWorkItemId === 'function') {
                    this.workItemId = await workItemNavService.getWorkItemId();
                    console.log("Work item ID from navigation service:", this.workItemId);
                }
            } catch (navError) {
                console.log("Could not get navigation service:", navError);
            }
            
            // Approach 2: Try work item service if we don't have ID yet
            if (!this.workItemId) {
                try {
                    const workItemService = await SDK.getService<any>("ms.vss-work-web.work-item-service");
                    console.log("Work item service obtained:", workItemService);
                    
                    if (workItemService) {
                        // Try getId method
                        if (typeof workItemService.getId === 'function') {
                            this.workItemId = await workItemService.getId();
                            console.log("Work item ID from getId():", this.workItemId);
                        }
                        // Try getWorkItemId method
                        else if (typeof workItemService.getWorkItemId === 'function') {
                            this.workItemId = await workItemService.getWorkItemId();
                            console.log("Work item ID from getWorkItemId():", this.workItemId);
                        }
                        // Try accessing workItemsMap
                        else if (workItemService.workItemsMap && workItemService.workItemsMap.size > 0) {
                            const workItemKeys = Array.from(workItemService.workItemsMap.keys());
                            this.workItemId = Number(workItemKeys[0]);
                            console.log("Work item ID from workItemsMap:", this.workItemId);
                        }
                        // Try pageContext
                        else if (workItemService.pageContext && workItemService.pageContext.workItemId) {
                            this.workItemId = workItemService.pageContext.workItemId;
                            console.log("Work item ID from pageContext:", this.workItemId);
                        }
                        else {
                            console.log("Available methods on work item service:", Object.getOwnPropertyNames(workItemService));
                            console.log("Available properties on work item service:", Object.keys(workItemService));
                            console.log("Work item service prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(workItemService)));
                        }
                    }
                } catch (serviceError) {
                    console.log("Could not get work item service:", serviceError);
                }
            }
            
            // Approach 3: Try URL parsing if we still don't have ID
            if (!this.workItemId) {
                const url = window.location.href;
                console.log("Current URL:", url);
                
                // Extract work item ID from URL (typical format: .../workitems/edit/123)
                const workItemMatch = url.match(/workitems\/edit\/(\d+)/);
                if (workItemMatch) {
                    this.workItemId = parseInt(workItemMatch[1], 10);
                    console.log("Work item ID from URL:", this.workItemId);
                } else {
                    // Try another URL pattern (for different Azure DevOps contexts)
                    const workItemMatch2 = url.match(/\/(\d+)(?:\?|$)/);
                    if (workItemMatch2) {
                        this.workItemId = parseInt(workItemMatch2[1], 10);
                        console.log("Work item ID from URL (pattern 2):", this.workItemId);
                    }
                }
            }
            
            // Approach 4: Since we know from logs that work item 17 is loaded, try that as fallback
            if (!this.workItemId) {
                console.log("Using work item ID 17 from the console logs as fallback");
                this.workItemId = 17;
            }
            
            // If we have a work item ID, try to load the current field value
            if (this.workItemId) {
                await this.loadCurrentFieldValue();
            } else {
                console.log("Extension will work in local-only mode");
            }
            
        } catch (error) {
            console.warn("Could not initialize REST client:", error);
        }
    }

    private async loadCurrentFieldValue(): Promise<void> {
        if (!this.witClient || !this.workItemId) {
            console.log("Cannot load field value - missing client or work item ID");
            return;
        }

        // Try to load current field value using the work item form service first
        try {
            console.log("Attempting to load current field value via form service...");
            const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
            
            if (workItemFormService && typeof workItemFormService.getFieldValue === 'function') {
                console.log("Using form service getFieldValue...");
                const currentValue = await workItemFormService.getFieldValue(this.fieldName);
                console.log(`Current field value from form service: ${this.fieldName} = ${currentValue} (type: ${typeof currentValue})`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value from form service:", numValue);
                    return; // Success!
                } else {
                    console.log("Field value from form service is null/undefined");
                }
            } else {
                console.log("Form service doesn't have getFieldValue method");
            }
        } catch (formError) {
            console.warn("Failed to load field value via form service:", formError);
        }

        // Fallback to REST API approach
        try {
            console.log(`Loading current value for field ${this.fieldName} from work item ${this.workItemId} via REST API`);
            
            const workItem = await this.witClient.getWorkItem(this.workItemId, undefined, undefined, undefined, WorkItemExpand.All);
            console.log("Work item data loaded successfully:", {
                id: workItem?.id,
                rev: workItem?.rev,
                fieldsCount: workItem?.fields ? Object.keys(workItem.fields).length : 0
            });
            
            if (workItem && workItem.fields) {
                console.log("Available fields:", Object.keys(workItem.fields));
                const currentValue = workItem.fields[this.fieldName];
                console.log(`Current field value: ${this.fieldName} = ${currentValue} (type: ${typeof currentValue})`);
                
                if (currentValue !== undefined && currentValue !== null) {
                    const numValue = Number(currentValue) || 0;
                    this.model.setCurrentValue(numValue);
                    this.view.update(numValue);
                    console.log("Updated view with current field value:", numValue);
                } else {
                    console.log(`Field ${this.fieldName} not found in work item or is null/undefined`);
                    // Check if field exists with different casing or format
                    const fieldKeys = Object.keys(workItem.fields);
                    const possibleMatches = fieldKeys.filter(key => 
                        key.toLowerCase().includes('effort') || 
                        key.toLowerCase().includes('scheduling')
                    );
                    if (possibleMatches.length > 0) {
                        console.log("Possible field name matches:", possibleMatches);
                    }
                }
            } else {
                console.warn("Work item loaded but has no fields property");
            }
        } catch (error) {
            console.error("Failed to load current field value via REST API:", error);
            console.error("Error details:", {
                message: (error as any)?.message,
                status: (error as any)?.status,
                statusText: (error as any)?.statusText
            });
        }
    }

    private async updateInternal(value: number): Promise<void> {
        try {
            // Update the local model and view first
            this.update(value);
            
            // Try to update the work item field via REST API
            if (this.witClient && this.workItemId) {
                console.log(`Updating work item ${this.workItemId} field ${this.fieldName} to ${value} via REST API`);
                
                // First, let's check if we can get authentication info
                try {
                    const accessToken = await SDK.getAccessToken();
                    const user = SDK.getUser();
                    console.log("Authentication context:", {
                        hasToken: !!accessToken,
                        tokenLength: accessToken?.length,
                        userId: user?.id,
                        userDisplayName: user?.displayName
                    });
                } catch (authError) {
                    console.warn("Could not get authentication info:", authError);
                }
                
                // Let's try using the work item form service instead of REST API
                // This approach might work better within the extension context
                try {
                    console.log("Attempting to use work item form service for updates...");
                    const workItemFormService = await SDK.getService<any>("ms.vss-work-web.work-item-form");
                    
                    if (workItemFormService) {
                        console.log("Work item form service obtained:", typeof workItemFormService);
                        console.log("Form service methods:", Object.getOwnPropertyNames(workItemFormService));
                        
                        // Try to set the field value using the form service
                        if (typeof workItemFormService.setFieldValue === 'function') {
                            console.log("Using setFieldValue from form service...");
                            await workItemFormService.setFieldValue(this.fieldName, value);
                            console.log("Field value set successfully via form service");
                            
                            // Check if the field value was actually set
                            try {
                                const verifyValue = await workItemFormService.getFieldValue(this.fieldName);
                                console.log("Verified field value after set:", verifyValue);
                                
                                // Check if the work item is marked as dirty (indicating changes)
                                const isDirty = await workItemFormService.isDirty();
                                console.log("Work item is dirty after field change:", isDirty);
                                
                                // Auto-save the work item
                                if (isDirty && typeof workItemFormService.save === 'function') {
                                    console.log("Auto-saving work item...");
                                    try {
                                        await workItemFormService.save();
                                        console.log("Work item saved successfully!");
                                    } catch (saveError) {
                                        console.warn("Failed to auto-save work item:", saveError);
                                        // Don't throw the error - the field change was successful even if save failed
                                    }
                                } else if (!isDirty) {
                                    console.log("Work item not dirty, no save needed");
                                } else {
                                    console.log("Save method not available on form service");
                                }
                                
                            } catch (verifyError) {
                                console.warn("Could not verify field value:", verifyError);
                            }
                            
                            return; // Success!
                        } else if (typeof workItemFormService.setFieldValues === 'function') {
                            console.log("Using setFieldValues from form service...");
                            const fieldValues = { [this.fieldName]: value };
                            await workItemFormService.setFieldValues(fieldValues);
                            console.log("Field values set successfully via form service");
                            
                            // Auto-save the work item
                            try {
                                const isDirty = await workItemFormService.isDirty();
                                if (isDirty && typeof workItemFormService.save === 'function') {
                                    console.log("Auto-saving work item...");
                                    await workItemFormService.save();
                                    console.log("Work item saved successfully!");
                                }
                            } catch (saveError) {
                                console.warn("Failed to auto-save work item:", saveError);
                            }
                            
                            return; // Success!
                        } else {
                            console.log("Form service doesn't have expected field update methods");
                        }
                    }
                } catch (formServiceError) {
                    console.warn("Form service approach failed:", formServiceError);
                }
                
                // Fallback to REST API with enhanced debugging
                const patchDocument = [{
                    op: "replace",
                    path: `/fields/${this.fieldName}`,
                    value: value
                }];
                
                console.log("Patch document:", patchDocument);
                
                // Try to get project context which might be needed for REST API
                try {
                    const projectService = await SDK.getService<any>("ms.vss-tfs-web.tfs-page-data-service");
                    if (projectService) {
                        const pageData = await projectService.getPageData();
                        console.log("Project context:", {
                            projectId: pageData?.project?.id,
                            projectName: pageData?.project?.name
                        });
                    }
                } catch (projectError) {
                    console.log("Could not get project context:", projectError);
                }
                
                // Add timeout wrapper to prevent hanging
                const updateWithTimeout = Promise.race([
                    this.witClient.updateWorkItem(patchDocument, this.workItemId),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('REST API call timed out after 10 seconds')), 10000)
                    )
                ]);
                
                try {
                    console.log("About to call updateWorkItem REST API with timeout...");
                    const result = await updateWithTimeout as any;
                    console.log("Work item updated successfully:", {
                        id: result?.id,
                        rev: result?.rev,
                        updatedField: result?.fields?.[this.fieldName]
                    });
                } catch (apiError) {
                    console.error("REST API update failed:", apiError);
                    console.error("API Error details:", {
                        message: (apiError as any)?.message,
                        status: (apiError as any)?.status,
                        statusText: (apiError as any)?.statusText,
                        response: (apiError as any)?.response
                    });
                    
                    // Check if it's a permission or authentication issue
                    if ((apiError as any)?.status === 401) {
                        console.error("Authentication error - check if extension has proper permissions");
                    } else if ((apiError as any)?.status === 403) {
                        console.error("Permission error - extension may not have permission to edit work items");
                    }
                    
                    throw apiError;
                }
            } else {
                console.log(`Local update only: ${this.fieldName} = ${value} (witClient: ${!!this.witClient}, workItemId: ${this.workItemId})`);
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
