import * as pageUtils from "./pageUtils";
import * as watchUtils from "./watchUtils";
import * as textUtils from "./textUtils";

// watch operations
export async function loadPage(
  url: string,
  documentParser: (content: string) => Document,
  progress?: (loaded: number, total: number) => void
): Promise<Document | null> {
  var page = await _downloadPage(url, progress);
  return await _parsePage(url, page.mime, page.content, documentParser);
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
  var doc = await watchUtils.loadPage(url, documentParser);
  if (doc === null) {
    await watchUtils.setChanges(url, -1);
    return -1;
  }
  var newContent = textUtils.getText(doc, config);
  if (newContent === null) {
    await watchUtils.setChanges(url, -1);
    return -1;
  }
  var oldContent = await pageUtils.getContent(url);
  if (oldContent === null) {
    await watchUtils.setChanges(url, -1);
    return -1;
  }
  if (!textUtils.isEqual(oldContent, newContent, config)) {
    await watchUtils.setChanges(url, 1);
    return 1;
  } else {
    await watchUtils.setChanges(url, 0);
    return 0;
  }
}

export async function markSeen(
  url: string,
  documentParser: (content: string) => Document
): Promise<void> {
  var config = await pageUtils.getEffectiveConfig(url);
  if (config === null) return;
  var doc = await watchUtils.loadPage(url, documentParser);
  if (doc === null) {
    await watchUtils.setChanges(url, -1);
    return;
  }
  var newContent = textUtils.getText(doc, config);
  if (newContent !== null) await pageUtils.setContent(url, newContent);
  await watchUtils.setChanges(url, 0);
}

async function _downloadPage(
  url: string,
  progress?: (loaded: number, total: number) => void
): Promise<{ mime: string; content: Uint8Array | null }> {
  try {
    const response = await fetch(url, {
      redirect: "error",
      headers: { "Cache-Control": "max-age=0" },
    });
    if (!response.ok || !response.body || !response.headers)
      return { mime: `error/${response.status}`, content: null };
    const reader = response?.body?.getReader();
    const total = parseInt(response?.headers?.get("Content-Length") ?? "0");
    let loaded = 0,
      chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
      }
      if (total != 0) progress?.(loaded, total);
    }

    let content = new Uint8Array(loaded);
    let position = 0;
    for (let chunk of chunks) {
      content.set(chunk, position);
      position += chunk.length;
    }

    return { mime: response.type, content: content };
  } catch (e) {
    return { mime: `error/0`, content: null };
  }
}

async function _parsePage(
  url: string,
  mime: string,
  content: Uint8Array | null,
  documentParser: (content: string) => Document
): Promise<Document | null> {
  if (content === null) {
    console.log("Error loading " + url + ": " + mime);
    return null;
  }

  if (mime.toLowerCase().indexOf("charset=") > 0) {
    const charset = mime
      .toLowerCase()
      .substring(mime.toLowerCase().indexOf("charset=") + "charset=".length);
    const text = new TextDecoder(charset).decode(content);
    return documentParser(text);
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
        return documentParser(text);
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
          return documentParser(text);
        }
      }
    }
    return tempDoc;
  }
}
