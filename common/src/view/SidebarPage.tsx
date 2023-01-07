import { VNode } from "hyperapp";

export const SidebarPage = (
  { label, key }: { label: string; key: string },
  ...children: VNode<any>[]
) => {
  return (
    <div key={key} label={label}>
      <h1 class="mb-4 text-xl">{label}</h1>
      <div class="flex flex-col gap-4">{children}</div>
    </div>
  );
};
