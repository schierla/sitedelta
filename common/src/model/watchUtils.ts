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
    return { mime: response.headers.get("content-type") ?? "text/html", content: content, location: null };
  } catch (e) {
    return { mime: `error/0`, content: null, location: null };
  }
}

function _getCharsetFromContentType(contentType: string): string | undefined {
  for (const part of contentType.toLowerCase().split(";")) {
    const [key, value] = part.split("=");
    if (key.trim() === "charset") {
      return value?.trim().replace(/^\"(.*)\"$/, "$1");
    }
  }
  return undefined;
}

async function _parsePage(
  url: string,
  contentType: string,
  data: Uint8Array | null,
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
  if (data === null) {
    console.log(`Error loading ${url}: ${contentType}`);
    return { status: "error" };
  }

  const charset = _getCharsetFromContentType(contentType);
  if (charset) {
    try {
      const text = new TextDecoder(charset, { ignoreBOM: true }).decode(data);
      return { status: "success", document: documentParser(text) };
    } catch (e) {}
  } else if (data[0] == 0xef && data[1] == 0xbb && data[2] == 0xbf) {
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(data);
    return { status: "success", document: documentParser(text) };
  } else if (data[0] == 0xfe && data[1] == 0xff) {
    const text = new TextDecoder("utf-16be", { ignoreBOM: true }).decode(data);
    return { status: "success", document: documentParser(text) };
  } else if (data[0] == 0xff && data[1] == 0xfe) {
    const text = new TextDecoder("utf-16le", { ignoreBOM: true }).decode(data);
    return { status: "success", document: documentParser(text) };
  } else {
    const sniffText = new TextDecoder("ascii").decode(data.slice(0, 1024));
    const sniffDoc = documentParser(sniffText);
    const metas = sniffDoc.getElementsByTagName("meta");
    for (let i = 0; i < metas.length; i++) {
      const meta = metas.item(i);
      const charset = meta?.getAttribute("charset");
      if (charset) {
        try {
          const text = new TextDecoder(charset).decode(data);
          return { status: "success", document: documentParser(text) };
        } catch (e) {}
      }
      const httpEquiv = meta?.getAttribute("http-equiv");
      const metaContent = meta?.getAttribute("content");
      if (
        httpEquiv &&
        httpEquiv.toLowerCase() == "content-type" &&
        metaContent
      ) {
        const metaCharset = _getCharsetFromContentType(metaContent);
        if (metaCharset) {
          try {
            const text = new TextDecoder(metaCharset).decode(data);
            return { status: "success", document: documentParser(text) };
          } catch (e) {}
        }
      }
    }
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
    return { status: "success", document: documentParser(text) };
  } catch (e) {
    const text = new TextDecoder("ascii").decode(data);
    return { status: "success", document: documentParser(text) };
  }
}
