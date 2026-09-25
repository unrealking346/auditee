/*
 * WAEVE UTILITIES
 * Build: 0.1.0
 */

const WaeveUtils = {

    escapeHTML(value) {

        const element =
            document.createElement("div");

        element.textContent =
            String(value);

        return element.innerHTML;

    },


    getElement(selector) {

        return document.querySelector(
            selector
        );

    },


    getElements(selector) {

        return document.querySelectorAll(
            selector
        );

    }

};