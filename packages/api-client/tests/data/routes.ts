import {ApiRouter} from '@onedaycat/jaco'

export const routes = new ApiRouter()
    .resource('account', r => {
        r.get('me', () => import('./ctrl-1').then(ctrl => ctrl.Ctrl1))
    })
    .resource('profile', r => {
        r.post('profile', () => import('./ctrl-2').then(ctrl => ctrl.Ctrl2))
    })
