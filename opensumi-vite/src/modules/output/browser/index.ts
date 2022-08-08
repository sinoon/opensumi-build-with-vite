import { Provider, Injectable } from '@opensumi/di'
import { BrowserModule } from '@opensumi/ide-core-browser'

import { OutputContribution } from './output-contribution'
import { bindOutputPreference } from './output-preference'
import { OutputService } from './output.service'

@Injectable()
export class OutputModule extends BrowserModule {
    providers: Provider[] = [
        // OutputContribution,
        {
            token: OutputService,
            useClass: OutputService,
        },
    ]

    // preferences = bindOutputPreference
}
