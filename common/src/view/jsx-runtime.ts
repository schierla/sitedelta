import { h as hyperH, MaybeVNode, text, VNode } from "hyperapp";

type SingleChild = string | number | MaybeVNode<any>;
type Child = SingleChild | Child[];

function flattenAll(input: Child | undefined, result: SingleChild[] = []) {
  if (Array.isArray(input)) input.forEach((x: any) => flattenAll(x, result));
  else if (input !== undefined) result.push(input);
  return result;
}

function h<S>(
  type: string | ((props: any, ...children: any[]) => VNode<S>),
  { children, ...props }: Record<string, any> & { children?: Child },
  key: string
): VNode<S> {
  return typeof type === "function"
    ? type({ ...props, key }, flattenAll(children))
    : hyperH<S>(
        type,
        { ...props, key },
        flattenAll(children).map((child) =>
          typeof child === "string" || typeof child === "number"
            ? text(child)
            : child
        )
      );
}

export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;
