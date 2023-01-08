import { VNode } from "hyperapp";

export const ConfigSection = (
  { label }: { label: string },
  ...children: VNode<any>[]
) => [<div class="mt-2 font-semibold">{label}</div>, ...children];
