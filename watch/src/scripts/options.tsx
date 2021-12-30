import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";

import { render, h } from "preact";
import { Button, t } from "./ui";

const Content = () => (
  <Button isDefault onClick={() => tabUtils.openResource("manage.htm")}>
    {t("pagesConfiguration")}
  </Button>
);

render(h(Content, {}), document.body);
