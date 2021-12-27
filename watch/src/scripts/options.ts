import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { i18n } from "@sitedelta/common/src/scripts/uiUtils";

(document.querySelector("#options") as HTMLElement).addEventListener("click", (e) => {
    tabUtils.openResource("manage.htm");
});

i18n();