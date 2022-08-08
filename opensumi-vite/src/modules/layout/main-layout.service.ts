import {
    IMainLayoutService,
    ViewComponentOptions,
} from '@opensumi/ide-main-layout/lib/common/main-layout.defination'
import { TabbarService } from '@opensumi/ide-main-layout/lib/browser/tabbar/tabbar.service'
import {
    Deferred,
    SlotLocation,
    View,
    ViewContainerOptions,
} from '@opensumi/ide-core-browser'
import { IContextMenu } from '@opensumi/ide-core-browser/lib/menu/next'
import { TabBarHandler } from '@opensumi/ide-main-layout/lib/browser/tabbar-handler'
import { AccordionService } from '@opensumi/ide-main-layout/lib/browser/accordion/accordion.service'
import { Injectable } from '@opensumi/di'

@Injectable()
export class MainLayoutService implements IMainLayoutService {
    bottomExpanded: boolean
    viewReady: Deferred<void>

    collectTabbarComponent(
        views: View[],
        options: ViewContainerOptions,
        side: string,
    ): string {
        return ''
    }

    collectViewComponent(
        view: View,
        containerId: string,
        props?: any,
        options?: ViewComponentOptions,
    ): string {
        return ''
    }

    didMount(): void {}

    disposeContainer(containerId: string): void {}

    disposeViewComponent(viewId: string): void {}

    expandBottom(expand: boolean): void {}

    getAccordionService(
        containerId: string,
        noRestore?: boolean,
    ): AccordionService {
        throw new Error('Method not implemented.')
    }

    getExtraMenu(): IContextMenu {
        throw new Error('Method not implemented.')
    }

    getTabbarHandler(handlerId: string): TabBarHandler | undefined {
        return undefined
    }

    getTabbarService(location: string): TabbarService {
        throw new Error('Method not implemented.')
    }

    getViewAccordionService(viewId: string): AccordionService | undefined {
        return undefined
    }

    isViewVisible(viewId: string): boolean {
        return false
    }

    isVisible(location: string): boolean {
        return false
    }

    replaceViewComponent(view: View, props?: any): void {}

    restoreState(): void {}

    revealView(viewId: string): void {}

    setFloatSize(size: number): void {}

    toggleSlot(location: SlotLocation, show?: boolean, size?: number): void {}
}
