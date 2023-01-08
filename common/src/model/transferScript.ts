function addImportButton(scope: string, name: string) {
    var target = document.querySelector("#" + scope) as HTMLTextAreaElement;
    var container = document.querySelector("#" + scope + "-import");
    if(!container || !target) return;
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(name));
    button.addEventListener("click", e => {
        chrome.runtime.sendMessage(
            { 
                command: "transferImport", 
                scope: scope, 
                data: target.value 
            }, 
            message => { alert(message); }
        );
    });
    container.appendChild(button);
}

function addExportButton(scope: string, name: string) {
    var target = document.querySelector("#" + scope) as HTMLTextAreaElement;
    var container = document.querySelector("#" + scope + "-export");
    if(!target || !container) return;
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(name));
    button.addEventListener("click", e => {
        chrome.runtime.sendMessage(
            { 
                command: "transferExport", 
                scope: scope 
            },
            data => { target.value = data; }
        );
    });
    container.appendChild(button);
}

export const runTransferScript = () => {
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
}