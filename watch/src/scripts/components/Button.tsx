import { FunctionComponent, h, Ref } from "preact";

export const Button: FunctionComponent<{
  onClick: () => void;
  isDefault?: boolean;
  disabled?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}> = ({ onClick, isDefault, disabled = false, children, buttonRef }) => (
  <button
    ref={buttonRef}
    disabled={disabled}
    class={
      "border px-2 py-1 text-sm font-medium rounded-md shadow-sm disabled:text-slate-500 disabled:bg-slate-50 disabled:hover:bg-slate-50" +
      (isDefault
        ? "border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
    }
    onClick={onClick}
  >
    {children}
  </button>
);
