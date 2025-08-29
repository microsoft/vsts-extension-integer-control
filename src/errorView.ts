export class ErrorView {
    constructor(error: string | Error) {
        const container = document.createElement('div');
        container.className = 'container';

        const warning = document.createElement('p');
        warning.textContent = typeof error === 'string' ? error : error.message;
        warning.title = typeof error === 'string' ? error : error.message;
        container.appendChild(warning);

        const help = document.createElement('p');
        help.textContent = 'See ';
        
        const link = document.createElement('a');
        link.href = 'https://docs.microsoft.com/en-us/azure/devops/extend/';
        link.target = '_blank';
        link.textContent = 'Documentation.';
        
        help.appendChild(link);
        container.appendChild(help);

        // Clear body and add error message
        document.body.innerHTML = '';
        document.body.appendChild(container);
    }
}
