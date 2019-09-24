function addImportButton(scope, name) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(name));
    button.addEventListener("click", e => {
        chrome.runtime.sendMessage({ command: "transferImport", scope: scope, data: document.querySelector("#" + scope).value }, message => {
            alert(message);
        });
    });
    document.querySelector("#" + scope + "-import").appendChild(button);
}

function addExportButton(scope, name) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(name));
    button.addEventListener("click", e => {
        chrome.runtime.sendMessage({ command: "transferExport", scope: scope }, data => {
            document.querySelector("#" + scope).value = data;
        });
    });
    document.querySelector("#" + scope + "-export").appendChild(button);
}

chrome.runtime.sendMessage({ command: "transferInfo" }, caps => {
    if(document.body.classList.contains(caps.id)) return;
    if (caps.import.indexOf("config") >= 0) addImportButton("config", caps.name);
    if (caps.import.indexOf("pages") >= 0) addImportButton("pages", caps.name);
    if (caps.import.indexOf("presets") >= 0) addImportButton("presets", caps.name);
    if (caps.export.indexOf("config") >= 0) addExportButton("config", caps.name);
    if (caps.export.indexOf("pages") >= 0) addExportButton("pages", caps.name);
    if (caps.export.indexOf("presets") >= 0) addExportButton("presets", caps.name);
    document.body.classList.add(caps.id);
});
