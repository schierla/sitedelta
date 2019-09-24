window.addEventListener("contextmenu", e => { e.preventDefault(); return false; });
document.querySelector("#configure").addEventListener("click", e => {document.body.classList.remove("expand"); tabUtils.openResource("manage.htm"); });

document.querySelector("#pages").addEventListener("contextmenu", e => {document.body.classList.toggle("expand"); })
document.querySelector("#expand").addEventListener("click", e => document.body.classList.toggle("expand"));
document.querySelector("#pages").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#scannow").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#markseen").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#delete").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#open").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#watchdelay").addEventListener("click", e => document.body.classList.remove("expand"));