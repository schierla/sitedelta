import { Config } from "./config";
import { Status } from "./ioUtils";
import * as ioUtils from "./ioUtils";
import * as configUtils from "./configUtils";

// page operations
export async function list(): Promise<string[]> {
	return await ioUtils.findInIndex((url, status) => url);
}

export async function listChanged(): Promise<string[]> {
	return await ioUtils.findInIndex((url, status) => status.changes === undefined || status.changes <= 0 ? null : url);
}

export async function listFailed(): Promise<string[]> {
	return await ioUtils.findInIndex((url, status) => status.changes === undefined || status.changes >= 0 ? null : url);
}

export async function getStatus(url: string): Promise<Status | null> {
	var result = await ioUtils.findInIndex((furl, fstatus) => (url == furl ? fstatus : null));
	return result.length > 0 ? result[0] : null;
}

export async function getChanges(url: string): Promise<number> {
	var status = await getStatus(url);
	return status !== null && status.changes !== undefined ? status.changes : 0;
}

export async function getNextScan(url: string): Promise<number> {
	var status = await getStatus(url);
	return status !== null && status.nextScan !== undefined ? status.nextScan : Date.now() + 60000;
}

export async function getTitle(url: string): Promise<string | null> {
	var status = await getStatus(url);
	if (status === null) return null;
	if (status.title !== undefined)
		return status.title;
	else {
		var title = await ioUtils.get(url, "title");
		await setTitle(url, title);
		return title;
	}
}

export async function getContent(url: string): Promise<string> {
	return await ioUtils.get(url, "content") as string;
}

export async function getConfig(url: string): Promise<Partial<Config>> {
	return await ioUtils.get(url, "config") as Partial<Config>;
}

export async function getEffectiveConfig(url: string): Promise<Config | null> {
	var config = await getConfig(url);
	if (config === null) return null;
	return await configUtils.getEffectiveConfig(config);
}

export async function getEffectiveConfigProperty<K extends keyof Config>(url: string, property: K): Promise<Config[K] | null> {
	var config = await getEffectiveConfig(url);
	if(config == null) return null; else return config[property];
}

export async function getOrCreateEffectiveConfig(url: string, title?: string): Promise<Config> {
	var config = await getEffectiveConfig(url);
	if (config === null) {
		await create(url, title);
		return await getEffectiveConfig(url) as Config;
	} else {
		return config;
	}
}

export async function create(url: string, title?: string): Promise<void> {
	var pagetitle = (title ?? "").replace(/[\n\r]/g, ' ');
	var config = await configUtils.getPresetConfig(url);
	await setStatus(url, { "title": title });
	await setTitle(url, pagetitle);
	await setConfig(url, config);
}

export async function remove(url: string): Promise<void> {
	await ioUtils.remove(url);
}

export async function setStatus(url: string, status: Status): Promise<void> {
	await ioUtils.setInIndex(url, status);
}

export async function setStatusKey<K extends keyof Status>(url: string, key: K, value: Status[K]): Promise<void> {
	var status = await getStatus(url);
	if (status === null) status = {};
	if (key in status && status[key] == value) return;
	status[key] = value; 
	await setStatus(url, status);
}

export async function setNextScan(url: string, nextScan: number): Promise<void> {
	await setStatusKey(url, "nextScan", nextScan);
}

export async function setChanges(url: string, changes: number): Promise<void> {
	await setStatusKey(url, "changes", changes);
}

export async function setTitle(url: string, title: string): Promise<void> {
	await ioUtils.put(url, "title", title);
	await setStatusKey(url, "title", title);
}

export async function setContent(url: string, content: string): Promise<void> {
	await ioUtils.put(url, "content", content);
}

export async function setConfig(url: string, config: Partial<Config>): Promise<void> {
	await ioUtils.put(url, "config", config);
}

export async function setConfigProperty<K extends keyof Config>(url: string, property: K, value: Config[K]): Promise<void> {
	var config = await getConfig(url);
	config[property] = value; 
	await setConfig(url, config);
}

export async function removeInclude(url: string, region: string): Promise<void> {
	var includes = await getEffectiveConfigProperty(url, "includes") as string[];
	var newlist: string[] = [];
	for (var i = 0; i < includes.length; i++) {
		if (includes[i] != region) newlist.push(includes[i]);
	}
	if (newlist.length == 0) newlist.push("/html/body[1]");
	await setConfigProperty(url, "includes", newlist);
}

export async function removeExclude(url: string, region: string): Promise<void> {
	var excludes = await getEffectiveConfigProperty(url, "excludes") as string[];
	var newlist: string[] = [];
	for (var i = 0; i < excludes.length; i++) {
		if (excludes[i] != region) newlist.push(excludes[i]);
	}
	await setConfigProperty(url, "excludes", newlist);
}

export async function addInclude(url: string, xpath: string): Promise<void> {
	if (xpath === null) return;
	var includes = await getEffectiveConfigProperty(url, "includes") as string[];
	var newlist: string[] = [];
	for (var i = 0; i < includes.length; i++) {
		if (includes[i] != "/html/body[1]") newlist.push(includes[i]);
	}
	newlist.push(xpath);
	await setConfigProperty(url, "includes", newlist);
}

export async function addExclude(url: string, xpath: string): Promise<void> {
	if (xpath === null) return;
	var excludes = await getEffectiveConfigProperty(url, "excludes") as string[];
	var newlist: string[] = [];
	for (var i = 0; i < excludes.length; i++) {
		newlist.push(excludes[i]);
	}
	newlist.push(xpath);
	await setConfigProperty(url, "excludes", newlist);
}

