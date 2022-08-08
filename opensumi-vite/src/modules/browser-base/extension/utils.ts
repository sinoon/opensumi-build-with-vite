import { IExtensionContributions } from '@opensumi/ide-extension/lib/common/vscode/extension'
import { IExtensionMetaData } from '@opensumi/ide-extension/lib/common'
import { Uri } from '@opensumi/ide-core-common'
import { mergeWith } from 'lodash'
import { ISumiExtensionContributions } from '@opensumi/ide-extension/lib/common/sumi/extension'
import { Extensions } from '.'
import { asArray } from '@opensumi/ide-utils/lib/arrays'

export function mergeContributes(
    contributes: IExtensionContributions | undefined,
    sumiContributes: ISumiExtensionContributions | undefined,
): ISumiExtensionContributions {
    if (contributes === undefined) {
        return sumiContributes || {}
    }

    if (sumiContributes === undefined) {
        return contributes || {}
    }

    return mergeWith(
        sumiContributes,
        contributes,
        (value, srcValue, key, object, source) => {
            if (value === undefined || srcValue === undefined) {
                return value || srcValue
            }

            if (['menus', 'viewsContainers', 'views'].includes(key)) {
                const childKeySet = new Set(
                    Object.keys(value).concat(Object.keys(srcValue)),
                )
                const result = {}
                // 合并掉相同 menuId 下的 menu items
                // TODO: 是否需要去重
                for (const childKey of childKeySet) {
                    result[childKey] = (value[childKey] || []).concat(
                        srcValue[childKey] || [],
                    )
                }
                return result
            }

            if (key === 'configuration') {
                value = asArray(value)
                srcValue = asArray(srcValue)
            }

            if (Array.isArray(value) && Array.isArray(srcValue)) {
                return value.concat(srcValue)
            }
        },
    )
}

const f = (url: string) => fetch(url).then(res => res.json())

export async function getExtension(
    extension: Extensions,
): Promise<IExtensionMetaData | undefined> {
    let extPath: string
    let packageJSON: Record<string, any>

    if ('isLocal' in extension) {
        extPath = `localhost:3000/${extension.path}`
        packageJSON = await f(`http://${extPath}/package.json`)
    } else if ('remote' in extension) {
        const p = extension.path
        if (p.startsWith('http')) {
            // 这是一个完整地址
            // 可以直接请求这里
            // 需要带上版本号
            extPath = `${p}/${extension.version}/`
            packageJSON = await f(`${extPath}package.json`)
        } else {
            extPath = `tosv.byted.org/obj/matrix/${extension.id}/`
            packageJSON = await f(`https://${extPath}package.json`)
        }
    } else {
        extPath = `gw.alipayobjects.com/os/marketplace/assets/${extension.id}/v${extension.version}/extension/`
        packageJSON = await f(`https://${extPath}package.json`)
    }

    // merge for `kaitianContributes` and `contributes`
    packageJSON.contributes = mergeContributes(
        packageJSON.kaitianContributes,
        packageJSON.contributes,
    )

    const extensionPath = 'ext://' + extPath
    const _extension = {
        // vscode 规范
        id: `${packageJSON.publisher}.${packageJSON.name}`,
        // 使用插件市场的 id
        // 从插件市场下载的插件命名规范为 ${publisher}.${name}-${version}
        extensionId: extension.id,
        extendConfig: {},
        path: extensionPath,
        packageJSON,
        defaultPkgNlsJSON: undefined,
        packageNlsJSON: undefined,
        realPath: extensionPath,
        uri: Uri.parse(extensionPath),
    }

    return _extension as IExtensionMetaData
}
