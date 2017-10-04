window.addEventListener("contextmenu", e => { e.preventDefault(); return false; });


document.querySelector("#expand").addEventListener("click", e => document.body.classList.toggle("expand"));
document.querySelector("#pages").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#scannow").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#markseen").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#delete").addEventListener("click", e => document.body.classList.remove("expand"));
document.querySelector("#open").addEventListener("click", e => document.body.classList.remove("expand"));