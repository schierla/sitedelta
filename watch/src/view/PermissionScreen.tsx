import { Button } from "@sitedelta/common/src/view/Button";
import { t } from "@sitedelta/common/src/view/helpers";
import { Action, Dispatch } from "hyperapp";

function RequestPermission<S>(
  state: S,
  props: { url: string; OnGranted: Action<S, boolean> }
) {
  return [state, [requestPermission, props]];
}

function requestPermission<S>(
  dispatch: Dispatch<S>,
  { url, OnGranted }: { url: string; OnGranted: Action<S, boolean> }
) {
  chrome.permissions.request({ origins: [url] }, (granted) =>
    requestAnimationFrame(() => dispatch([OnGranted, granted]))
  );
}

export function PermissionScreen<S>({
  url,
  OnGranted,
}: {
  url: string;
  OnGranted: Action<S, boolean>;
}) {
  return (
    <div
      class="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center"
      id="permissionRequired"
    >
      <div class="text-center bg-white border-slate-400/20 rounded-lg shadow-lg m-10 max-w-md px-4 py-2">
        <h1 class="font-semibold text-lg my-2 text-gray-900">
          {new URL(url).origin}
        </h1>
        <div class="text-sm text-gray-500 my-2">
          {t("pageRequirePermission")}
        </div>
        <div class="my-2">
          <Button
            isDefault
            onClick={[RequestPermission, { url: url, OnGranted }]}
            large
          >
            {t("pageGrantHost")}
          </Button>
        </div>
        <div class="my-2">
          <Button
            onClick={[RequestPermission, { url: "<all_urls>", OnGranted }]}
            large
          >
            {t("pageGrantAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
