const Utils = {
    showMessage(message, type = 'success') {
        const container = document.createElement('div');
        container.className = 'flash-messages';
        container.innerHTML = `
            <div class="flash-message flash-${type}">
                ${message}
                <button class="flash-close" onclick="this.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 3000);
    }
}