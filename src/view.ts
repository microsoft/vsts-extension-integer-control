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
        
        // Use the original container styling - much more minimal but with flexbox
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.paddingLeft = '1px';
        this.container.style.overflow = 'hidden';
        this.container.style.overflowX = 'hidden';
        this.container.style.overflowY = 'hidden';
        this.container.style.maxWidth = '100%';
        this.container.style.boxSizing = 'border-box';
        
        // Prevent scrolling on the entire container as well
        this.container.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }, { passive: false });

        // Create input wrapper
        const wrap = document.createElement('div');
        wrap.className = 'wrap combo emptyBorder';
        wrap.style.flexGrow = '1';
        
        // Prevent scrolling on the wrapper as well
        wrap.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }, { passive: false });

        // Create number input
        const input = document.createElement('input');
        input.type = 'number';
        this.currentValue = String(this.model.getCurrentValue());
        input.value = this.currentValue;
        input.setAttribute('aria-valuenow', this.currentValue);
        
        // More aggressive approach to disable scrolling - simplified
        const preventScroll = (evt: Event) => {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        };
        
        // Disable mouse wheel scrolling on the input
        input.addEventListener('wheel', preventScroll, { passive: false });
        
        // Handle keydown for arrow keys - but don't prevent them, just control them
        input.addEventListener('keydown', (evt) => {
            if (evt.key === 'ArrowUp') {
                evt.preventDefault(); // Prevent native increment
                this.handleKeyDown(evt); // Use our custom handler
            } else if (evt.key === 'ArrowDown') {
                evt.preventDefault(); // Prevent native decrement
                this.handleKeyDown(evt); // Use our custom handler
            }
        });

        // Add event listeners
        input.addEventListener('change', () => this.inputChanged());
        input.addEventListener('input', () => this.inputChangedWithDebounce());
        input.addEventListener('blur', () => this.inputChanged());

        wrap.appendChild(input);

        // Create increment button - make it smaller and more subtle
        const uptick = document.createElement('div');
        uptick.className = 'bowtie-icon bowtie-math-plus-box';
        uptick.style.display = 'inline-block';
        uptick.style.cursor = 'pointer';
        uptick.style.fontSize = '12px';
        uptick.style.color = '#666';
        uptick.style.padding = '2px';
        uptick.style.userSelect = 'none';
        uptick.style.marginLeft = '4px';
        uptick.style.verticalAlign = 'middle';
        uptick.title = 'Increment value';
        
        // Fallback text if icon doesn't load - smaller
        if (!uptick.textContent) {
            uptick.textContent = '+';
            uptick.style.fontWeight = 'bold';
            uptick.style.fontSize = '10px';
        }
        
        uptick.addEventListener('click', () => {
            if (this.onUpTick) {
                this.onUpTick();
            }
        });

        // Create decrement button - make it smaller and more subtle
        const downtick = document.createElement('div');
        downtick.className = 'bowtie-icon bowtie-math-minus-box';
        downtick.style.display = 'inline-block';
        downtick.style.cursor = 'pointer';
        downtick.style.fontSize = '12px';
        downtick.style.color = '#666';
        downtick.style.padding = '2px';
        downtick.style.userSelect = 'none';
        downtick.style.marginLeft = '4px';
        downtick.style.verticalAlign = 'middle';
        downtick.title = 'Decrement value';
        
        // Fallback text if icon doesn't load - smaller
        if (!downtick.textContent) {
            downtick.textContent = '-';
            downtick.style.fontWeight = 'bold';
            downtick.style.fontSize = '10px';
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

        // Add hover effects for buttons - more subtle
        uptick.addEventListener('mouseenter', () => {
            uptick.style.color = '#333';
        });
        uptick.addEventListener('mouseleave', () => {
            uptick.style.color = '#666';
        });

        downtick.addEventListener('mouseenter', () => {
            downtick.style.color = '#333';
        });
        downtick.addEventListener('mouseleave', () => {
            downtick.style.color = '#666';
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
