import { Config } from "./config";
import * as pageUtils from "./pageUtils";
import * as textUtils from "./textUtils";

// watch operations
export async function loadPage<T>(
  url: string,
  contentExtractor: (content: string) => Promise<T | null> | T | null,
  charsetSniffer: (content: string) => Promise<string[]> | string[]
): Promise<
  | { status: "success"; content: T | null }
  | { status: "error" }
  | { status: "redirect"; url: string }
> {
  var page = await _downloadPage(url);
  return await _parsePage(
    url,
    page.mime,
    page.content,
    page.location,
    contentExtractor,
    charsetSniffer
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
  textExtractor: (content: string, config: Config) => Promise<string | null> | string | null,
  charsetSniffer: (content: string) => Promise<string[]> | string[]
): Promise<number> {
  const potentialConfig = await pageUtils.getEffectiveConfig(url);
  if (potentialConfig === null) return -1;
  const config = potentialConfig;
  const contentExtractor = (content: string) => textExtractor(content, config);
  var doc = await loadPage(url, contentExtractor, charsetSniffer);
  if (doc.status !== "success") {
    await setChanges(url, -1);
    return -1;
  }
  var newContent = doc.content;
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
  textExtractor: (content: string, config: Config) => Promise<string | null> | string | null,
  charsetSniffer: (content: string) => Promise<string[]> | string[] 
): Promise<void> {
  const potentialConfig = await pageUtils.getEffectiveConfig(url);
  if (potentialConfig === null) return;
  const config = potentialConfig;
  var contentExtractor = (content: string) => textExtractor(content, config);
  var doc = await loadPage(url, contentExtractor, charsetSniffer);
  if (doc.status !== "success") {
    await setChanges(url, -1);
    return;
  }
  var newContent = doc.content;
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

async function _parsePage<T>(
  url: string,
  contentType: string,
  data: Uint8Array | null,
  location: string | null,
  contentExtractor: (content: string) => Promise<T | null> | T | null,
  charsetSniffer: (content: string) => Promise<string[]> | string[]
): Promise<
  | { status: "success"; content: T | null }
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

  const charset = textUtils.getCharsetFromContentType(contentType);
  if (charset) {
    try {
      const text = new TextDecoder(charset, { ignoreBOM: true }).decode(data);
      return { status: "success", content: await contentExtractor(text) };
    } catch (e) {}
  } else if (data[0] == 0xef && data[1] == 0xbb && data[2] == 0xbf) {
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(data);
    return { status: "success", content: await contentExtractor(text) };
  } else if (data[0] == 0xfe && data[1] == 0xff) {
    const text = new TextDecoder("utf-16be", { ignoreBOM: true }).decode(data);
    return { status: "success", content: await contentExtractor(text) };
  } else if (data[0] == 0xff && data[1] == 0xfe) {
    const text = new TextDecoder("utf-16le", { ignoreBOM: true }).decode(data);
    return { status: "success", content: await contentExtractor(text) };
  } else {
    const sniffText = new TextDecoder("ascii").decode(data.slice(0, 1024));
    const charsets = await charsetSniffer(sniffText);
    for(const charset of charsets) {
      try {
        const text = new TextDecoder(charset).decode(data);
        return { status: "success", content: await contentExtractor(text) };
      } catch (e) {}
    }
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
    return { status: "success", content: await contentExtractor(text) };
  } catch (e) {
    const text = new TextDecoder("ascii").decode(data);
    return { status: "success", content: await contentExtractor(text) };
  }
}
