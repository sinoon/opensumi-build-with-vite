import {
    EditorComponentRenderMode,
    ICodeEditor,
} from '@opensumi/ide-editor/lib/browser'
import {
    EditorCollectionService,
    getSimpleEditorOptions,
} from '@opensumi/ide-editor'
export { getSimpleEditorOptions } from '@opensumi/ide-editor'
import { editor } from '@opensumi/monaco-editor-core'

// 由于 OpenSumi 将 Symbol 和 Type 当一个变量使用，以此简化操作
// 但在 reexport 中，由于不知道使用的是哪个，类型和变量无法同时导出
// export * from '@opensumi/ide-editor/lib/browser'
// export * from '@opensumi/ide-editor/lib/common'
export { BrowserEditorContribution } from '@opensumi/ide-editor/lib/browser'
export type { BrowserEditorContribution as IBrowserEditorContribution } from '@opensumi/ide-editor/lib/browser'

export { WorkbenchEditorService } from '@opensumi/ide-editor/lib/browser'
export type { WorkbenchEditorService as IWorkbenchEditorService } from '@opensumi/ide-editor/lib/browser'

export { IEditorDocumentModelService as EditorDocumentModelService } from '@opensumi/ide-editor/lib/browser/doc-model/types'
export type { IEditorDocumentModelService } from '@opensumi/ide-editor/lib/browser/doc-model/types'

export { EditorComponentRenderMode } from '@opensumi/ide-editor/lib/browser'

export type IEditorConstructionOptions = editor.IEditorConstructionOptions

export abstract class Editor extends EditorCollectionService {
    constructor() {
        super()
    }

    abstract createCodeEditor(
        dom: HTMLElement,
        options?: IEditorConstructionOptions,
        overrides?: { [p: string]: any },
    ): ICodeEditor
}
