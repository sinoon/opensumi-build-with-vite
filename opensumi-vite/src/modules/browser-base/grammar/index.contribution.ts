import { Autowired } from '@opensumi/di'
import { Disposable, Domain } from '@opensumi/ide-core-common'
import { ClientAppContribution } from '@opensumi/ide-core-browser'
import {
    ITextmateTokenizer,
    ITextmateTokenizerService,
} from '@opensumi/ide-monaco/lib/browser/contrib/tokenizer'
import { getLanguageById } from '@opensumi/textmate-languages/es/utils'

// TODO 替换为远程资源
const html = require('@opensumi/textmate-languages/lib/html')
const css = require('@opensumi/textmate-languages/lib/css')
const javascript = require('@opensumi/textmate-languages/lib/javascript')
const typescript = require('@opensumi/textmate-languages/lib/typescript')
const less = require('@opensumi/textmate-languages/lib/less')
const json = require('@opensumi/textmate-languages/lib/json')
const markdown = require('@opensumi/textmate-languages/lib/markdown')

// NOTE: 默认启用的语法，可以按需修改
const languages = [
    'html',
    'css',
    'javascript',
    'less',
    'json',
    'markdown',
    'typescript',
]

export { TextmateLanguageGrammarContribution }

@Domain(ClientAppContribution)
class TextmateLanguageGrammarContribution
    extends Disposable
    implements ClientAppContribution
{
    @Autowired(ITextmateTokenizer)
    private readonly textMateService: ITextmateTokenizerService

    // 由于使用了预加载 monaco, 导致 lang/grammar contribute 提前
    // 由于依赖了 ext fs provider 注册，因此这里从 onMonacoLoad 改为 onStart
    async onStart() {
        html(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        css(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        javascript(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        typescript(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        less(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        json(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )

        markdown(
            this.textMateService.registerLanguage.bind(this.textMateService),
            this.textMateService.registerGrammar.bind(this.textMateService),
        )
    }
}
