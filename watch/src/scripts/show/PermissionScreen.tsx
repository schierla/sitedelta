import { FunctionComponent, h } from "preact";
import { Button } from "../components/Button";
import { t } from "../hooks/UseTranslation";
import "./PermissionScreen.css";

export const PermissionScreen: FunctionComponent<{
  url: string;
  onGranted: (granted: boolean) => void;
}> = ({ url, onGranted }) => (
  <div className="maximized" id="permissionRequired">
    <div id="url">{new URL(url).origin}</div>
    <div>{t("pageRequirePermission")}</div>
    <Button
      onClick={() => chrome.permissions.request({ origins: [url] }, onGranted)}
    >
      {t("pageGrantHost")}
    </Button>
    <Button
      onClick={() =>
        chrome.permissions.request({ origins: ["<all_urls>"] }, onGranted)
      }
    >
      {t("pageGrantAll")}
    </Button>
  </div>
);
