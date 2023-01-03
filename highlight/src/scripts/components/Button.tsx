import { h } from "../hooks/h";
import { Dispatchable, MaybeVNode } from "hyperapp";

export const Button = (
  {
    onClick,
    isDefault,
    disabled = false,
    large = false,
  }: {
    onClick: Dispatchable<any, any>;
    isDefault?: boolean;
    disabled?: boolean;
    large?: boolean;
  },
  ...children: (MaybeVNode<any> | string | number)[]
) =>
  h(
    <button
      disabled={disabled}
      class={
        "border text-sm font-normal rounded-md shadow-sm disabled:text-slate-500 disabled:bg-slate-50 disabled:hover:bg-slate-50 " +
        (large ? "px-4 py-2 " : "px-2 py-1 ") +
        (isDefault
          ? "border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700")
      }
      onclick={onClick}
    >
      {children}
    </button>
  );
