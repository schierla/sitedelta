import { h } from "../hooks/h";
import { VNode } from "hyperapp";
import { h as hyperH } from "hyperapp";

export const SidebarPage = (
  { label, key }: { label: string; key: string },
  ...children: VNode<any>[]
) => {
  return hyperH("div", { key, label }, [
    h(<h1 class="mb-4 text-xl">{label}</h1>),
    h(<div class="flex flex-col gap-4">{children}</div>),
  ]);
};
