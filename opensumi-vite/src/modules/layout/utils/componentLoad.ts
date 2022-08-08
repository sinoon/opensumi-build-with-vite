import { FileTree } from '@opensumi/ide-file-tree-next/lib/browser/file-tree'
import { Injector } from '@opensumi/di'
import { ComponentRegistry } from '@opensumi/ide-core-browser'
import { InternalComponent, InternalComponents } from '../index'
import { NPM_COMPONENT_ID } from '../../npm/npm.contribution'

const filter = (list: any[]) => {
    return list.filter(Boolean)
}

export const componentLoad = (
    token: InternalComponents,
    injector: Injector,
): React.ComponentType<any>[] => {
    const componentRegistry = injector.get(ComponentRegistry)

    switch (token) {
        case InternalComponent.FileTree: {
            return [FileTree]
        }

        case InternalComponent.Editor: {
            // 需要返回内置的 Editor
            return filter([
                componentRegistry
                    .getComponentRegistryInfo('@opensumi/ide-editor')
                    ?.views.map(view => view.component),
            ])
        }
        case InternalComponent.Npm: {
            // 需要返回内置的 NPM
            return filter([
                componentRegistry
                    // TODO 内置的组件，不需要这么注册
                    .getComponentRegistryInfo(NPM_COMPONENT_ID)
                    ?.views.map(view => view.component),
            ])
        }
        default:
            throw new Error('Unknown component token')
    }
}
