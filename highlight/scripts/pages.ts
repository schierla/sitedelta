window.addEventListener("contextmenu", e => { e.preventDefault(); return false; });

(document.querySelector("#expand") as HTMLElement).addEventListener("click", e => {
    if(chrome.webNavigation) document.body.classList.add("advancedEnabled");
    document.body.classList.toggle("expand");
});

(document.querySelector("#configure") as HTMLElement).addEventListener("click", e => { tabUtils.openResource("manage.htm"); document.body.classList.remove("expand")});
(document.querySelector("#pages") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#delete") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#open") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#scannow") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));

