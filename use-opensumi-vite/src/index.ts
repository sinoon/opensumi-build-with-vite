import { MyIDE } from 'opensumi-vite'

interface Options {
    functionId: string
    token: string
}

export const createInstance = ({ functionId, token }: Options) => {
    // 环境准备
    document.body.style.margin = '0'
    document.body.setAttribute('arco-theme', 'dark')

    // 渲染 IDE
    const ide = new MyIDE({
        workspaceDir: '/home/ide/',
    })

    ide.mount(document.getElementById('root')!)
}
