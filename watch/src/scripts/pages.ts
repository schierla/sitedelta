import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { i18n } from "@sitedelta/common/src/scripts/uiUtils";
import { loadPageList } from "./pageList";

window.addEventListener("contextmenu", e => { e.preventDefault(); return false; });
(document.querySelector("#configure") as HTMLElement).addEventListener("click", e => {document.body.classList.remove("expand"); tabUtils.openResource("manage.htm"); });

(document.querySelector("#pages") as HTMLElement).addEventListener("contextmenu", e => {document.body.classList.toggle("expand"); });
(document.querySelector("#expand") as HTMLElement).addEventListener("click", e => document.body.classList.toggle("expand"));
(document.querySelector("#pages") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#scannow") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#markseen") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#delete") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#open") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));
(document.querySelector("#watchdelay") as HTMLElement).addEventListener("click", e => document.body.classList.remove("expand"));

loadPageList();
i18n();