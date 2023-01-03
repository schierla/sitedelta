import { h } from "../hooks/h";
import { Action, ElementVNode } from "hyperapp";
import { Button } from "./Button";

export const SidebarPages = (
  {
    SelectTab,
    selectedTab,
  }: {
    SelectTab: Action<any, string>;
    selectedTab: string;
  },
  children: ElementVNode<any>[]
) => {
  selectedTab = selectedTab == "" ? "" + children[0].key : selectedTab;
  return [
    h(
      <div class="flex flex-col basis-80 pt-16 pr-4 pb-2 pl-12 gap-4">
        {children.map((c) => (
          <Button
            isDefault={c.key === selectedTab}
            onClick={() => [SelectTab, c.key]}
            large
          >
            {c.props.label}
          </Button>
        ))}
      </div>
    ),
    h(
      <div class="flex flex-col flex-1 pt-16 pr-12 pb-2 pl-2 gap-2">
        {children.filter((c) => c.key === selectedTab)}
      </div>
    ),
  ];
};
