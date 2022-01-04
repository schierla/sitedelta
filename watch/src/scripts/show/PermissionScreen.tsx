import { FunctionComponent, h } from "preact";
import { Button } from "../components/Button";
import { t } from "../hooks/UseTranslation";
import "./PermissionScreen.css";

export const PermissionScreen: FunctionComponent<{
  url: string;
  onGranted: (granted: boolean) => void;
}> = ({ url, onGranted }) => (
  <div className="maximized" id="permissionRequired">
    <div class="card">
      <h1>{new URL(url).origin}</h1>
      <div>{t("pageRequirePermission")}</div>
      <Button
        isDefault
        onClick={() =>
          chrome.permissions.request({ origins: [url] }, onGranted)
        }
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
  </div>
);
