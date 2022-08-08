import { useInjectable } from '@opensumi/ide-core-browser'
import { IThemeService } from '@opensumi/ide-theme'
import React, { FC, useMemo } from 'react'
import { ILiteideConfig, LiteideConfig } from '../../../config'
import { BoxPanel, SplitPanel } from '@opensumi/ide-core-browser/lib/components'
import { LayoutPosition } from '../../index'

const BaseLayout = ({
    id,
    backgroundColor,
    components,
}: {
    id: string
    defaultSize?: number
    backgroundColor: string
    minSize?: number
    flexGrow?: number
    components: React.ComponentType<any>[]
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: backgroundColor,
            height: '100%',
        }}
    >
        <SplitPanel direction={'top-to-bottom'} id={id}>
            {components.map((Component, index) => {
                // TODO 注入 LiteIDE 上下文 Context 以便用户组件进行调用与通信
                return (
                    <Component
                        key={index}
                        viewState={{ height: 100, width: 100 }}
                    />
                )
            })}
        </SplitPanel>
    </div>
)

export const ThreeColumn: FC<{
    [
        key: typeof LayoutPosition[keyof typeof LayoutPosition]
    ]: React.ComponentType<any>[]
}> = props => {
    const themeService = useInjectable<IThemeService>(IThemeService)
    const sidebarBackground: string = useMemo(
        () =>
            themeService
                .getCurrentThemeSync()
                .getColor('sideBar.background', true)
                // 颜色必须存在
                ?.toString()!,
        [themeService],
    )
    const editorBackgroundColor: string = useMemo<string>(
        () =>
            themeService
                .getCurrentThemeSync()
                .getColor('editor.background', true)
                // 颜色必须存在
                ?.toString()!,
        [themeService],
    )

    // 看一下是否传入了 header ?
    const config = useInjectable<LiteideConfig>(ILiteideConfig)
    const HeaderComponents = config.layout['header']

    return (
        <BoxPanel direction={'top-to-bottom'}>
            {HeaderComponents ? (
                <div>
                    <HeaderComponents />
                </div>
            ) : (
                <span />
            )}
            <SplitPanel
                overflow={'hidden'}
                id={'main'}
                flex={1}
                direction={'left-to-right'}
                style={{
                    width: '100%',
                }}
            >
                <BaseLayout
                    id={'left'}
                    defaultSize={200}
                    backgroundColor={sidebarBackground}
                    components={props[LayoutPosition.Left]}
                />
                <BaseLayout
                    id={'main'}
                    flexGrow={2}
                    backgroundColor={editorBackgroundColor}
                    components={props[LayoutPosition.Main]}
                />
                <BaseLayout
                    id={'right'}
                    backgroundColor={sidebarBackground}
                    minSize={200}
                    components={props[LayoutPosition.Right]}
                />
            </SplitPanel>
        </BoxPanel>
    )
}
