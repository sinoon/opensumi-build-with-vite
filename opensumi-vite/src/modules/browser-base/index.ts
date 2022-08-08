import { Injectable, Provider } from '@opensumi/di'
import {
    BrowserModule,
    LogServiceForClientPath,
} from '@opensumi/ide-core-browser'
import { CommonServerPath, KeytarServicePath } from '@opensumi/ide-core-common'
import { ExtensionNodeServiceServerPath } from '@opensumi/ide-extension/lib/common'
import { FileSearchServicePath } from '@opensumi/ide-file-search/lib/common'
import { DebugPreferences } from '@opensumi/ide-debug/lib/browser'

import { ExtensionClientService } from './extension'
import { TextmateLanguageGrammarContribution } from './grammar/index.contribution'

// import { LanguageServiceContribution } from './language-service/language.contribution'
// import { IDiskFileProvider } from '@opensumi/ide-file-service/lib/common'
// import { BrowserFsProvider } from './file-provider/browser-fs-provider'

export { BrowserBaseModule }

@Injectable()
class BrowserBaseModule extends BrowserModule {
    providers: Provider[] = [

        {
            token: ExtensionNodeServiceServerPath,
            useClass: ExtensionClientService,
        },



        {
            token: DebugPreferences,
            useValue: {},
        },
        TextmateLanguageGrammarContribution,

        // LanguageServiceContribution,
    ]
}
