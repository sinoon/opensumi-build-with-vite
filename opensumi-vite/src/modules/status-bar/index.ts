import { Provider, Injectable } from '@opensumi/di'
import { BrowserModule } from '@opensumi/ide-core-browser'
import { IStatusBarService } from '@opensumi/ide-core-browser/lib/services'

import { StatusBarService } from './status-bar.service'

@Injectable()
export class StatusBarModule extends BrowserModule {
    providers: Provider[] = [
        {
            token: IStatusBarService,
            useClass: StatusBarService,
        },
    ]
}
