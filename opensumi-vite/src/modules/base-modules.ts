// import { MainLayoutModule } from '@opensumi/ide-main-layout/lib/browser'
import { LogModule } from '@opensumi/ide-logs/lib/browser'
import { MonacoModule } from '@opensumi/ide-monaco/lib/browser'
import { EditorModule } from '@opensumi/ide-editor/lib/browser'
// import { StatusBarModule } from '@opensumi/ide-status-bar/lib/browser'
import { BrowserModule, ClientCommonModule } from '@opensumi/ide-core-browser'
import { QuickOpenModule } from '@opensumi/ide-quick-open/lib/browser'
import { ConstructorOf } from '@opensumi/ide-core-common'
import { FileServiceClientModule } from '@opensumi/ide-file-service/lib/browser'
import { ThemeModule } from '@opensumi/ide-theme/lib/browser'
import { WorkspaceModule } from '@opensumi/ide-workspace/lib/browser'
import { ExtensionStorageModule } from '@opensumi/ide-extension-storage/lib/browser'
import { StorageModule } from '@opensumi/ide-storage/lib/browser'
// import { OpenedEditorModule } from '@opensumi/ide-opened-editor/lib/browser'
import { DecorationModule } from '@opensumi/ide-decoration/lib/browser'
import { PreferencesModule } from '@opensumi/ide-preferences/lib/browser'
// import { MenuBarModule } from '@opensumi/ide-menu-bar/lib/browser'
import { OverlayModule } from '@opensumi/ide-overlay/lib/browser'
import { StaticResourceModule } from '@opensumi/ide-static-resource/lib/browser'
import { WorkspaceEditModule } from '@opensumi/ide-workspace-edit/lib/browser'
import { KeymapsModule } from '@opensumi/ide-keymaps/lib/browser'
import { ExtensionModule } from '@opensumi/ide-extension/lib/browser'
import { CommentsModule } from '@opensumi/ide-comments/lib/browser'
import { WebviewModule } from '@opensumi/ide-webview/lib/browser'
import { OutputModule } from '@opensumi/ide-output/lib/browser'
// import { OutlineModule } from '@opensumi/ide-outline/lib/browser'
import { FileTreeNextModule } from '@opensumi/ide-file-tree-next'
import { StatusBarModule } from './status-bar'
import '@opensumi/ide-i18n/lib/browser'
import { LayoutModule } from './layout'
// import { LiteIDEThemeModule } from './theme'
import { WalkThroughSnippet } from './walk-through-snippet'

export const BaseModules: ConstructorOf<BrowserModule>[] = [
    FileServiceClientModule,
    // MainLayoutModule,
    OverlayModule,
    LogModule,
    ClientCommonModule,
    // StatusBarModule,
    // MenuBarModule,
    MonacoModule,

    EditorModule,
    QuickOpenModule,
    KeymapsModule,
    ThemeModule,
    WorkspaceModule,
    ExtensionStorageModule,
    StorageModule,
    PreferencesModule,
    // OpenedEditorModule,
    DecorationModule,
    StaticResourceModule,
    WorkspaceEditModule,
    CommentsModule,
    WebviewModule,
    OutputModule,
    // OutlineModule,
    // browser custom modules
    ExtensionModule,

    // mock status bar
    StatusBarModule,

    // TODO 按需引入；OpenSumi 内置的文件树
    FileTreeNextModule,

    // 如果需要使用 Output 的话，需要引入这个模块
    WalkThroughSnippet,
    OutputModule,
]
