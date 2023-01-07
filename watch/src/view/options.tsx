import { openResource } from "@sitedelta/common/src/model/tabUtils";
import { observeIndex, Index } from "@sitedelta/common/src/model/ioUtils";
import { Button } from "@sitedelta/common/src/view/Button";
import { t } from "@sitedelta/common/src/view/helpers";
import { app, Subscription, Action, Dispatch } from "hyperapp";
import { PageList } from "./PageList";
import "../tailwind.css";

type State = { index: Index; selectedPages: string[] };

const SetIndex: Action<State, Index> = (state, index) => ({ ...state, index });

const SetSelection: Action<State, string[]> = (state, selectedPages) => ({
  ...state,
  selectedPages,
});

const NoOp: Action<State> = (state) => state;

const OpenConfiguration: Action<State> = (state) => [
  state,
  [openPage, "manage.htm"],
];

function openPage(_: Dispatch<State>, name: string) {
  openResource(name);
}

const indexSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    return observeIndex((index) =>
      requestAnimationFrame(() => dispatch([SetIndex, index]))
    );
  },
  {},
];

const Content = ({ selectedPages, index }: State) => (
  <body class="flex flex-col gap-2 my-4 mx-4">
    <div class="font-semibold">{t("pagesList")}:</div>
    <PageList
      sortOrder="title"
      selectedPages={selectedPages}
      index={index}
      SetSelection={SetSelection}
      OnDblClick={NoOp}
    />
    <Button isDefault large onClick={OpenConfiguration}>
      {t("pagesConfiguration")}
    </Button>
  </body>
);

app({
  init: { index: {}, selectedPages: [] },
  view: (state) => <Content {...state} />,
  node: document.body,
  subscriptions: () => [indexSubscription],
});
