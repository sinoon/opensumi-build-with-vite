import { Injectable, Provider } from '@opensumi/di'
import { BrowserModule } from '@opensumi/ide-core-browser'
import { WalkThroughSnippetContribution } from './walk-through-snippet.contribution'

@Injectable()
export class WalkThroughSnippet extends BrowserModule {
    providers: Provider[] = [WalkThroughSnippetContribution]
}
