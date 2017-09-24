browser.runtime.onMessageExternal.addListener(function(message, sender, callback) {
    if(sender.id == "sitedelta-watch@schierla.de" || 
        sender.id == "sitedelta-highlight@schierla.de" || 
        sender.id == "eb1debe5-b520-48b6-8242-6deed7ecd0eb" ||
        sender.id == "42f46382-33c5-4728-9bec-a9a2e0c6397a") {
        browser.runtime.sendMessage(message).then(reply => {
            callback(reply);
        }, error => {
            console.warn("Error: " + error);
            callback(null);
        });
    } else {
        console.warn("SiteDelta: Disallowed access from '" + sender.id + "' for '" + message + "'");
    }
});