import { Index, observeIndex } from "@sitedelta/common/src/model/ioUtils";
import { openResource } from "@sitedelta/common/src/model/tabUtils";
import { Button } from "@sitedelta/common/src/view/Button";
import { ExpandIcon } from "@sitedelta/common/src/view/ExpandIcon";
import { t } from "@sitedelta/common/src/view/helpers";
import {
  MenuItem,
  MenuSeparator,
  PopupMenu,
  showPopupMenu,
} from "@sitedelta/common/src/view/PopupMenu";
import { SearchIcon } from "@sitedelta/common/src/view/SearchIcon";
import { Action, app, Dispatch, Effecter, Subscription } from "hyperapp";
import { PageList, PageSortOrder } from "./PageList";
import { getActions, openPages } from "./PageListActions";

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

type State = {
  index: Index;
  isContextMenu: boolean;
  selectedPages: string[];
  filter: string;
  sortOrder: PageSortOrder;
  advancedPermission: boolean;
};

const SetSortOrder: Action<State, PageSortOrder> = (state, sortOrder) => [
  { ...state, sortOrder },
];

const SetIndex: Action<State, Index> = (state, index) => [{ ...state, index }];

const SetSelection: Action<State, string[]> = (state, selectedPages) => [
  { ...state, selectedPages },
];

const SetFilter: Action<State, string> = (state, filter) => ({
  ...state,
  filter,
});

function virtualElement(pos: { x: number; y: number }) {
  return { getBoundingClientRect: () => new DOMRect(pos.x, pos.y, 0, 0) };
}

const ShowMenuAtElement: Action<State, HTMLElement> = (state, element) => [
  { ...state, isContextMenu: false },
  checkAdvancedPermission,
  [showPopupMenu, element],
];

const ShowMenuAtPosition: Action<State, { x: number; y: number }> = (
  state,
  pos
) => [
  { ...state, isContextMenu: true },
  checkAdvancedPermission,
  [showPopupMenu, virtualElement(pos)],
];

const SetAdvancedPermission: Action<State, boolean> = (
  state,
  advancedPermission
) => ({ ...state, advancedPermission });

const OpenConfiguration: Action<State> = (state) => [
  { ...state, expanded: false },
  [openPage, "manage.htm"],
];

const OpenPages: Action<State, string[]> = (state, pages) => [
  state,
  [openPages, { pages, SetSelection }],
];

function openPage(_: Dispatch<State>, name: string) {
  openResource(name);
}

const checkAdvancedPermission: Effecter<State> = (dispatch) => {
  var advancedPermission = { permissions: [], origins: ["<all_urls>"] };
  if (chrome.permissions) {
    chrome.permissions.contains(advancedPermission, (success) => {
      requestAnimationFrame(() => dispatch([SetAdvancedPermission, success]));
    });
  }
};

const indexSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    return observeIndex((index) =>
      requestAnimationFrame(() => dispatch([SetIndex, index]))
    );
  },
  {},
];

document.title = t("highlightExtensionName");

function Content({
  index,
  isContextMenu,
  selectedPages,
  sortOrder,
  filter,
  advancedPermission,
}: State) {
  const actions = getActions(
    index,
    selectedPages,
    advancedPermission,
    SetSelection
  );
  return (
    <body class="font-sans text-sm flex flex-row h-screen dark:bg-slate-900">
      <div class="flex flex-col gap-1 p-1 border-r border-r-gray-300 dark:border-r-gray-600 border-r-1 flex-1">
        <div class="flex flex-row flex-0 gap-1">
          <div class="relative rounded-sm shadow-sm flex-1">
            <div class="pointer-events-none absolute inset-y-0 left-0 pl-1 flex items-center">
              <SearchIcon />
            </div>
            <input
              class="block w-full h-full rounded-md border-gray-300 dark:bg-slate-800 dark:border-gray-600 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
              value={filter}
              oninput={(_, event: Event) => [
                SetFilter,
                "" + (event.target as HTMLInputElement).value,
              ]}
              placeholder={t("pagesFilter")}
              autofocus
            />
          </div>
          <div id="popupButton">
            <Button
              onClick={[
                ShowMenuAtElement,
                document.getElementById("popupButton"),
              ]}
            >
              <ExpandIcon />
            </Button>
          </div>
        </div>
        <PageList
          index={index}
          filter={filter}
          sortOrder={sortOrder}
          selectedPages={selectedPages}
          SetSelection={SetSelection}
          OnDblClick={[OpenPages, selectedPages]}
          OnContextMenu={(_, e: MouseEvent) => [
            ShowMenuAtPosition,
            { x: e.clientX, y: e.clientY },
          ]}
        />
        <PopupMenu>
          {isContextMenu || [
            <li class="flex items-stretch flex-col px-2 py-1">
              {t("pagesSort")}
            </li>,
            <MenuItem
              checked={sortOrder === "title"}
              onClick={(_) => [SetSortOrder, "title"]}
              label={t("pagesSortTitle")}
            />,
            <MenuItem
              checked={sortOrder === "url"}
              onClick={(_) => [SetSortOrder, "url"]}
              label={t("pagesSortUrl")}
            />,
            <MenuItem
              checked={sortOrder === "status"}
              onClick={(_) => [SetSortOrder, "status"]}
              label={t("pagesSortStatus")}
            />,
            <MenuSeparator />,
          ]}

          {actions.map(([title, action]) => (
            <MenuItem onClick={action} label={title} />
          ))}

          {actions.length > 0 && <MenuSeparator />}
          <MenuItem
            onClick={OpenConfiguration}
            label={t("pagesConfiguration")}
          />
        </PopupMenu>
      </div>
    </body>
  );
}

app<State>({
  init: {
    index: {},
    isContextMenu: false,
    advancedPermission: false,
    filter: "",
    selectedPages: [],
    sortOrder: "title",
  },
  view: (state) => <Content {...state} />,
  node: document.body,
  subscriptions: () => [indexSubscription],
});
