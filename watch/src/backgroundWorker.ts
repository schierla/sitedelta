import querySelectorAll from "query-selector";
import { parse as p5parse } from "parse5";
import { serializeToString as xmlSerializeToString } from "xmlserializer";
import { evaluate as xpathEvaluate } from "xpath";
import { DOMParser as XMLDOMParser } from "@xmldom/xmldom";
import { runBackgroundScript } from "./background";

const documentParser = (content: string): Document => {
  const p5doc = p5parse(content);
  const xml = xmlSerializeToString(p5doc);
  const document = new XMLDOMParser().parseFromString(xml, "text/xml");
  const namespaceShortcut = "x",
    xmlNamespace = "http://www.w3.org/1999/xhtml";
  document.evaluate = (
    expression: string,
    contextNode: Node,
    resolver?: XPathNSResolver,
    type?: number,
    result?: XPathResult
  ) => {
    const extendedResolver = {
      lookupNamespaceURI: (prefix: string) =>
        prefix === namespaceShortcut
          ? xmlNamespace
          : typeof resolver === "function"
          ? resolver(prefix)
          : resolver?.lookupNamespaceURI
          ? resolver.lookupNamespaceURI(prefix)
          : "",
    };
    const shouldPrefix = (expression: string) => {
      if (expression.length === 0) return false;
      if (expression.startsWith("..")) return false;
      if (expression.indexOf("(") >= 0 && expression.indexOf("[") === -1)
        return false;
      return true;
    };
    const extendedExpression = expression
      .split("/")
      .map((x) => (shouldPrefix(x) ? `${namespaceShortcut}:${x}` : x))
      .join("/"); // expression.replace(/(\/+)([^/]+(\[[^/]+])?)?/g, `$1${namespaceShortcut}:$2`);
    return xpathEvaluate(
      extendedExpression,
      contextNode,
      extendedResolver,
      type,
      result
    );
  };
  document.querySelectorAll = (selector: string) =>
    querySelectorAll(selector, document.documentElement);
  document.compareDocumentPosition = (other: Node) =>
    other.ownerDocument === document ? 20 : 1;
  document.lastChild.compareDocumentPosition = (other: Node) =>
    other.ownerDocument === document ? 20 : 1;
  return document;
};

runBackgroundScript(documentParser);