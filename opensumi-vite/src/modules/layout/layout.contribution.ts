import {
    ClientAppContribution,
    ComponentContribution,
    ComponentRegistry,
    ContributionProvider,
    Domain,
    IClientApp,
} from '@opensumi/ide-core-browser'
import { Autowired } from '@opensumi/di'
import { ILayoutConfig, LayoutConfig } from './layout.config'

// 没有复用 OpenSumi 自身的 token，一些 OpenSumi 的模块可能无法读取到
export const LayoutContribution = Symbol('LayoutContribution')

@Domain(ClientAppContribution)
export class LayoutModuleContribution implements ClientAppContribution {
    @Autowired(ILayoutConfig)
    private layoutConfig: LayoutConfig

    @Autowired(ComponentContribution)
    contributionProvider: ContributionProvider<ComponentContribution>

    @Autowired(ComponentRegistry)
    componentRegistry: ComponentRegistry

    async initialize(app: IClientApp) {
        // 读取所有注册 Component Contribution
        // 注册的 ComponentRegistry
        this.contributionProvider.getContributions().forEach(contribution => {
            contribution.registerComponent(this.componentRegistry)
        })
    }
}
