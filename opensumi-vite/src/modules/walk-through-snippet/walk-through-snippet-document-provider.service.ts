import { Injectable } from '@opensumi/di'
import type { IEditorDocumentModelContentProvider } from '@opensumi/ide-editor/lib/browser'
import type { URI } from '@opensumi/ide-core-common'

@Injectable()
export class WalkThroughSnippetDocumentProvider
    implements IEditorDocumentModelContentProvider
{
    handlesScheme(scheme: string) {
        return scheme === 'walkThroughSnippet'
    }

    async provideEditorDocumentModelContent() {
        return ''
    }

    isReadonly(): boolean {
        return true
    }

    // 不需要严格实现
    // @ts-ignore
    get onDidChangeContent(): Event<URI> {
        return () => {}
    }

    preferLanguageForUri() {
        return 'plaintext'
    }
}
