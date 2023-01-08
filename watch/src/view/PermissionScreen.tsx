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
      class="absolute inset-0 bg-gray-50 dark:bg-slate-900 dark:text-slate-200 flex flex-col items-center justify-center"
      id="permissionRequired"
    >
      <div class="text-center bg-white border-slate-400/20 dark:bg-slate-800 dark:text-slate-200 rounded-lg shadow-lg dark:shadow-black/20 m-10 max-w-md px-4 py-2">
        <h1 class="font-semibold text-lg my-2 text-gray-900 dark:text-slate-200">
          {new URL(url).origin}
        </h1>
        <div class="text-sm text-slate-600 dark:text-slate-400 my-2">
          {t("pageRequirePermission")}
        </div>
        <div class="mb-2 mt-6">
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
