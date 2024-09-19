import Component from "./ModuLatte/Component.js"

export default class Toast extends Component {

    constructor(message, type = 'success', title = '') {
        super()
        this.message = message
        this.title = title
        this.type = type

        document.body.appendChild(this.element())

        //delete the toast after 3 seconds
        setTimeout(() => {
            this.element().remove()
        }, 3000)
    }

    html() {
        return html
            .replace('{{ title }}', this.title)
            .replace('{{ message }}', this.message)
            .replace('{{ type }}', this.type)
    }

    style() {
        return style
    }
}

//language=HTML
const html = `
<div class="toast fade-out {{ type }}">
    <div class="toast-title">{{ title }}</div>
    <div class="toast-message">{{ message }}</div>
</div>
`

//language=CSS
const style = `
.toast {
    z-index: 50000;
    position: absolute;
    top: 1vh;
    left: 20vw;
    width: 60vw;
    min-height: 10px;

    background-color: var(--background, lightgray);
    border-radius: 3px;
    border: 1px solid var(--foreground, black);
    box-shadow: 3px 3px 10px 0 rgba(0, 0, 0, 0.5);
}

.toast.success {
    background-color: var(--success, darkseagreen);
    color: var(--success-text, black);
}

.toast.error {
    background-color: var(--error, indianred);
    color: var(--error-text, black);
}

.toast-title {
    font-size: 1em;
    text-align: center;
    margin: 3PX;
    background-color: var(--foreground, black);
    color: var(--background, lightgray);
}

.toast-message {
    font-size: 1em;
    font-weight: bold;
    text-align: center;
    margin: 0.5em;
}

.fade-out {
    opacity: 0;
    animation-name: fade-out-delayed;
    animation-duration: 2s;
    animation-iteration-count: 1;
}

@keyframes fade-out-delayed {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
`
