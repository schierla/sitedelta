import * as watchUtils from "@sitedelta/common/src/scripts/watchUtils";
import { useEffect, useState } from "preact/hooks";
import { LoadStatus, documentParser } from "../show";

export const useDocument: (
  url: string | undefined,
  setStatus: (status: LoadStatus) => void
) => Document | undefined = (url, setStatus) => {
  const [doc, setDoc] = useState<Document>();

  useEffect(() => {
    (async () => {
      if (url) {
        setDoc(undefined);
        setStatus("loading");
        var doc = await watchUtils.loadPage(url, documentParser);
        if (doc === null) {
          setStatus("failed");
          return;
        }
        var base = doc.createElement("base");
        base.setAttribute("href", url);
        var existingbase = doc.querySelector("base[href]") as HTMLBaseElement;
        if (existingbase && existingbase.parentNode) {
          existingbase.parentNode.removeChild(existingbase);
          base.setAttribute(
            "href",
            new URL(existingbase.getAttribute("href") || "", url).href
          );
        }
        doc.head.insertBefore(base, doc.head.firstChild);
        setDoc(doc);
        setStatus("loaded");
      }
    })();
  }, [url]);

  return doc;
};
