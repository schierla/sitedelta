namespace transferUtils {

    interface PageExport {
        url: string;
        title: string;
        content: string,
        includes?: string[];
        excludes?: string[];
        checkDeleted?: boolean;
        scanImages?: boolean;
        ignoreCase?: boolean;
        ignoreNumbers?: boolean;
        watchDelay?: number;
    };

    export async function importConfig(config: Partial<Config>, hiddenFields: string[]) {
        var oldConfig = await configUtils.getDefaultConfig();
        var update = {};
        var imported = 0, skipped = 0;
        for (var key in config) {
            if (hiddenFields.indexOf(key) >= 0) continue;
            if (key in oldConfig) {
                if (oldConfig[key] == config[key]) {
                    skipped++;
                } else {
                    update[key] = config[key];
                    imported++;
                }
            }
        }
        await configUtils.setDefaultConfigProperties(update);
        return {imported: imported, skipped: skipped};
    }

    export async function importPages(pages: PageExport[]) {
        var imported = 0, skipped = 0;
        for(var i=0; i<pages.length; i++) {
            var page = pages[i];
            var config = await pageUtils.getConfig(page.url);
            if (config !== null) {
                skipped++; 
                continue; 
            }
            await pageUtils.create(page.url, page.title);
            var settings = { };
            if (page.includes !== undefined) settings["includes"] = page.includes;
            if (page.excludes !== undefined) settings["excludes"] = page.excludes;
            if (page.checkDeleted !== undefined) settings["checkDeleted"] = page.checkDeleted;
            if (page.scanImages !== undefined) settings["scanImages"] = page.scanImages;
            if (page.ignoreCase !== undefined) settings["ignoreCase"] = page.ignoreCase;
            if (page.ignoreNumbers !== undefined) settings["ignoreNumbers"] = page.ignoreNumbers;
            if (page.watchDelay !== undefined) settings["watchDelay"] = page.watchDelay;
            
            await pageUtils.setConfig(page.url, settings);
            await pageUtils.setContent(page.url, page.content);
            await pageUtils.setChanges(page.url, -1);
            imported++;
        }
        return {imported: imported, skipped: skipped};
    }
    
    export async function exportConfig(hiddenFields: string[]): Promise<Partial<Config>> {
        var config = await configUtils.getDefaultConfig();
        var send = {};
        for (var key in config) {
            if (hiddenFields.indexOf(key) >= 0) continue;
            send[key] = config[key];
        }
        return send;
    }

    export async function exportPages(): Promise<Partial<PageExport>[]> {
        var urls = await pageUtils.list();
        var pages: Partial<PageExport>[] = [];
        for(var i=0; i<urls.length; i++) {
            var url = urls[i];
            var title = await pageUtils.getTitle(url) as string;
            var config = await pageUtils.getConfig(url);
            var content = await pageUtils.getContent(url);
            var page = { url: url, title: title, content: content };
            for (var key in config) {
                page[key] = config[key];
            }
            pages.push(page);
        }
        return pages;
    }
}