import '@chenyfan/cache-db'
import tarball from './src/tarball.js'
//import { ungzip } from "pako" //Too Big
import templatecdn from "./template/cdn.js"
import parallel_fetch from "./src/parallel_fetch.js"
!(() => {
    const CDNObject = function (config = {}) {
        this.config = Object.keys(config).length ? config : {
            cdn: config.cdn ? Object.assign({}, templatecdn, config.cdn) : templatecdn,
            cache: config.cache ? config.cache : { LatestExpire: 60 * 60 * 24, UnuseExpire: 60 * 60 * 24 * 30 } //未使用配置
        }
        this.CacheDB = (prefix) => { return new CacheDB('CDNObject', prefix) }
        const that = this
        const CDNInstance = function (url) {
            this.valid = false;
            if (!(typeof url === 'string' || typeof url === 'object')) throw new Error('Invalid URL')
            this.url = url
            this.urlObject = new URL(url)
            this.id = that.config.cdn.findIndex(item => { return new RegExp(item.match).test(url) })
            if (this.id === -1) throw new Error('CDN Not Found:' + url)
            for (var type in that.config.cdn[this.id].concat) {
                this.matchRule = new RegExp(
                    that.config.cdn[this.id]
                        .concat[type]
                        .replace(/\{\{\$(.*)\}\}/g, '(?<$1>.*)')
                        .replace(/\{\{(.*?)\}\}/g, '(?<$1>[^\/\@]+)')
                        .replace(/\//g, '\\/')
                )
                if (!!url.match(this.matchRule)) {
                    this.type = type
                    break
                }
            }
            if (!this.type) throw new Error('CDN Prefix Not Found:' + url)
            this.domain = that.config.cdn[this.id].domain
            this.var = url.match(this.matchRule).groups
            this.valid = true



            this.genMirror = (domain) => {
                const gid = that.config.cdn.findIndex(item => { return item.domain === domain })
                if (gid === -1) throw new Error('CDN Mirror Not Found')
                if (!that.config.cdn[gid].concat[this.type]) throw new Error('This Mirror Has No Such Prefix: ' + this.type + " ,It only has:" + Object.keys(that.config.cdn[gid].concat).join(','))
                let gurl = `https://${that.config.cdn[gid].domain}${that.config.cdn[gid].concat[this.type]}`.replace(/\?/g, "")
                for (var reg_item in this.var) {
                    gurl = gurl
                        .replace(
                            new RegExp(`\\(([^)]*)\\{\\{\\$?${reg_item}\\}\\}([^(]*)\\)`, 'g'),
                            this.var[reg_item] ? `$1${this.var[reg_item]}$2` : ""
                        )
                }
                return new CDNInstance(gurl)
            }
            this.getAllMirrors = () => {
                const mirrors = []
                for (var item in that.config.cdn) {
                    if (!!that.config.cdn[item].concat[this.type]) {
                        mirrors.push({
                            id: item,
                            domain: that.config.cdn[item].domain,
                            cdnObject: this.genMirror(that.config.cdn[item].domain),
                            cdnUrl: this.genMirror(that.config.cdn[item].domain).url
                        })
                    }
                }
                return mirrors
            }

            if (this.type === 'npm') {
                this.getNewestVersion = async () => {
                    const registry_varList = ["PACKAGE_SCOPE", "PACKAGE_NAME"]
                    let registry_urlList = []
                    for (var item in that.config.cdn) {
                        if (typeof that.config.cdn[item].extra === "object" && !!that.config.cdn[item].extra["npm_meta"]) {
                            let registry_url = `https://${that.config.cdn[item].domain}${that.config.cdn[item].extra["npm_meta"]}`

                            for (var reg_item in this.var) {

                                registry_url = registry_url
                                    .replace(/\?/g, '')
                                    .replace(new RegExp(`\\(([^)]*)\\{\\{\\$?${reg_item}\\}\\}([^(]*)\\)`, 'g'), registry_varList.indexOf(reg_item) !== -1 && this.var[reg_item] ? `$1${this.var[reg_item]}$2` : "")
                            }
                            registry_urlList.push(registry_url)
                        }
                    }
                    return parallel_fetch(registry_urlList)
                        .then(res => res.json())
                        .then(res => res["dist-tags"].latest)
                        .catch(err => { return null })
                }

                if(typeof config.ungzip !== 'function') {
                    console.warn('CDNObject: ungzip function not found, pls import pako before inistantiating CDNObject,GetFileFromNPMPackageFunction will not work')
                    return;
                }

                const RegistryCacheKey = `${this.var.PACKAGE_SCOPE ? 'this.var.PACKAGE_SCOPE/' : ""}${this.var.PACKAGE_NAME}/${this.var.PACKAGE_VERSION}`
                this.packageDownloaded = 0
                this.packageUntared = 0
                this.getPackage = async () => {
                    const CacheDBInstance = that.CacheDB('npm_registry')
                    const registry_varList = ["PACKAGE_SCOPE", "PACKAGE_NAME", "PACKAGE_VERSION"]
                    let registry_urlList = []
                    for (var item in that.config.cdn) {
                        if (typeof that.config.cdn[item].extra === "object" && !!that.config.cdn[item].extra["npm_registry"]) {
                            let registry_url = `https://${that.config.cdn[item].domain}${that.config.cdn[item].extra["npm_registry"]}`
                            for (var reg_item in this.var) {
                                registry_url = registry_url
                                    .replace(/\?/g, '')
                                    .replace(new RegExp(`\\(([^)]*)\\{\\{\\$?${reg_item}\\}\\}([^(]*)\\)`, 'g'), registry_varList.indexOf(reg_item) !== -1 && this.var[reg_item] ? `$1${this.var[reg_item]}$2` : "")
                            }
                            registry_urlList.push(registry_url)
                        }
                    }
                    const RegistryPackage = await parallel_fetch(registry_urlList)
                        .then(res => res.arrayBuffer())
                        .catch(err => { return null })
                    await CacheDBInstance.write(RegistryCacheKey, RegistryPackage, { type: 'arrayBuffer' })
                    this.packageDownloaded = 1
                    return {
                        "CachePrefix": 'npm_registry',
                        "CacheKey": RegistryCacheKey,
                    }
                }
                this.deletePackage = async () => {
                    if (!this.packageDownloaded) throw 'need getPackage()'
                    const CacheDBInstance = that.CacheDB('npm_registry')
                    await CacheDBInstance.delete(RegistryCacheKey)
                    this.packageDownloaded = 0
                    return !0
                }
                this.untarPackage = async () => {
                    if (!this.packageDownloaded) throw 'need getPackage()'
                    const CacheDBInstance = that.CacheDB('npm_registry')
                    const NPMCacheDBInstance = that.CacheDB('npm')
                    const RegistryPackage = await CacheDBInstance.read(RegistryCacheKey, { type: 'arrayBuffer' })
                    //1. ungzip package
                    const ungzipedRegistryPackage = ungzip(new Uint8Array(RegistryPackage))
                    //2. to blob object
                    const BlobRegistryPackage = new Blob([ungzipedRegistryPackage], { type: 'application/octet-stream' })
                    //3. untar package
                    let TarReader = new tarball.TarReader()
                    const untaredRegistryPackage = await TarReader.readFile(BlobRegistryPackage)
                    untaredRegistryPackage.forEach(async item => {
                        await NPMCacheDBInstance.write(`${RegistryCacheKey}/${item.name.replace(/^package\/?/g, "")}`,
                            TarReader.getFileBinary(item.name), { type: 'arrayBuffer' })
                    })
                    this.packageUntared = 1
                    return !0
                }
                this.getFileFromPackage = async () => {
                    if (!this.packageUntared) throw 'need untarPackage()'
                    if (!this.var.FILE_PATH) throw 'need FILE_PATH'
                    const NPMCacheDBInstance = that.CacheDB('npm')
                    const FileCacheKey = `${RegistryCacheKey}/${this.var.FILE_PATH}`
                    return NPMCacheDBInstance.read(FileCacheKey, { type: 'arrayBuffer' })
                }
            }
        }
        return CDNInstance
    }
    self.CDNObject = CDNObject

})()