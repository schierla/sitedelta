import { h } from "../hooks/h";
import { VNode } from "hyperapp";

export const ConfigSection = (
  { label }: { label: string },
  ...children: VNode<any>[]
) => [
  h(<div style={{ fontWeight: 600, marginTop: "8px" }}>{label}</div>),
  ...children,
];
