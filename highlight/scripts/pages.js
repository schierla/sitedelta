window.addEventListener("contextmenu", e => { e.preventDefault(); return false; });

document.querySelector("#expand").addEventListener("click", e => {
    if(chrome.webNavigation) document.body.classList.add("advancedEnabled");
    document.body.classList.toggle("expand");
});
document.querySelector("#pages").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#delete").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#open").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#scannow").addEventListener("click", e => document.body.classList.remove("expand"));

