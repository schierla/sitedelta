import * as pageUtils from "./pageUtils";
import * as textUtils from "./textUtils";

// watch operations
export async function loadPage(
  url: string,
  documentParser: (content: string) => Document
): Promise<
  | { status: "success"; document: Document }
  | { status: "error" }
  | { status: "redirect"; url: string }
> {
  var page = await _downloadPage(url);
  return await _parsePage(
    url,
    page.mime,
    page.content,
    page.location,
    documentParser
  );
}

export async function adaptDelay(url: string, changes: number): Promise<void> {
  var config = await pageUtils.getEffectiveConfig(url);
  if (config === null) return;
  if (config.watchDelay < 0) {
    if (changes == 0)
      config.watchDelay = Math.round(
        (config.watchDelay * config.autoDelayPercent) / 100
      );
    else
      config.watchDelay = Math.round(
        (config.watchDelay / config.autoDelayPercent) * 100
      );

    if (config.watchDelay < -config.autoDelayMax)
      config.watchDelay = -config.autoDelayMax;
    if (config.watchDelay > -config.autoDelayMin)
      config.watchDelay = -config.autoDelayMin;
    await pageUtils.setConfigProperty(url, "watchDelay", config.watchDelay);
  }
}

export async function setChanges(url: string, changes: number): Promise<void> {
  await pageUtils.setChanges(url, changes);
  var config = await pageUtils.getEffectiveConfig(url);
  if (config === null) return;

  if (changes <= 0) {
    var next = Date.now() + Math.abs(config.watchDelay) * 60 * 1000;
    if (config.watchDelay == 0) next = 0;
    await pageUtils.setNextScan(url, next);
  } else {
    await pageUtils.setNextScan(url, 0);
  }
}

export async function scanPage(
  url: string,
  documentParser: (content: string) => Document
): Promise<number> {
  var config = await pageUtils.getEffectiveConfig(url);
  if (config === null) return -1;
  var doc = await loadPage(url, documentParser);
  if (doc.status !== "success") {
    await setChanges(url, -1);
    return -1;
  }
  var newContent = textUtils.getText(doc.document, config);
  if (newContent === null) {
    await setChanges(url, -1);
    return -1;
  }
  var oldContent = await pageUtils.getContent(url);
  if (oldContent === null) {
    await setChanges(url, -1);
    return -1;
  }
  if (!textUtils.isEqual(oldContent, newContent, config)) {
    await setChanges(url, 1);
    return 1;
  } else {
    await setChanges(url, 0);
    return 0;
  }
}

export async function markSeen(
  url: string,
  documentParser: (content: string) => Document
): Promise<void> {
  var config = await pageUtils.getEffectiveConfig(url);
  if (config === null) return;
  var doc = await loadPage(url, documentParser);
  if (doc.status !== "success") {
    await setChanges(url, -1);
    return;
  }
  var newContent = textUtils.getText(doc.document, config);
  if (newContent !== null) await pageUtils.setContent(url, newContent);
  await setChanges(url, 0);
}

async function _downloadPage(url: string): Promise<{
  mime: string;
  content: Uint8Array | null;
  location: string | null;
}> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "Cache-Control": "max-age=0" },
    });
    if (!response.ok || !response.body || !response.headers)
      return {
        mime: `error/${response.status}`,
        content: null,
        location: null,
      };
    if (response.redirected)
      return { mime: `error/302`, content: null, location: response.url };

    const content = new Uint8Array(await response.arrayBuffer());
    return { mime: response.type, content: content, location: null };
  } catch (e) {
    return { mime: `error/0`, content: null, location: null };
  }
}

async function _parsePage(
  url: string,
  mime: string,
  content: Uint8Array | null,
  location: string | null,
  documentParser: (content: string) => Document
): Promise<
  | { status: "success"; document: Document }
  | { status: "error" }
  | { status: "redirect"; url: string }
> {
  if (location !== null) {
    console.log(`Redirected ${url} to ${location}`);
    return { status: "redirect", url: location };
  }
  if (content === null) {
    console.log(`Error loading ${url}: ${mime}`);
    return { status: "error" };
  }

  if (mime.toLowerCase().indexOf("charset=") > 0) {
    const charset = mime
      .toLowerCase()
      .substring(mime.toLowerCase().indexOf("charset=") + "charset=".length);
    const text = new TextDecoder(charset).decode(content);
    return { status: "success", document: documentParser(text) };
  } else {
    const tempText = new TextDecoder("utf-8").decode(content);
    const tempDoc = documentParser(tempText);
    const metas = tempDoc.getElementsByTagName("meta");
    for (let i = 0; i < metas.length; i++) {
      const meta = metas.item(i);
      if (meta?.getAttribute("charset")) {
        const text = new TextDecoder(
          meta.getAttribute("charset") ?? "utf-8"
        ).decode(content);
        return { status: "success", document: documentParser(text) };
      }
      const httpEquiv = meta?.getAttribute("http-equiv");
      const metaContent = meta?.getAttribute("content");
      if (
        httpEquiv &&
        httpEquiv.toLowerCase() == "content-type" &&
        metaContent
      ) {
        if (metaContent.toLowerCase().indexOf("charset=") > 0) {
          const charset = metaContent
            .toLowerCase()
            .substring(
              metaContent.toLowerCase().indexOf("charset=") + "charset=".length
            );
          const text = new TextDecoder(charset).decode(content);
          return { status: "success", document: documentParser(text) };
        }
      }
    }
    return { status: "success", document: tempDoc };
  }
}
