// export di
import {BaseModules} from "./modules/base-modules";

export { Autowired, Injector, Injectable, Provider } from '@opensumi/di'

import { IDiskFileProvider } from '@opensumi/ide-file-service/lib/common'
import { Injector } from '@opensumi/di'
import {
    BrowserModule,
    ClientApp,
    IClientAppOpts,
    SlotLocation,
} from '@opensumi/ide-core-browser'
import { ConstructorOf, URI } from '@opensumi/ide-core-common'

// OpenSumi 公共样式，没有的话，可能会白屏
// TODO 看一下是否可以移除
import '@opensumi/ide-core-browser/lib/style/index.less'
import { WorkbenchEditorService } from '@opensumi/ide-editor/lib/browser'
import { WorkbenchEditorServiceImpl } from '@opensumi/ide-editor/lib/browser/workbench-editor.service'
import {BrowserBaseModule} from "./modules/browser-base";

export class MyIDE {
    /**
     * 默认配置
     */
    defaultOpenOptions: IClientAppOpts = {
        useExperimentalShadowDom: false,
        appName: 'LiteIDE',
        modules: [...BaseModules, BrowserBaseModule],
        useCdnIcon: true,
        noExtHost: true,
        defaultPreferences: {
            'general.theme': 'ide-dark',
            'general.icon': 'vsicons-slim',
            'application.confirmExit': 'never',
            'editor.quickSuggestionsDelay': 100,
            'editor.quickSuggestionsMaxCount': 50,
            'editor.scrollBeyondLastLine': false,
            'general.language': 'en-US',
            'editor.autoSave': 'afterDelay',
        },
        storageDirName: '.lite-ide',
        preferenceDirName: '.lite-ide',
        workspacePreferenceDirName: '.lite-ide',
        userPreferenceDirName: '.lite-ide',
        extensionStorageDirName: '.lite-ide',
        // TODO 使用公司内部地址，且带上版本信息
        // extWorkerHost:
        //     'https://opensumi.github.io/ide-startup-lite/worker.host.js',
        // TODO 在未来，通过显示的方式提供默认 LayoutComponent
        // layoutComponent: LayoutComponent,
        // 默认 title 不跟随文件变动
        allowSetDocumentTitleFollowWorkspaceDir: false,
        layoutConfig: {
            [SlotLocation.top]: {
                modules: ['@opensumi/ide-menu-bar'],
            },
            [SlotLocation.action]: {
                modules: [''],
            },
            [SlotLocation.left]: {
                modules: ['@opensumi/ide-explorer', 'test-view'],
            },
            [SlotLocation.main]: {
                modules: ['@opensumi/ide-editor'],
            },
            [SlotLocation.statusBar]: {
                modules: ['@opensumi/ide-status-bar'],
            },
            [SlotLocation.bottom]: {
                modules: ['@opensumi/ide-output'],
            },
            [SlotLocation.extra]: {
                modules: [],
            },
        }
    }

    /**
     * 持有上下文依赖注入对象
     */
    private injector: Injector = new Injector()

    /**
     * OpenSumi 实例
     * @private
     */
    private app: ClientApp

    /**
     * 挂载的 dom 引用
     */
    container: HTMLElement

    constructor(workspaceDir: string) {
        const injector = this.injector

        this.app = new ClientApp({
            ...this.defaultOpenOptions,
            modules: this.defaultOpenOptions.modules,
            injector,
            workspaceDir: workspaceDir,
        })
    }

    public async mount(container: HTMLElement): Promise<void> {
        return this.app.start(container).then(() => {

        })
    }
}
