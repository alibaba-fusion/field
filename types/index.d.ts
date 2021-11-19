export type FieldOption = {
    /**
     * 所有组件的change都会到达这里[setValue不会触发该函数]
     */
    onChange?: (name: string, value: any) => void;

    /**
     * 是否翻译init(name)中的name(getValues会把带.的字符串转换成对象)
     * @default false
     */
    parseName?: boolean;

    /**
     * 仅建议PureComponent的组件打开此强制刷新功能，会带来性能问题(500个组件为例：打开的时候render花费700ms, 关闭时候render花费400ms)
     * @default false
     */
    forceUpdate?: boolean;

    /**
     * field.validate的时候滚动到第一个出错的组件, 如果是整数会进行偏移
     * @default true
     */
    scrollToFirstError?: boolean;

    /**
     * 自动删除(remove) Unmout 元素, 如果想保留数据可以设置为false
     * @default true
     */
    autoUnmount?: boolean;

    /**
     * 是否修改数据的时候就自动触发校验, 设为 false 后只能通过 validate() 来触发校验
     * @default true
     */
    autoValidate?: boolean;

    /**
     * 初始化数据
     */
    values?: {};
};

export type InitResult<T> = {
    id: string;
    value?: T;
    onChange(value: T): void;
};

export type InitResult2<T, T2> = {
    id: string;
    value?: T;
    onChange(value: T, extra: T2): void;
};

export type Rule = {
    /**
     * 不能为空 (不能和pattern同时使用)
     * @default true
     */
    required?: boolean;

    /**
     * 出错时候信息
     */
    message?: string;

    /**
     * 校验正则表达式
     */
    pattern?: RegExp;
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
    format?: 'url' | 'email' | 'tel' | 'number';

    /**
     * 自定义校验,(校验成功的时候不要忘记执行 callback(),否则会校验不返回)
     */
    validator?: (
        rule: Rule,
        value: string | number | object | boolean | Date | null,
        callback: (error?: string) => void
    ) => void;

    /**
     * 触发校验的事件名称
     */
    trigger?: 'onChange' | 'onBlur' | string;
};

export type InitOption<T = any> = {
    /**
     * 组件值的属性名称，如 Checkbox 的是 checked，Input是 value
     */
    valueName?: string;

    /**
     * 组件初始值(组件第一次render的时候才会读取，后面再修改此值无效),类似defaultValue
     */
    initValue?: T | T[];

    /**
     * 触发数据变化的事件名称
     * @default 'onChange'
     */
    trigger?: string | 'onChange' | 'onBlur';

    /**
     * 校验规则
     */
    rules?: Rule[] | Rule;

    /**
     * 组件自定义的事件可以写在这里，其他会透传(小包版本^0.3.0支持，大包^0.7.0支持)
     */
    props?: any;

    /**
     * 自定义从组件获取 `value` 的方式，参数顺序和组件的 onChange 完全一致的
     */
    getValueFormatter?: (eventArgs: any) => T;
    /**
     * 自定义转换 `value` 为组件需要的数据
     */
    setValueFormatter?: (value: T) => T;
};

export type ValidateResults = {
    errors: any[],
    values: any
}

export default class Field  {
/**
     *
     * @param contextComp 传入调用class的this
     * @param options 一些事件配置
     */
    constructor(contextComp: any, options?: FieldOption);

    /**
     * 
     * @param contextComp 传入调用class的this
     * @param options 一些事件配置
     */
    static create(contextComp: any, options?: FieldOption): Field;

    /**
     *
     * 
     * @param useState React compatible `useState` function
     * @returns Function
     */
    static getUseField<T>(config: {useState: Function, useMemo: Function}): (options?: FieldOption) => Field;

    /**
     * 初始化每个组件
     */
    init<T>(name: string, option?: InitOption, props?: {}): InitResult<T>;

    /**
     * 初始化每个组件
     */
    init<T, T2>(name: string, option?: InitOption, props?: {}): InitResult2<T, T2>;

    /**
     *
     * 重置一组输入控件的值、清空校验
     * @param names 重置的字段名
     */
    reset(names?: string[] | string): void;
    /**
     *
     * 重置一组输入控件的值为默认值, 相当于reset(name, true)
     * @param names 重置的字段名
     */
    resetToDefault(names?: string[] | string): void;

    /**
     * 删除某一个或者一组控件的数据，删除后与之相关的validate/value都会被清空
     * @param name 字段名称
     */
    remove(name: string | string[]): void;

    /**
     * 校验
     * @param callback
     */
    validateCallback(callback?: (errors: any[], values: object) => void): void;

    /**
     * 校验
     * @param names
     * @param callback
     */
    validateCallback(
        names?: string[] | string,
        callback?: (errors: any[], values: object) => void
    ): void;

    /**
     * 校验
     * @param names
     * @param callback
     */
    validatePromise(
        names?: string[] | string,
        callback?: (errors: any[], values: object) => Promise<any>
    ): Promise<ValidateResults>;

    /**
     * 校验
     * @param names
     */
    validatePromise(
        names?: string[] | string,
    ): Promise<ValidateResults>;

    /**
     * 校验并获取一组输入域的值与Error对象
     */
    /**
     * 	获取所有组件的key
     */
    getNames(): string[];

    /**
     * 	获取单个输入控件的值
     * @param 字段名
     */
    getValue<T>(name: string): T;

    /**
     * 获取一组输入控件的值，如不传入参数，则获取全部组件的值
     * @param names
     */
    getValues<T>(names?: string[]): T;

    /**
     * 设置单个输入控件的值 （会触发render，请遵循react时机使用)
     */
    setValue<T>(name: string, value: T): void;

    /**
     * 设置一组输入控件的值（会触发render，请遵循react时机使用)
     */
    setValues(obj: any): void;

    /**
     * 设置一组输入控件的值（会触发render，请遵循react时机使用)
     */
    setValues<T>(obj: T): void;

    /**
     * 判断校验状态
     */
    getState(name: string): 'error' | 'success' | 'validating';

    /**
     * 获取单个输入控件的 Error
     */
    getError(name: string): null | string[];

    /**
     * 获取一组输入控件的 Error
     * @param names 字段名
     */
    getErrors(names?: string[]): any;

    /**
     * 设置单个输入控件的 Error
     * @param name
     * @param errors
     */
    setError(name: string, errors?: null | string[] | string): void;

    /**
     * 设置一组输入控件的 Error
     */
    setErrors(obj: any): void;

    addArrayValue<T>(key: string, index: number, ...args: T[]): void;
    /**
     * 
     * @param key 变量名
     * @param index 数组的第几个
     * @param howmany 删除几个，默认为1
     */
    deleteArrayValue(key: string, index: number, howmany?: number): void;
}

