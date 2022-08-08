import { componentLoad } from './componentLoad'
import { InternalComponents, LayoutWithPreset } from '../index'
import { Injector } from '@opensumi/di'

export const symbolToComponent = (
    layout: LayoutWithPreset,
    injector: Injector,
): { [p: symbol]: React.ComponentType[] } => {
    const o: {
        [key: symbol]: React.ComponentType[]
    } = {}
    Object.entries(layout).forEach(([key, value]) => {
        o[key] = (value as InternalComponents[])
            .map(component => componentLoad(component, injector))
            .flat(2)
    })

    return o
}
