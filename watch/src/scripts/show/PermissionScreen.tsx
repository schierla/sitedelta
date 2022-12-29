import { FunctionComponent, h } from "preact";
import { Button } from "../components/Button";
import { t } from "../hooks/UseTranslation";
// import "./PermissionScreen.css";

export const PermissionScreen: FunctionComponent<{
  url: string;
  onGranted: (granted: boolean) => void;
}> = ({ url, onGranted }) => (
  <div
    class="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center"
    id="permissionRequired"
  >
    <div class="text-center bg-white border-slate-400/20 rounded-lg shadow-lg m-10 max-w-md px-4 py-2">
      <h1 class="font-semibold text-lg my-2 text-gray-900">
        {new URL(url).origin}
      </h1>
      <div class="text-sm text-gray-500 my-2">{t("pageRequirePermission")}</div>
      <div class="my-2">
        <Button
          isDefault
          onClick={() =>
            chrome.permissions.request({ origins: [url] }, onGranted)
          }
        >
          {t("pageGrantHost")}
        </Button>
      </div>
      <div class="my-2">
        <Button
          onClick={() =>
            chrome.permissions.request({ origins: ["<all_urls>"] }, onGranted)
          }
        >
          {t("pageGrantAll")}
        </Button>
      </div>
    </div>
  </div>
);
