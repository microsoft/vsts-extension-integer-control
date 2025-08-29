import { Model } from "./model";

export class ViewAdoNative {
    private currentValue: string = "";
    private container!: HTMLElement;
    private saveTimeout: number | null = null;

    constructor(
        private model: Model,
        private onInputChanged?: (value: number) => void,
        private onUpTick?: () => void,
        private onDownTick?: () => void
    ) {
        this.init();
    }

    private init(): void {
        // Use the existing control-container from HTML
        const existingContainer = document.getElementById('control-container');
        if (existingContainer) {
            this.container = existingContainer;
            // Clear any existing content
            this.container.innerHTML = '';
        } else {
            // Fallback: create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.className = 'container';
            document.body.appendChild(this.container);
        }
        
        // Try to use Azure DevOps native component classes
        this.container.className = 'bolt-textfield-container';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.gap = '4px';
        this.container.style.overflow = 'visible';
        this.container.style.width = '100%';
        this.container.style.minWidth = '200px';
        this.container.style.maxWidth = 'none';
        this.container.style.height = 'auto';
        this.container.style.minHeight = '24px';
        this.container.style.padding = '2px';
        this.container.style.boxSizing = 'border-box';
        this.container.style.scrollbarWidth = 'none';
        (this.container.style as any).msOverflowStyle = 'none';
        this.container.style.padding = '8px';
        
        // Aggressively prevent scrollbars
        this.container.style.scrollbarWidth = 'none';
        (this.container.style as any).msOverflowStyle = 'none';

        // Create the main input using ADO classes
        const inputGroup = document.createElement('div');
        inputGroup.className = 'bolt-textfield';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'bolt-textfield-input';
        input.inputMode = 'numeric';
        input.pattern = '[0-9]*';
        this.currentValue = String(this.model.getCurrentValue());
        input.value = this.currentValue;
        input.setAttribute('aria-valuenow', this.currentValue);
        
        // Add input validation and events
        input.addEventListener('input', (evt) => {
            const target = evt.target as HTMLInputElement;
            // Only allow numbers
            target.value = target.value.replace(/[^0-9]/g, '');
            this.inputChangedWithDebounce();
        });
        
        input.addEventListener('keydown', (evt) => {
            if (evt.key === 'ArrowUp') {
                evt.preventDefault();
                this.handleKeyDown(evt);
            } else if (evt.key === 'ArrowDown') {
                evt.preventDefault();
                this.handleKeyDown(evt);
            }
            // Allow: backspace, delete, tab, escape, enter
            if ([46, 8, 9, 27, 13].indexOf(evt.keyCode) !== -1 ||
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (evt.keyCode === 65 && evt.ctrlKey === true) ||
                (evt.keyCode === 67 && evt.ctrlKey === true) ||
                (evt.keyCode === 86 && evt.ctrlKey === true) ||
                (evt.keyCode === 88 && evt.ctrlKey === true)) {
                return;
            }
            // Ensure that it's a number and stop the keypress
            if ((evt.shiftKey || (evt.keyCode < 48 || evt.keyCode > 57)) && (evt.keyCode < 96 || evt.keyCode > 105)) {
                evt.preventDefault();
            }
        });
        
        input.addEventListener('change', () => this.inputChanged());
        input.addEventListener('blur', () => this.inputChanged());
        
        inputGroup.appendChild(input);

        // Create buttons using ADO button classes
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'bolt-button-group';
        buttonGroup.style.display = 'flex';
        buttonGroup.style.flexDirection = 'row';
        
        // Decrement button
        const decrementBtn = document.createElement('button');
        decrementBtn.type = 'button';
        decrementBtn.className = 'bolt-button bolt-button-subtle';
        decrementBtn.textContent = '−';
        decrementBtn.title = 'Decrement value';
        decrementBtn.style.minWidth = '32px';
        decrementBtn.style.padding = '4px 8px';
        decrementBtn.addEventListener('click', () => {
            if (this.onDownTick) {
                this.onDownTick();
            }
        });
        
        // Increment button
        const incrementBtn = document.createElement('button');
        incrementBtn.type = 'button';
        incrementBtn.className = 'bolt-button bolt-button-subtle';
        incrementBtn.textContent = '+';
        incrementBtn.title = 'Increment value';
        incrementBtn.style.minWidth = '32px';
        incrementBtn.style.padding = '4px 8px';
        incrementBtn.addEventListener('click', () => {
            if (this.onUpTick) {
                this.onUpTick();
            }
        });
        
        buttonGroup.appendChild(decrementBtn);
        buttonGroup.appendChild(incrementBtn);

        // Assemble the UI
        this.container.appendChild(inputGroup);
        this.container.appendChild(buttonGroup);
        
        // Remove scrollbars from parent containers after a short delay
        setTimeout(() => {
            this.removeScrollbarsFromParents();
        }, 100);
    }
    
    private removeScrollbarsFromParents(): void {
        // Find and modify parent containers that might have scrollbars
        let parent = this.container.parentElement;
        while (parent) {
            if (parent.style) {
                parent.style.overflow = 'visible';
                parent.style.scrollbarWidth = 'none';
                (parent.style as any).msOverflowStyle = 'none';
                parent.style.width = '100%';
                parent.style.maxWidth = 'none';
                parent.style.minWidth = '260px';
                parent.style.boxSizing = 'border-box';
            }
            
            // Stop at certain container types to avoid affecting too much
            if (parent.classList.contains('work-item-form') || 
                parent.classList.contains('tab-content') ||
                parent.tagName.toLowerCase() === 'body') {
                break;
            }
            
            parent = parent.parentElement;
        }
    }

    private handleKeyDown(evt: KeyboardEvent): void {
        if (evt.key === 'ArrowUp') {
            if (this.onUpTick) {
                this.onUpTick();
                evt.preventDefault();
            }
        } else if (evt.key === 'ArrowDown') {
            if (this.onDownTick) {
                this.onDownTick();
                evt.preventDefault();
            }
        }
    }

    private inputChanged(): void {
        const input = this.container.querySelector('input') as HTMLInputElement;
        const newValue = Number(input.value);
        if (this.onInputChanged && !isNaN(newValue)) {
            this.onInputChanged(newValue);
        }
    }

    private inputChangedWithDebounce(): void {
        // Clear any existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set a new timeout to save after 500ms of no typing
        this.saveTimeout = setTimeout(() => {
            this.inputChanged();
            this.saveTimeout = null;
        }, 500);
    }

    public update(value: number): void {
        this.currentValue = String(value);
        const input = this.container.querySelector('input') as HTMLInputElement;
        if (input) {
            input.value = this.currentValue;
        }
    }

    public cleanup(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}
