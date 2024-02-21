import { ChangeEvent } from 'react';
import { UnknownFunction } from './types';

export function splitNameToPath(name: ''): '';
export function splitNameToPath(name: string): string[];
export function splitNameToPath(name: unknown): '';
export function splitNameToPath(name: unknown) {
    return typeof name === 'string' && name ? name.replace(/\[/, '.').replace(/\]/, '').split('.') : '';
}

export function hasIn(state: unknown, name: string | undefined | null): boolean {
    if (!state) {
        return false;
    }

    const path = splitNameToPath(name);
    const length = path.length;
    if (!length) {
        return false;
    }

    let result: unknown = state;
    for (let i = 0; i < length; ++i) {
        // parent is not object
        if (typeof result !== 'object' || result === null) {
            return false;
        }
        // has no property
        const thisName = path[i];
        if (!(thisName in result)) {
            return false;
        }
        // pass on
        result = (result as Record<string, unknown>)[thisName];
    }

    return true;
}

export function getIn<V = unknown>(state: unknown, name: string): V {
    if (!state) {
        return state as V;
    }

    const path = splitNameToPath(name);
    const length = path.length;
    if (!length) {
        return undefined as V;
    }

    let result: unknown = state;
    for (let i = 0; i < length; ++i) {
        // parent is not object
        if (typeof result !== 'object' || result === null) {
            return undefined as V;
        }
        result = (result as Record<string, unknown>)[path[i]];
    }

    return result as V;
}

function setInWithPath<R = any>(
    state: unknown,
    value: unknown,
    path: string | Array<string | number>,
    pathIndex: number
): R {
    if (pathIndex >= path.length) {
        return value as R;
    }

    const first = path[pathIndex];
    const next = setInWithPath(state && (state as Record<string | number, unknown>)[first], value, path, pathIndex + 1);

    if (!state) {
        const initialized: any = isNaN(first as number) ? {} : [];
        initialized[first] = next;
        return initialized as R;
    }

    if (Array.isArray(state)) {
        const copy = [...state];
        copy[first as number] = next;
        return copy as R;
    }

    return Object.assign({}, state, {
        [first]: next,
    }) as R;
}

export function setIn<R = any>(state: unknown, name: string, value: unknown): R {
    return setInWithPath(
        state,
        value,
        typeof name === 'string' ? name.replace(/\[/, '.').replace(/\]/, '').split('.') : '',
        0
    );
}

export function deleteIn(state: undefined | null, name: string): undefined;
export function deleteIn<S extends Record<string, unknown> | unknown[]>(state: S, name: string): S;
export function deleteIn<S extends Record<string, unknown> | unknown[] | undefined | null>(state: S, name: string) {
    if (!state) {
        return;
    }

    const path = typeof name === 'string' ? name.replace(/\[/, '.').replace(/\]/, '').split('.') : '';
    const length = path.length;
    if (!length) {
        return state;
    }

    let result: any = state;
    for (let i = 0; i < length && !!result; ++i) {
        if (i === length - 1) {
            delete result[path[i]];
        } else {
            result = result[path[i]];
        }
    }

    return state;
}
export function getErrorStrs(): undefined;
export function getErrorStrs<Errors extends undefined | null>(
    errors: Errors,
    processErrorMessage?: (message: unknown) => unknown
): Errors;
export function getErrorStrs<MessageType, R>(
    errors: { message: MessageType }[],
    processErrorMessage?: ((message: MessageType) => R) | undefined
): typeof processErrorMessage extends undefined ? MessageType[] : R[];
export function getErrorStrs<Error, R>(
    errors: Error[],
    processErrorMessage?: ((message: Error) => R) | undefined
): typeof processErrorMessage extends undefined ? Error[] : R[];
export function getErrorStrs<Error extends Record<string, unknown>, Process extends (message: unknown) => unknown>(
    errors?: Error[] | undefined | null,
    processErrorMessage?: Process
) {
    if (errors) {
        return errors.map((e) => {
            const message = typeof e.message !== 'undefined' ? e.message : e;

            if (typeof processErrorMessage === 'function') {
                return processErrorMessage(message);
            }

            return message;
        });
    }
    return errors;
}

export function getParams<Cb extends (...args: unknown[]) => unknown>(
    ns: Cb,
    cb?: undefined
): { names: undefined; callback: Cb };
export function getParams<Ns extends string | string[] | undefined, Cb extends UnknownFunction | undefined>(
    ns: Ns | Cb,
    cb: Cb
): { names: Ns extends undefined ? undefined : string[]; callback: Cb };
export function getParams<Cb extends (...args: unknown[]) => unknown>(ns?: string | string[] | Cb, cb?: Cb) {
    let names: string[] | Cb | undefined = typeof ns === 'string' ? [ns] : ns;
    let callback = cb;
    if (cb === undefined && typeof names === 'function') {
        callback = names;
        names = undefined;
    }
    return {
        names,
        callback,
    };
}

export function isOverwritten(values: unknown, name: unknown): typeof values extends object ? boolean : false;
export function isOverwritten(values: unknown, name: unknown): typeof name extends string ? boolean : false;
export function isOverwritten(values: unknown, name: unknown): boolean;
/**
 * name 是否被覆写
 * e.g. \{ a: \{ b: 1 \} \} and 'a.b', should return true
 * e.g. \{ a: \{ b: 1 \} \} and 'a.b.c', should return true
 * e.g. \{ a: \{ b: 1 \} \} and 'a.b2', should return false
 * e.g. \{ a: \{ b: 1 \} \} and 'a2', should return false
 * e.g. \{ a: \{ b: [0, 1] \} \} and 'a.b[0]' return true
 * e.g. \{ a: \{ b: [0, 1] \} \} and 'a.b[5]' return true (miss index means overwritten in array)
 * @param values - 写入对象
 * @param name - 字段 key
 */
export function isOverwritten(values: unknown, name: unknown) {
    if (!values || typeof values !== 'object' || !name || typeof name !== 'string') {
        return false;
    }
    const paths = splitNameToPath(name);
    let obj = values as Record<string, unknown>;
    for (const path of paths) {
        if (path in obj) {
            const pathValue = obj[path];
            // 任意一层 path 值不是对象了，则代表被覆盖
            if (!pathValue || typeof pathValue !== 'object') {
                return true;
            } else {
                obj = pathValue as Record<string, undefined>;
            }
        } else {
            // 数组的 index 已经移除，则代表被覆写
            if (Array.isArray(obj)) {
                return true;
            }
            return false;
        }
    }
    // 代表 name in values，则返回 true
    return true;
}

export function getValueFromEvent<E extends ChangeEvent<HTMLInputElement>>(e: E): string | boolean;
export function getValueFromEvent<E>(e: E): E;
/**
 * 从组件事件中获取数据
 * @param e - Event 或者 value
 * @returns 数据值
 */
export function getValueFromEvent(e: unknown) {
    // support custom element
    if (!e || !(e as ChangeEvent<HTMLInputElement>).target || !(e as ChangeEvent<HTMLInputElement>).preventDefault) {
        return e;
    }

    const { target } = e as ChangeEvent<HTMLInputElement>;

    if (target.type === 'checkbox') {
        return target.checked;
    } else if (target.type === 'radio') {
        //兼容原生 radioGroup
        if (target.value) {
            return target.value;
        } else {
            return target.checked;
        }
    }
    return target.value;
}

function validateMap<Rule extends { trigger?: string | string[]; [key: string]: unknown }>(
    rulesMap: Record<string, Omit<Rule, 'trigger'>[]>,
    rule: Rule,
    defaultTrigger: string
) {
    const nrule = Object.assign({}, rule);

    if (!nrule.trigger) {
        nrule.trigger = [defaultTrigger];
    }

    if (typeof nrule.trigger === 'string') {
        nrule.trigger = [nrule.trigger];
    }

    for (let i = 0; i < nrule.trigger.length; i++) {
        const trigger: string = nrule.trigger[i];

        if (trigger in rulesMap) {
            rulesMap[trigger].push(nrule);
        } else {
            rulesMap[trigger] = [nrule];
        }
    }

    delete nrule.trigger;
}

/**
 * 提取rule里面的trigger并且做映射
 * @param rules - 规则
 * @param defaultTrigger - 默认触发器
 */
export function mapValidateRules<Rule extends { [key: string]: unknown; trigger?: string | string[] }>(
    rules: Rule[],
    defaultTrigger: string
) {
    const rulesMap: Record<string, Array<Omit<Rule, 'trigger'>>> = {};

    rules.forEach((rule) => {
        validateMap(rulesMap, rule, defaultTrigger);
    });

    return rulesMap;
}

let warn: (...args: unknown[]) => void = () => {};

if (
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production' &&
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
) {
    warn = (...args) => {
        /* eslint-disable no-console */
        if (typeof console !== 'undefined' && console.error) {
            console.error(...args);
        }
        /* eslint-enable no-console */
    };
}

export const warning = warn;

export function cloneToRuleArr(rules?: undefined | null): [];
export function cloneToRuleArr<Rule>(rules: Rule): Rule extends unknown[] ? Rule : Rule[];
export function cloneToRuleArr(rules?: unknown | unknown[] | null) {
    if (!rules) {
        return [];
    }
    const rulesArr = Array.isArray(rules) ? rules : [rules];
    // 后续会修改 rule 对象，这里做浅复制以避免对传入对象的修改
    return rulesArr.map((rule) => ({ ...rule }));
}
