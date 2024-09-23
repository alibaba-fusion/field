import type { MessagesConfig, PresetFormatter, Validator } from '@alifd/validate';
import type { Component, useState, useMemo, Dispatch, SetStateAction, Ref, RefCallback } from 'react';

export type { Validator };

export type FieldValues = Record<string, unknown>;

export type ValidateErrorGroup = Record<string, { errors: unknown[] }>;

export interface FieldOption {
    /**
     * 所有组件的 change 都会到达这里 [setValue 不会触发该函数]
     */
    onChange?: (name: string, value: any) => void;

    /**
     * 是否翻译 init(name) 中的 name(getValues 会把带。的字符串转换成对象)
     * @defaultValue false
     */
    parseName?: boolean;

    /**
     * 仅建议 PureComponent 的组件打开此强制刷新功能，会带来性能问题 (500 个组件为例：打开的时候 render 花费 700ms, 关闭时候 render 花费 400ms)
     * @defaultValue false
     */
    forceUpdate?: boolean;

    /**
     * 自动删除 (remove) Unmout 元素，如果想保留数据可以设置为 false
     * @defaultValue true
     */
    autoUnmount?: boolean;

    /**
     * 是否修改数据的时候就自动触发校验，设为 false 后只能通过 validate() 来触发校验
     * @defaultValue true
     */
    autoValidate?: boolean;

    /**
     * 初始化数据
     */
    values?: FieldValues;

    /**
     * 校验时发现第一个错误就返回
     * @defaultValue false
     */
    first?: boolean;

    /**
     * 定制默认错误校验信息模板
     */
    messages?: MessagesConfig;

    /**
     * 处理错误信息
     * @param message - 错误信息字符串
     * @returns - 处理后的错误信息
     */
    processErrorMessage?: (message: string) => string;

    /**
     * 校验结束并 rerender 之后的回调
     * @param results - 校验结果和一些元信息
     */
    afterValidateRerender?: (results: {
        errorsGroup: ValidateErrorGroup | null;
        options: FieldOption;
        instance: Record<string, unknown>;
    }) => void;
}

export type RequiredSome<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type NormalizedFieldOption = RequiredSome<
    FieldOption,
    'parseName' | 'forceUpdate' | 'first' | 'onChange' | 'autoUnmount' | 'autoValidate'
>;

export type Rule = {
    /**
     * 是否必填 (不能和 pattern 同时使用)
     * @defaultValue true
     */
    required?: boolean;

    /**
     * 出错时候信息
     */
    message?: string;

    /**
     * 校验正则表达式
     */
    pattern?: string | RegExp;
    /**
     * 字符串最小长度 / 数组最小个数
     */
    minLength?: number;
    /**
     * 字符串最大长度 / 数组最大个数
     */
    maxLength?: number;

    /**
     * 字符串精确长度 / 数组精确个数
     */
    length?: number;

    /**
     * 最小值
     */
    min?: number;

    /**
     * 最大值
     */
    max?: number;
    /**
     * 对常用 pattern 的总结
     */
    format?: PresetFormatter;

    /**
     * 自定义校验，(校验成功的时候不要忘记执行 callback(),否则会校验不返回)
     */
    validator?: Validator;

    /**
     * 触发校验的事件名称
     */
    trigger?: string | string[];
};

export type InitOption<
    ValueType = any,
    ValueName extends string = 'value',
    Trigger extends string = 'onChange',
    Props = object,
> = {
    /**
     * 唯一标识
     */
    id?: string;
    /**
     * 组件值的属性名称，如 Checkbox 的是 checked，Input 是 value
     * @defaultValue 'value'
     */
    valueName?: ValueName;

    /**
     * 组件初始值 (组件第一次 render 的时候才会读取，后面再修改此值无效),类似 defaultValue
     */
    initValue?: ValueType;

    /**
     * 触发数据变化的事件名称
     * @defaultValue 'onChange'
     */
    trigger?: Trigger;

    /**
     * 校验规则
     */
    rules?: Rule[] | Rule;

    /**
     * 自动校验
     * @defaultValue true
     */
    autoValidate?: boolean;

    /**
     * 组件自定义的事件可以写在这里，其他会透传 (小包版本^0.3.0 支持，大包^0.7.0 支持)
     */
    props?: Props;

    /**
     * 自定义从组件获取 `value` 的方式，参数顺序和组件的 onChange 完全一致的
     */
    getValueFormatter?: (eventArgs: any) => ValueType;
    /**
     * @deprecated Use `getValueFormatter` instead
     */
    getValueFromEvent?: (eventArgs: any) => ValueType;
    /**
     * 自定义转换 `value` 为组件需要的数据
     */
    setValueFormatter?: (value: ValueType, ...restArgs: unknown[]) => any;

    /**
     * 自定义重新渲染函数
     */
    reRender?: RerenderFunction;
};

export type WatchTriggerType = 'init' | 'change' | 'setValue' | 'unmount' | 'reset';

export interface WatchCallback {
    (name: string, value: unknown, oldValue: unknown, triggerType: WatchTriggerType): void;
}

export interface GetUseFieldOption {
    useState: typeof useState;
    useMemo: typeof useMemo;
}

export type SetState = Dispatch<SetStateAction<any>>;

export type ComponentInstance = Component | { setState: SetState } | unknown;

/**
 * 字段校验状态
 * @example
 * - '': 初始状态
 * - 'loading': 正在校验
 * - 'success': 校验成功
 * - 'error': 校验错误
 */
export type FieldState = '' | 'loading' | 'success' | 'error';

export interface FieldMeta extends Pick<InitOption, 'getValueFormatter' | 'setValueFormatter' | 'rules'> {
    name?: string;
    value?: unknown;
    _value?: unknown;
    initValue?: unknown;
    disabled?: boolean;
    state?: FieldState;
    valueName?: string;
    trigger?: string;
    inputValues?: unknown[];
    ref?: Ref<unknown>;
    errors?: unknown[];
    rulesMap?: never;
}

export interface NormalizedFieldMeta
    extends Omit<RequiredSome<FieldMeta, 'name' | 'state' | 'valueName' | 'initValue' | 'disabled'>, 'rules'> {
    rules: Rule[];
}

export type UnknownFunction = (...args: unknown[]) => unknown;

export type RerenderType = 'validate' | 'setValue' | 'setError' | 'reset';

export interface RerenderFunction {
    (type?: RerenderType): unknown;
    (type?: string): unknown;
}

export type ValidateCallback = (errors: ValidateErrorGroup | null, values: FieldValues) => unknown;

export type ValidatePromiseResults = {
    errors: ValidateErrorGroup | null;
    values: FieldValues;
};

// 沿用旧的名称
export type ValidateResults = ValidatePromiseResults;

export type ValidateResultFormatter<R> = (results: ValidatePromiseResults) => R | Promise<R>;

export type DynamicKV<K extends string, V> = {
    [k in K]: V;
};

export interface TriggerFunction {
    /**
     * @param eventOrValue - 事件对象或具体数据
     * @param rests - 其它参数
     */
    (eventOrValue: any, ...rests: any[]): any;
}

export type InitResult<ValueName extends string = 'value', Trigger extends string = 'onChange', ValueType = any> = {
    'data-meta': 'Field';
    id: string;
    ref: RefCallback<any>;
} & {
    [k in Exclude<ValueName, Trigger>]: ValueType;
} & {
    [k in Exclude<Trigger, ValueName>]: TriggerFunction;
};
