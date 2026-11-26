import "@testing-library/jest-dom/vitest";

// Provide dialog methods when they are unavailable in jsdom.
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
    HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute("open", "");
    };
}

if (typeof HTMLDialogElement.prototype.close !== "function") {
    HTMLDialogElement.prototype.close = function () {
        this.removeAttribute("open");
    };
}