import { Button } from "@sitedelta/common/src/view/Button";
import * as pageUtils from "@sitedelta/common/src/model/pageUtils";
import { t } from "@sitedelta/common/src/view/helpers";
import { Dispatch } from "hyperapp";

function ChangePageUrl<S>(
  state: S,
  { url, newUrl }: { url: string; newUrl: string }
) {
  return [state, [changePageUrl, { url, newUrl }]];
}

async function changePageUrl<S>(
  _: Dispatch<S>,
  { url, newUrl }: { url: string; newUrl: string }
) {
  const config = await pageUtils.getConfig(url);
  const title = await pageUtils.getTitle(url);
  const status = await pageUtils.getStatus(url);
  const content = await pageUtils.getContent(url);
  await pageUtils.create(newUrl, title);
  await pageUtils.setConfig(newUrl, config);
  await pageUtils.setStatus(newUrl, status);
  await pageUtils.setContent(newUrl, content);
  await pageUtils.remove(url);
  window.location.search = newUrl;
}

export function RedirectScreen<S>({
  url,
  newUrl,
}: {
  url: string;
  newUrl: string;
}) {
  return (
    <div
      class="absolute inset-0 bg-gray-50 dark:bg-slate-900 dark:text-slate-200  flex flex-col items-center justify-center"
      id="permissionRequired"
    >
      <div class="text-center bg-white border-slate-400/20 dark:bg-slate-800 dark:text-slate-200 rounded-lg shadow-lg dark:shadow-black/20 m-10 max-w-lg w-2/3 px-4 py-2">
        <h1 class="font-semibold text-lg my-2 text-gray-900 dark:text-slate-200">{url}</h1>
        <div class="text-sm text-slate-600 dark:text-slate-400 my-2">{t("pageRedirectedTo")}</div>
        <div><a class="text-gray-900 dark:text-slate-200" href={newUrl} target="_blank">{newUrl}</a></div>
        <div class="mb-2 mt-6">
          <Button
            isDefault
            onClick={[ChangePageUrl, { url, newUrl }]}
            large
          >
            {t("pageFollowRedirect")}
          </Button>
        </div>
      </div>
    </div>
  );
}
