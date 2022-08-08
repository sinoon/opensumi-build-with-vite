import { Injectable } from '@opensumi/di'
import {
    IExtensionMetaData,
    IExtensionNodeClientService,
    IExtraMetaData,
} from '@opensumi/ide-extension/lib/common'
import { getExtension } from './utils'

export type Extensions =
    | {
          id: string
          version: string
      }
    | {
          id: string
          version: string
          isLocal: true
          path: string
      }
    | {
          id: string
          version: string
          remote: true
          path: string
      }

const extensionList: Extensions[] = [
    // {
    //     id: 'alex-ext-public.typescript-language-features-worker',
    //     version: '1.53.0-patch.3',
    // },
    {
        id: 'alex-ext-public.markdown-language-features-worker',
        version: '1.53.0-patch.1',
    },
    {
        id: 'alex-ext-public.html-language-features-worker',
        version: '1.53.0-patch.1',
    },
    {
        id: 'alex-ext-public.json-language-features-worker',
        version: '1.53.0-patch.1',
    },
    {
        id: 'alex-ext-public.css-language-features-worker',
        version: '1.53.0-patch.1',
    },
    // https://gw.alipayobjects.com/os/marketplace/assets/alex-ext-public.vsicons-slim/v1.0.5/
    { id: 'alex-ext-public.vsicons-slim', version: '1.0.5' },
    { id: 'worker-public.ide-ext-theme', version: '2.5.2' },
    // {
    //     id: 'vscode.typescript-language-features',
    //     version: '2.5.2',
    //     isLocal: true,
    //     path: 'extensions/typescript',
    // },
    // {
    //     id: 'fredrikaverpil.vscode-material-theme',
    //     version: '0.0.5',
    //     remote: true,
    //     // https://ide.byted.org/extensions/api/v2/download/tos/ovsx/fredrikaverpil/vscode-material-theme/0.0.5/package.json
    //     path: 'http://localhost:8080/extensions/api/v2/download/tos/ovsx/fredrikaverpil/vscode-material-theme',
    // },
]

export const getExtensions: () => Promise<IExtensionMetaData[]> = () => {
    const list = extensionList.map(ext => getExtension(ext))
    return Promise.all(list).then(
        exts => exts.filter(item => !!item) as IExtensionMetaData[],
    )
}
export { ExtensionClientService }
@Injectable()
class ExtensionClientService implements IExtensionNodeClientService {
    restartExtProcessByClient(): void {
        throw new Error('Method not implemented.')
    }

    getElectronMainThreadListenPath(clientId: string): Promise<string> {
        throw new Error('Method not implemented.')
    }

    async getAllExtensions(
        scan: string[],
        extensionCandidate: string[],
        localization: string,
        extraMetaData: IExtraMetaData,
    ): Promise<IExtensionMetaData[]> {
        const extensionList = await getExtensions()
        return extensionList
    }

    createProcess(clientId: string): Promise<void> {
        throw new Error('Method not implemented.')
    }

    getExtension(
        extensionPath: string,
        localization: string,
        extraMetaData?: IExtraMetaData | undefined,
    ): Promise<IExtensionMetaData | undefined> {
        throw new Error('Method not implemented.')
    }

    infoProcessNotExist(): void {
        throw new Error('Method not implemented.')
    }

    infoProcessCrash(): void {
        throw new Error('Method not implemented.')
    }

    disposeClientExtProcess(clientId: string, info: boolean): Promise<void> {
        throw new Error('Method not implemented.')
    }

    updateLanguagePack(
        languageId: string,
        languagePackPath: string,
        storagePath: string,
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
}
