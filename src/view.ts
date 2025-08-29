import { Model } from "./model";

export class View {
    private currentValue: string = "";
    private container!: HTMLElement;

    constructor(
        private model: Model,
        private onInputChanged?: (value: number) => void,
        private onUpTick?: () => void,
        private onDownTick?: () => void
    ) {
        this.init();
    }

    private init(): void {
        // Remove any existing container
        const existingContainer = document.querySelector('.container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'container';

        // Create input wrapper
        const wrap = document.createElement('div');
        wrap.className = 'wrap combo emptyBorder';

        // Create number input
        const input = document.createElement('input');
        input.type = 'number';
        this.currentValue = String(this.model.getCurrentValue());
        input.value = this.currentValue;
        input.setAttribute('aria-valuenow', this.currentValue);

        // Add event listeners
        input.addEventListener('change', () => this.inputChanged());
        input.addEventListener('keydown', (evt) => this.handleKeyDown(evt));

        wrap.appendChild(input);

        // Create increment button
        const uptick = document.createElement('div');
        uptick.className = 'bowtie-icon bowtie-math-plus-box';
        uptick.style.display = 'none';
        uptick.addEventListener('click', () => {
            if (this.onUpTick) {
                this.onUpTick();
            }
        });

        // Create decrement button
        const downtick = document.createElement('div');
        downtick.className = 'bowtie-icon bowtie-math-minus-box';
        downtick.style.display = 'none';
        downtick.addEventListener('click', () => {
            if (this.onDownTick) {
                this.onDownTick();
            }
        });

        // Add hover effects
        this.container.addEventListener('mouseenter', () => {
            wrap.classList.add('border');
            downtick.style.display = 'block';
            uptick.style.display = 'block';
        });

        this.container.addEventListener('mouseleave', () => {
            if (document.activeElement !== input) {
                wrap.classList.remove('border');
                downtick.style.display = 'none';
                uptick.style.display = 'none';
            }
        });

        // Assemble the UI
        this.container.appendChild(wrap);
        this.container.appendChild(downtick);
        this.container.appendChild(uptick);

        // Add to document
        document.body.appendChild(this.container);
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

    public update(value: number): void {
        this.currentValue = String(value);
        const input = this.container.querySelector('input') as HTMLInputElement;
        if (input) {
            input.value = this.currentValue;
        }
    }
}
