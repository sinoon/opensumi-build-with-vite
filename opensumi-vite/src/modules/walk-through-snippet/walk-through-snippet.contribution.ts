import { Domain } from '@opensumi/ide-core-browser'
import {
    BrowserEditorContribution,
    IEditorDocumentModelContentRegistry,
} from '@opensumi/ide-editor/lib/browser'
import { WalkThroughSnippetDocumentProvider } from './walk-through-snippet-document-provider.service'

@Domain(BrowserEditorContribution)
export class WalkThroughSnippetContribution
    implements BrowserEditorContribution
{
    walkThroughSnippetDocumentProvider: WalkThroughSnippetDocumentProvider

    registerEditorDocumentModelContentProvider(
        registry: IEditorDocumentModelContentRegistry,
    ) {
        registry.registerEditorDocumentModelContentProvider(
            new WalkThroughSnippetDocumentProvider(),
        )
    }
}
