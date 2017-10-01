if ("onMessageExternal" in chrome.runtime) {
    chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
        if (sender.id == "sitedelta-watch@schierla.de" ||
            sender.id == "sitedelta-highlight@schierla.de" ||
            sender.id == "eb1debe5-b520-48b6-8242-6deed7ecd0eb" ||
            sender.id == "42f46382-33c5-4728-9bec-a9a2e0c6397a") {
            chrome.runtime.sendMessage(message, function (reply) {
                if (!reply) console.log(chrome.runtime.lastError);
                callback(reply);
            });
            return true;
        } else {
            console.warn("SiteDelta: Disallowed access from '" + sender.id + "' for '" + message + "'");
            return false;
        }
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command == "transferInfo") {
        sendResponse({ name: "SiteDelta", id: "sitedelta", import: [], export: ["config", "pages", "presets"] });
    } else if (request.command == "transferExport") {
        chrome.runtime.sendMessage(request.scope + "Export", function (reply) {
            if (!reply) console.log(chrome.runtime.lastError);
            sendResponse(reply);
        });
        return true;
    }
});

