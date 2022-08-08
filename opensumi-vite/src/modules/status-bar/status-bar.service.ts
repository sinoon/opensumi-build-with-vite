import { IMenu } from '@opensumi/ide-core-browser/lib/menu/next'
import {
    IStatusBarService,
    StatusBarEntry,
    StatusBarEntryAccessor,
} from '@opensumi/ide-core-browser/lib/services'
import { Injectable } from '@opensumi/di'

@Injectable()
export class StatusBarService implements IStatusBarService {
    contextMenu: IMenu
    leftEntries: StatusBarEntry[]
    rightEntries: StatusBarEntry[]

    addElement(entryId: string, entry: StatusBarEntry): StatusBarEntryAccessor {
        return {
            update(properties: StatusBarEntry) {},
            dispose() {},
        }
    }

    getBackgroundColor(): string | undefined {
        return undefined
    }

    removeElement(entryId: string): void {}

    setBackgroundColor(color?: string): void {}

    setColor(color?: string): void {}

    setElement(entryId: string, fields: object): void {}

    toggleElement(entryId: string): void {}
}
