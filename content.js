

let scanningEnabled = true;

const patterns = {
    nin: /\b[A-Z]{2}\d{6}[A-Z]?\b/g, 
    phoneNumber: /\b(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g, 
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
    address: /\b\d+\s[A-Za-z]+\s[A-Za-z]+(?:,\s[A-Za-z]+)?\b/g,
    postcode: /\b[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}\b/g 
};

function redactSensitiveData(text) {
    let redactedText = text;
    for (const type in patterns) {
        redactedText = redactedText.replace(patterns[type], "[MASKED]"); 
    }
    return redactedText;
}

function scanAndRedact(element) {
    if (!element || !element.isConnected) return;

    if (element.nodeType === Node.TEXT_NODE) {
        let originalText = element.textContent;
        let redactedText = redactSensitiveData(originalText);

        if (originalText !== redactedText) {
            let newNode = document.createTextNode(redactedText);
            element.replaceWith(newNode);
        }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
        for (const child of [...element.childNodes]) {
            scanAndRedact(child);
        }

        if (element.shadowRoot) {
            scanAndRedact(element.shadowRoot);
        }

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.value = "[MASKED]";
            element.setAttribute("data-original-value", "[MASKED]");

            Object.defineProperty(element, "value", {
                get: function () { return "[MASKED]"; },
                set: function () {}
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get("scanningEnabled", function (data) {
        scanningEnabled = data.scanningEnabled ?? true;
        if (scanningEnabled) {
            scanAndRedact(document.body);
        }
    });

    setTimeout(() => scanAndRedact(document.body), 1000); // Ensures late-loaded content is re-scanned
});

const observer = new MutationObserver((mutations) => {
    if (!scanningEnabled) return;
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.isConnected) {
                scanAndRedact(node);
            }
        });

        scanAndRedact(document.body); // Re-check document after updates
    }
});

observer.observe(document.body, { childList: true, subtree: true, characterData: true });

document.querySelectorAll("input[type='hidden']").forEach(input => {
    input.value = "[MASKED]";
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.scanningEnabled !== undefined) {
        scanningEnabled = message.scanningEnabled;
        if (scanningEnabled) {
            scanAndRedact(document.body);
        }
        sendResponse({ status: "Scanning updated" });
    }
});
