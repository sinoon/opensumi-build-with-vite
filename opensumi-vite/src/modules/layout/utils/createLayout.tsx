import React from 'react'

/**
 * 构造 HOC 用于预置 Layout 配置
 * @param Layout
 * @param componentsWithPosition
 */
export const createLayout =
    (
        Layout: React.FC<{ [p: symbol]: React.ComponentType<any>[] }>,
        componentsWithPosition: { [p: symbol]: React.ComponentType[] },
    ) =>
    () =>
        <Layout {...componentsWithPosition} />
