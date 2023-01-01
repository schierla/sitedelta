import { h } from "./hooks/h";
import { t } from "./hooks/t";
import { app } from "hyperapp";
import { Button } from "./components/Button";
import { openResource } from "@sitedelta/common/src/scripts/tabUtils";
import "../tailwind.css";

const Content = () => (
  <body>
    <Button isDefault={true} onClick={() => openResource("manage.htm")}>
      {t("pagesConfiguration")}
    </Button>
  </body>
);

app({ init: undefined, view: (state) => h(<Content />), node: document.body });
