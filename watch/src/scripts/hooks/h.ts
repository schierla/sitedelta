import { h as hyperH, MaybeVNode, text, VNode } from "hyperapp";

type SingleChild = string | number | MaybeVNode<any>;
type Child = SingleChild | Child[];

function flattenAll(input: Child[], result: SingleChild[] = []) {
  input.forEach((x: any) => {
    if (Array.isArray(x)) flattenAll(x, result);
    else result.push(x);
  });
  return result;
}

export function h<S>(
  type: VNode<S> | string | ((props: any, ...children: any[]) => VNode<S>),
  props?: any,
  ...children: Child[]
): VNode<S> {
  return typeof type === "object"
    ? type
    : typeof type === "function"
    ? type(props, flattenAll(children))
    : hyperH<S>(
        type,
        props || {},
        flattenAll(children).map((child) =>
          typeof child === "string" || typeof child === "number"
            ? text(child)
            : child
        )
      );
}
