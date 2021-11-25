export enum Action {
    NONE = 'NONE',
    NEXT = 'NEXT',
    BACK = 'BACK',
    END = 'END',
    COMPENSATE = 'COMPENSATE',
    RETRY = 'RETRY',
}

export enum Status {
    INIT = 'INIT',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    COMPENSATED = 'COMPENSATED',
}
