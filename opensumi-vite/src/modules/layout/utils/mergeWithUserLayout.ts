// 如果用户想要用自己的实现来替换
// 循环 layout 对应的区域，如果区域一样，就进行替换
import { LayoutWithPreset } from '../index'
import { LiteideConfig } from '../../config'

export const mergeWithUserLayout = (
    presetLayout: LayoutWithPreset,
    userLayout: LiteideConfig['layout'],
): LayoutWithPreset => {
    for (const key in presetLayout) {
        if (presetLayout.hasOwnProperty(key)) {
            if (userLayout.preset[key]) {
                presetLayout[key] = userLayout.preset[key]
            }
        }
    }
    return presetLayout
}
