import { BrowserModule } from '@opensumi/ide-core-browser'
import { Injectable, Provider } from '@opensumi/di'
import {
    LayoutContribution,
    LayoutModuleContribution,
} from './layout.contribution'
import {
    IMainLayoutService,
    IViewsRegistry,
} from '@opensumi/ide-main-layout/lib/common/main-layout.defination'
import { ViewsRegistry } from '@opensumi/ide-main-layout/lib/browser/views-registry'
import { MainLayoutService } from './main-layout.service'
import { ThreeColumn } from './presets/three-column'
import React from 'react'

export const InternalComponent = {
    FileTree: Symbol('FILE_TREE'),
    Npm: Symbol('NPM'),
    Editor: Symbol('EDITOR'),
    Preview: Symbol('PREVIEW'),
    ActivityBar: Symbol('ACTIVITY_BAR'),
    StatusBar: Symbol('STATUS_BAR'),
    Bottom: Symbol('BOTTOM'),
    Terminal: Symbol('TERMINAL'),
}

export const LayoutPosition = {
    // 顶部
    Top: Symbol('TOP'),

    // 底部
    Bottom: Symbol('BOTTOM'),

    // 左侧边栏
    Left: Symbol('LEFT'),

    // 右侧边栏
    Right: Symbol('RIGHT'),

    // 主区域
    Main: Symbol('MAIN'),

    // 顶部，高于 TOP
    Header: Symbol('HEADER'),

    // 底部，低于 status bar，低优实现
    Footer: Symbol('FOOTER'),

    // 状态栏
    StatusBar: Symbol('STATUS_BAR'),

    // 工具插槽
    Action: Symbol('ACTION'),
}

export type InternalComponents =
    | typeof InternalComponent.Editor
    | typeof InternalComponent.Npm
    | typeof InternalComponent.FileTree

export const presets = {
    FullMode: Symbol('FullMode'),
    ThreeColumnMode: Symbol('ThreeColumnMode'),
}

export type Presets = typeof presets
export type PresetsType = Presets[keyof Presets]

export type LayoutWithPreset = {
    [
        key: typeof LayoutPosition[keyof typeof LayoutPosition]
    ]: InternalComponents[]
}

// 处理应该加载哪些模块
export const LayoutAssembly = (preset: PresetsType): LayoutWithPreset => {
    switch (preset) {
        case presets.ThreeColumnMode: {
            return {
                [LayoutPosition.Left]: [InternalComponent.FileTree],
                [LayoutPosition.Main]: [InternalComponent.Editor],
                [LayoutPosition.Right]: [InternalComponent.Preview],
            }
        }
        default:
            throw new Error('Unknown preset')
    }
}

export const getLayoutByPreset = (
    preset: Presets[keyof Presets],
): React.FC<{ [p: symbol]: React.ComponentType<any>[] }> => {
    switch (preset) {
        case presets.ThreeColumnMode: {
            return ThreeColumn
        }
        default:
            throw new Error('Unknown preset')
    }
}

// 不能忘记注入
@Injectable()
export class LayoutModule extends BrowserModule {
    providers: Provider[] = [
        LayoutModuleContribution,
        {
            // 其他模块依赖这个模块
            token: IViewsRegistry,
            useClass: ViewsRegistry,
        },
        {
            token: IMainLayoutService,
            useClass: MainLayoutService,
        },
    ]

    contributionProvider = LayoutContribution
}
