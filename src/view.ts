import { Model } from "./model";

export class View {
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
        
        // Style the container for better layout
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.gap = '8px';
        this.container.style.padding = '8px';

        // Create input wrapper
        const wrap = document.createElement('div');
        wrap.className = 'wrap combo emptyBorder';
        wrap.style.display = 'inline-block';
        wrap.style.marginRight = '8px';
        wrap.style.verticalAlign = 'top';

        // Create number input
        const input = document.createElement('input');
        input.type = 'number';
        this.currentValue = String(this.model.getCurrentValue());
        input.value = this.currentValue;
        input.setAttribute('aria-valuenow', this.currentValue);
        
        // Style the input to be bigger and remove scrolling
        input.style.fontSize = '16px';
        input.style.height = '40px';
        input.style.width = '100px';
        input.style.padding = '8px 12px';
        input.style.textAlign = 'center';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';
        input.style.outline = 'none';
        input.style.boxSizing = 'border-box';
        
        // Disable mouse wheel scrolling on the input
        input.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            // Optionally, you could still allow increment/decrement with wheel
            // if (evt.deltaY < 0 && this.onUpTick) this.onUpTick();
            // else if (evt.deltaY > 0 && this.onDownTick) this.onDownTick();
        });
        
        // Prevent arrow keys from changing the value when not focused
        input.addEventListener('keydown', (evt) => {
            if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
                this.handleKeyDown(evt);
            }
        });

        // Add event listeners
        input.addEventListener('change', () => this.inputChanged());
        input.addEventListener('input', () => this.inputChangedWithDebounce());
        input.addEventListener('blur', () => this.inputChanged());

        wrap.appendChild(input);

        // Create increment button
        const uptick = document.createElement('div');
        uptick.className = 'bowtie-icon bowtie-math-plus-box';
        uptick.style.display = 'block';
        uptick.style.cursor = 'pointer';
        uptick.style.fontSize = '24px';
        uptick.style.color = '#666';
        uptick.style.padding = '4px';
        uptick.style.userSelect = 'none';
        uptick.style.border = '1px solid #ccc';
        uptick.style.borderRadius = '3px';
        uptick.style.textAlign = 'center';
        uptick.style.lineHeight = '1';
        uptick.style.width = '30px';
        uptick.style.height = '30px';
        uptick.style.backgroundColor = '#f8f9fa';
        uptick.title = 'Increment value';
        
        // Fallback text if icon doesn't load
        if (!uptick.textContent) {
            uptick.textContent = '+';
            uptick.style.fontWeight = 'bold';
        }
        
        uptick.addEventListener('click', () => {
            if (this.onUpTick) {
                this.onUpTick();
            }
        });

        // Create decrement button
        const downtick = document.createElement('div');
        downtick.className = 'bowtie-icon bowtie-math-minus-box';
        downtick.style.display = 'block';
        downtick.style.cursor = 'pointer';
        downtick.style.fontSize = '24px';
        downtick.style.color = '#666';
        downtick.style.padding = '4px';
        downtick.style.userSelect = 'none';
        downtick.style.border = '1px solid #ccc';
        downtick.style.borderRadius = '3px';
        downtick.style.textAlign = 'center';
        downtick.style.lineHeight = '1';
        downtick.style.width = '30px';
        downtick.style.height = '30px';
        downtick.style.backgroundColor = '#f8f9fa';
        downtick.title = 'Decrement value';
        
        // Fallback text if icon doesn't load
        if (!downtick.textContent) {
            downtick.textContent = '-';
            downtick.style.fontWeight = 'bold';
        }
        
        downtick.addEventListener('click', () => {
            if (this.onDownTick) {
                this.onDownTick();
            }
        });

        // Add hover effects
        this.container.addEventListener('mouseenter', () => {
            wrap.classList.add('border');
        });

        this.container.addEventListener('mouseleave', () => {
            if (document.activeElement !== input) {
                wrap.classList.remove('border');
            }
        });

        // Add hover effects for buttons
        uptick.addEventListener('mouseenter', () => {
            uptick.style.backgroundColor = '#e6e6e6';
            uptick.style.borderColor = '#999';
        });
        uptick.addEventListener('mouseleave', () => {
            uptick.style.backgroundColor = '#f8f9fa';
            uptick.style.borderColor = '#ccc';
        });

        downtick.addEventListener('mouseenter', () => {
            downtick.style.backgroundColor = '#e6e6e6';
            downtick.style.borderColor = '#999';
        });
        downtick.addEventListener('mouseleave', () => {
            downtick.style.backgroundColor = '#f8f9fa';
            downtick.style.borderColor = '#ccc';
        });

        // Assemble the UI
        this.container.appendChild(wrap);
        this.container.appendChild(downtick);
        this.container.appendChild(uptick);
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
