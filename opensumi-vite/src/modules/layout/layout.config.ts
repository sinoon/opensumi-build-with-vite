import React from 'react'
export const ILayoutConfig = Symbol('LayoutConfig')

export interface LayoutConfig {
    userConfig: {
        index: number
        component: React.ComponentType<any>
        containerId: string
        name: string
    }[]

    /**
     * 当用户启动了 FileTree ，会自动有一个容器 explorer ，此时用户往 Left 位置添加的组件
     * 会存放在这个容器中。
     * 但是当用户没有启动 FileTree ，我们需要一个容器来放置用户的组件
     */
    registerLeftContainer: boolean
}
