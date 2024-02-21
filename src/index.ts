import { Component, MutableRefObject } from 'react';
import Validate from '@alifd/validate';
import { NormalizedValidateError } from '@alifd/validate/lib/types';
import {
    getValueFromEvent,
    getErrorStrs,
    getParams,
    hasIn,
    setIn,
    getIn,
    deleteIn,
    mapValidateRules,
    warning,
    cloneToRuleArr,
    isOverwritten,
} from './utils';
import {
    FieldOption,
    ComponentInstance,
    GetUseFieldOption,
    FieldMeta,
    RerenderFunction,
    WatchCallback,
    NormalizedFieldOption,
    InitOption,
    FieldValues,
    NormalizedFieldMeta,
    Rule,
    FieldState,
    ValidateCallback,
    ValidateResultFormatter,
    ValidateErrorGroup,
    RerenderType,
    WatchTriggerType,
    SetState,
    ValidatePromiseResults,
    InitResult,
} from './types';

const initMeta = {
    state: '' as const,
    valueName: 'value',
    trigger: 'onChange',
    inputValues: [],
};

class Field {
    static create(com: ComponentInstance, options: FieldOption = {}) {
        return new this(com, options);
    }

    static getUseField({ useState, useMemo }: GetUseFieldOption) {
        return (options: FieldOption = {}) => {
            const [, setState] = useState();

            const field = useMemo(() => this.create({ setState }, options), [setState]);

            return field;
        };
    }

    private com: ComponentInstance;
    private fieldsMeta: Record<string, FieldMeta>;
    private cachedBind: Record<string, Record<string, unknown>>;
    private instance: Record<string, unknown>;
    private instanceCount: Record<string, number>;
    private reRenders: Record<string, RerenderFunction>;
    private listeners: Record<string, Set<WatchCallback>>;
    private values: FieldValues;
    private processErrorMessage?: FieldOption['processErrorMessage'];
    private afterValidateRerender?: FieldOption['afterValidateRerender'];
    options: NormalizedFieldOption;

    constructor(com: ComponentInstance, options: FieldOption = {}) {
        if (!com) {
            warning('`this` is missing in `Field`, you should use like `new Field(this)`');
        }

        this.com = com;
        this.fieldsMeta = {};
        this.cachedBind = {};
        this.instance = {};
        this.instanceCount = {};
        this.reRenders = {};
        this.listeners = {};
        // holds constructor values. Used for setting field defaults on init if no other value or initValue is passed.
        // Also used caching values when using `parseName: true` before a field is initialized
        this.values = Object.assign({}, options.values);

        this.processErrorMessage = options.processErrorMessage;
        this.afterValidateRerender = options.afterValidateRerender;

        this.options = Object.assign(
            {
                parseName: false,
                forceUpdate: false,
                first: false,
                onChange: () => {},
                autoUnmount: true,
                autoValidate: true,
            },
            options
        );

        (
            [
                'init',
                'getValue',
                'getValues',
                'setValue',
                'setValues',
                'getError',
                'getErrors',
                'setError',
                'setErrors',
                'validateCallback',
                'validatePromise',
                'getState',
                'reset',
                'resetToDefault',
                'remove',
                'spliceArray',
                'addArrayValue',
                'deleteArrayValue',
                'getNames',
            ] as const
        ).forEach((m) => {
            this[m] = this[m].bind(this);
        });
    }

    /**
     * 设置配置信息
     * @param options - 配置
     */
    setOptions(options: Partial<FieldOption>) {
        Object.assign(this.options, options);
    }

    init<ValueType = any, OtherProps extends object = object>(
        name: string,
        option?: InitOption<ValueType, never, never, OtherProps>,
        rprops?: OtherProps
    ): Omit<OtherProps, keyof InitResult<'value', 'onChange', ValueType>> & InitResult<'value', 'onChange', ValueType>;
    init<
        ValueType = any,
        ValueName extends string = 'value',
        Trigger extends string = 'onChange',
        OtherProps extends object = object,
    >(
        name: string,
        option?: InitOption<ValueType, ValueName, Trigger, OtherProps>,
        rprops?: OtherProps
    ): Omit<OtherProps, keyof InitResult<ValueName, Trigger, ValueType>> & InitResult<ValueName, Trigger, ValueType>;
    /**
     * 初始化一个字段项
     * @param name - 字段 key
     * @param option - 字段配置
     * @param rprops - 其它参数
     */
    init<ValueType, ValueName extends string, Trigger extends string, OtherProps extends object>(
        name: string,
        option: InitOption<ValueType, ValueName, Trigger, OtherProps> = {},
        rprops?: OtherProps
    ) {
        const {
            id,
            initValue,
            valueName = 'value',
            trigger = 'onChange',
            rules = [],
            props = {},
            getValueFromEvent = null,
            getValueFormatter = getValueFromEvent,
            setValueFormatter,
            autoValidate = true,
            reRender,
        } = option;
        const { parseName } = this.options;

        if (getValueFromEvent) {
            warning('`getValueFromEvent` has been deprecated in `Field`, use `getValueFormatter` instead of it');
        }

        const originalProps = Object.assign({}, props, rprops) as Record<string, unknown>;
        const defaultValueName = `default${valueName[0].toUpperCase()}${valueName.slice(1)}`;
        let defaultValue;
        if (typeof initValue !== 'undefined') {
            defaultValue = initValue;
        } else if (typeof originalProps[defaultValueName] !== 'undefined') {
            // here use typeof, in case of defaultValue={0}
            defaultValue = originalProps[defaultValueName];
        }

        // get field from this.fieldsMeta or new one
        const field = this._getInitMeta(name) as NormalizedFieldMeta;
        Object.assign(field, {
            valueName,
            initValue: defaultValue,
            disabled: 'disabled' in originalProps ? originalProps.disabled : false,
            getValueFormatter,
            setValueFormatter,
            rules: cloneToRuleArr(rules),
            ref: originalProps.ref,
        });

        let oldValue = field.value;

        // Controlled Component, should always equal props.value
        if (valueName in originalProps) {
            const originalValue = originalProps[valueName];

            // When rerendering set the values from props.value
            if (parseName) {
                // when parseName is true, field should not store value locally. To prevent sync issues
                if (!('value' in field)) {
                    this._proxyFieldValue(field);
                }
            } else {
                this.values[name] = originalValue;
            }
            field.value = originalValue;
        }

        /**
         * first init field (value not in field)
         * should get field.value from this.values or defaultValue
         */
        if (!('value' in field)) {
            if (parseName) {
                const cachedValue = getIn(this.values, name);
                if (typeof cachedValue !== 'undefined') {
                    oldValue = cachedValue;
                }
                const initValue = typeof cachedValue !== 'undefined' ? cachedValue : defaultValue;
                // when parseName is true, field should not store value locally. To prevent sync issues
                this._proxyFieldValue(field);
                field.value = initValue;
            } else {
                const cachedValue = this.values[name];
                if (typeof cachedValue !== 'undefined') {
                    field.value = cachedValue;
                    oldValue = cachedValue;
                } else if (typeof defaultValue !== 'undefined') {
                    // should be same with parseName, but compatible with old versions
                    field.value = defaultValue;
                    this.values[name] = field.value;
                }
            }
        }

        // field value init end
        const newValue = field.value;
        this._triggerFieldChange(name, newValue, oldValue, 'init');

        // Component props
        const inputProps = {
            'data-meta': 'Field',
            id: id || name,
            ref: this._getCacheBind(name, `${name}__ref`, this._saveRef),
            [valueName]: setValueFormatter
                ? setValueFormatter(field.value as any, field.inputValues)
                : (field.value as any),
        };

        let rulesMap: Record<string, Omit<Rule, 'trigger'>[]> = {};

        if (this.options.autoValidate && autoValidate !== false) {
            // trigger map in rules,
            rulesMap = mapValidateRules(field.rules, trigger);

            // step1 : validate hooks
            for (const action in rulesMap) {
                // skip default trigger, which will trigger in step2
                if (action === trigger) {
                    continue;
                }

                const actionRule = rulesMap[action];
                inputProps[action] = (...args: unknown[]) => {
                    this._callNativePropsEvent(action, originalProps, ...args);
                    this._validate(name, actionRule, action);
                };
            }
        }

        // step2: onChange(trigger=onChange by default) hack
        inputProps[trigger] = (...args: unknown[]) => {
            const oldValue = this.getValue(name);
            this._updateFieldValue(name, ...args);
            const newValue = this.getValue(name);
            this._triggerFieldChange(name, newValue, oldValue, 'change');

            // clear validate error
            this._resetError(name);

            this._callNativePropsEvent(trigger, originalProps, ...args);
            // call global onChange
            this.options.onChange(name, field.value);

            // validate while onChange
            const rule = rulesMap[trigger];
            rule && this._validate(name, rule, trigger);

            this._reRender(name, trigger);
        };

        // step3: save reRender function
        if (reRender && typeof reRender === 'function') {
            this.reRenders[name] = reRender;
        }

        delete originalProps[defaultValueName];

        return Object.assign({}, originalProps, inputProps) as OtherProps & InitResult<ValueName, Trigger, ValueType>;
    }

    /**
     * 获取单个输入控件的值
     * @param name - 字段名
     * @returns 字段值
     */
    getValue<T = unknown>(name: string): T | undefined {
        if (this.options.parseName) {
            return getIn(this.values, name);
        }
        return this.values[name] as T;
    }

    /**
     * 获取一组输入控件的值
     * @param names - 字段名数组
     * @returns 不传入`names`参数，则获取全部字段的值
     */
    getValues<T = Record<string, unknown>>(names?: string[]): T {
        const allValues: Record<string, unknown> = {};

        if (names && names.length) {
            names.forEach((name) => {
                allValues[name] = this.getValue(name);
            });
        } else {
            Object.assign(allValues, this.values);
        }

        return allValues as T;
    }

    /**
     * 设置单个输入控件的值（默认会触发 render，请遵循 react 时机使用)
     * @param name - 字段名
     * @param value - 字段值
     * @param reRender - 设置完成后是否重新渲染，默认为 true
     * @param triggerChange - 是否触发 watch change，默认为 true
     */
    setValue(name: string, value: unknown, reRender = true, triggerChange = true) {
        const oldValue = this.getValue(name);
        if (name in this.fieldsMeta) {
            this.fieldsMeta[name].value = value;
        }
        if (this.options.parseName) {
            this.values = setIn(this.values, name, value);
        } else {
            this.values[name] = value;
        }
        const newValue = this.getValue(name);
        if (triggerChange) {
            this._triggerFieldChange(name, newValue, oldValue, 'setValue');
        }
        reRender && this._reRender(name, 'setValue');
    }

    /**
     * 设置一组输入控件的值（默认会触发 render，请遵循 react 时机使用)
     * @param fieldsValue - 一组输入控件值对象
     * @param reRender - 设置完成后是否重新渲染，默认为 true
     */
    setValues(fieldsValue: Record<string, unknown> = {}, reRender = true) {
        if (!this.options.parseName) {
            Object.keys(fieldsValue).forEach((name) => {
                this.setValue(name, fieldsValue[name], false, true);
            });
        } else {
            // NOTE: this is a shallow merge
            // Ex. we have two values a.b.c=1 ; a.b.d=2, and use setValues({a:{b:{c:3}}}) , then because of shallow merge a.b.d will be lost, we will get only {a:{b:{c:3}}}
            // fieldsMeta[name].value is proxy from this.values[name] when parseName is true, so there is no need to assign value to fieldMeta
            // shallow merge
            let newValues = Object.assign({}, this.values, fieldsValue);
            const fields = this.getNames();
            const allOldFieldValues = this.getValues(fields);
            // record all old field values, exclude items overwritten by fieldsValue
            const oldFieldValues = fields
                .filter((name) => !isOverwritten(fieldsValue, name))
                .map((name) => ({ name, value: this.fieldsMeta[name].value }));
            // assign lost field value to newValues
            oldFieldValues.forEach(({ name, value }) => {
                if (!hasIn(newValues, name)) {
                    newValues = setIn(newValues, name, value);
                }
            });
            // store the new values
            this.values = newValues;

            // trigger changes after update
            for (const name of fields) {
                this._triggerFieldChange(name, this.getValue(name), allOldFieldValues[name], 'setValue');
            }
        }
        reRender && this._reRender();
    }

    /**
     * 获取单个输入控件的 Error
     * @param name - 字段名
     * @returns 该字段的 Error
     */
    getError(name: string) {
        const field = this._get(name);
        if (field && field.errors && field.errors.length) {
            return field.errors;
        }

        return null;
    }

    /**
     * 获取一组输入控件的 Error
     * @param names - 字段名列表
     * @returns 不传入`names`参数，则获取全部字段的 Error
     */
    getErrors<K extends string>(names?: K[]) {
        const fields = names || this.getNames();
        const allErrors = {} as Record<K, unknown[] | null>;
        fields.forEach((f: K) => {
            allErrors[f] = this.getError(f);
        });
        return allErrors;
    }

    /**
     * 设置单个输入控件的 Error
     * @param name - 字段名
     * @param errors - 错误信息
     */
    setError(name: string, errors?: unknown) {
        const err: unknown[] = Array.isArray(errors) ? errors : errors ? [errors] : [];
        if (name in this.fieldsMeta) {
            this.fieldsMeta[name].errors = err;
        } else {
            this.fieldsMeta[name] = {
                errors: err,
            };
        }

        if (this.fieldsMeta[name].errors && this.fieldsMeta[name].errors!.length > 0) {
            this.fieldsMeta[name].state = 'error';
        } else {
            this.fieldsMeta[name].state = '';
        }

        this._reRender(name, 'setError');
    }

    /**
     * 设置一组输入控件的 Error
     */
    setErrors(fieldsErrors: Record<string, unknown> = {}) {
        Object.keys(fieldsErrors).forEach((name) => {
            this.setError(name, fieldsErrors[name]);
        });
    }

    /**
     * 获取单个字段的校验状态
     * @param name - 字段名
     */
    getState(name: string): FieldState {
        const field = this._get(name);

        if (field && field.state) {
            return field.state;
        }

        return '';
    }

    /**
     * 校验全部字段
     * @param callback - 校验结果的回调函数
     */
    validateCallback(callback?: ValidateCallback): void;
    /**
     * 校验指定字段
     * @param names - 字段名或字段名列表
     * @param callback - 校验结果回调函数
     */
    validateCallback(names?: string | string[], callback?: ValidateCallback): void;
    /**
     * 校验 - Callback version
     */
    validateCallback(ns?: string | string[] | ValidateCallback, cb?: ValidateCallback) {
        const { names, callback } = getParams(ns, cb);
        const fieldNames = names || this.getNames();

        const descriptor: Record<string, Rule[]> = {};
        const values: FieldValues = {};

        let hasRule = false;
        for (let i = 0; i < fieldNames.length; i++) {
            const name = fieldNames[i];
            const field = this._get(name) as NormalizedFieldMeta;

            if (!field) {
                continue;
            }

            if (field.rules && field.rules.length) {
                descriptor[name] = field.rules;
                values[name] = this.getValue(name);
                hasRule = true;

                // clear error
                field.errors = [];
                field.state = '';
            }
        }

        if (!hasRule) {
            const errors = this.formatGetErrors(fieldNames);
            callback && callback(errors, this.getValues(names ? fieldNames : []));
            return;
        }

        const validate = new Validate(descriptor, {
            first: this.options.first,
            messages: this.options.messages,
        });

        validate.validate(values, (errors) => {
            let errorsGroup: ValidateErrorGroup | null = null;
            if (errors && errors.length) {
                errorsGroup = {};
                errors.forEach((e) => {
                    const fieldName = e.field;
                    if (!errorsGroup![fieldName]) {
                        errorsGroup![fieldName] = {
                            errors: [],
                        };
                    }
                    const fieldErrors = errorsGroup![fieldName].errors;
                    fieldErrors.push(e.message);
                });
            }
            if (errorsGroup) {
                // update error in every Field
                Object.keys(errorsGroup).forEach((i) => {
                    const field = this._get(i);
                    if (field) {
                        field.errors = getErrorStrs(errorsGroup![i].errors, this.processErrorMessage);
                        field.state = 'error';
                    }
                });
            }

            const formattedGetErrors = this.formatGetErrors(fieldNames);

            if (formattedGetErrors) {
                errorsGroup = Object.assign({}, formattedGetErrors, errorsGroup);
            }

            // update to success which has no error
            for (let i = 0; i < fieldNames.length; i++) {
                const name = fieldNames[i];
                const field = this._get(name);
                if (field && field.rules && !(errorsGroup && name in errorsGroup)) {
                    field.state = 'success';
                }
            }

            callback && callback(errorsGroup, this.getValues(names ? fieldNames : []));
            this._reRender(names, 'validate');

            this._triggerAfterValidateRerender(errorsGroup);
        });
    }

    /**
     * Promise 方式校验全部字段
     */
    async validatePromise(): Promise<ValidatePromiseResults>;
    /**
     * Promise 方式校验指定字段
     * @param names - 字段名或字段名列表
     */
    async validatePromise(names?: string | string[]): Promise<ValidatePromiseResults>;
    /**
     * Promise 方式校验所有字段，并使用一个函数处理校验结果
     * @param formatter - 校验结果处理函数
     */
    async validatePromise<FormatterResults>(
        formatter?: (results: ValidatePromiseResults) => FormatterResults | Promise<FormatterResults>
    ): Promise<FormatterResults>;
    /**
     * Promise 方式校验指定字段，并使用一个函数处理校验结果
     * @param names - 字段名或字段名列表
     * @param formatter - 校验结果处理函数
     */
    async validatePromise<FormatterResults>(
        names?: string | string[],
        formatter?: (results: ValidatePromiseResults) => FormatterResults | Promise<FormatterResults>
    ): Promise<typeof formatter extends undefined ? ValidatePromiseResults : FormatterResults>;
    /**
     * 校验 - Promise version
     */
    async validatePromise<FormatterResults>(
        ns?: string | string[] | ValidateResultFormatter<FormatterResults>,
        formatter?: ValidateResultFormatter<FormatterResults>
    ) {
        const { names, callback } = getParams(ns, formatter);
        const fieldNames = names || this.getNames();

        const descriptor: Record<string, Rule[]> = {};
        const values: FieldValues = {};

        let hasRule = false;
        for (let i = 0; i < fieldNames.length; i++) {
            const name = fieldNames[i];
            const field = this._get(name) as NormalizedFieldMeta;

            if (!field) {
                continue;
            }

            if (field.rules && field.rules.length) {
                descriptor[name] = field.rules;
                values[name] = this.getValue(name);
                hasRule = true;

                // clear error
                field.errors = [];
                field.state = '';
            }
        }

        if (!hasRule) {
            const errors = this.formatGetErrors(fieldNames);
            if (callback) {
                return callback({
                    errors,
                    values: this.getValues(names ? fieldNames : []),
                });
            } else {
                return {
                    errors,
                    values: this.getValues(names ? fieldNames : []),
                };
            }
        }

        const validate = new Validate(descriptor, {
            first: this.options.first,
            messages: this.options.messages,
        });

        const results = await validate.validatePromise(values);
        const errors = (results && results.errors) || [];

        const errorsGroup = this._getErrorsGroup({ errors, fieldNames });

        let callbackResults: ValidatePromiseResults | FormatterResults = {
            errors: errorsGroup,
            values: this.getValues(names ? fieldNames : []),
        };
        try {
            if (callback) {
                callbackResults = await callback(callbackResults);
            }
        } catch (error) {
            return error;
        }
        this._reRender(names, 'validate');
        // afterValidateRerender 作为通用属性，在 callback 和 promise 两个版本的 validate 中保持相同行为
        this._triggerAfterValidateRerender(errorsGroup);
        return callbackResults;
    }

    /**
     * 重置一组输入控件的值，并清空校验信息
     * @param names - 要重置的字段名，不传递则重置全部字段
     */
    reset(ns?: string | string[]) {
        this._reset(ns, false);
    }

    /**
     * 重置一组输入控件的值为默认值，并清空校验信息
     * @param names - 要重置的字段名，不传递则重置全部字段
     */
    resetToDefault(ns?: string | string[]) {
        this._reset(ns, true);
    }

    /**
     * 获取所有字段名列表
     */
    getNames() {
        const fieldsMeta = this.fieldsMeta;
        return Object.keys(fieldsMeta).filter(() => {
            return true;
        });
    }

    /**
     * 删除某一个或者一组控件的数据，删除后与之相关的 validate/value 都会被清空
     * @param name - 要删除的字段名，不传递则删除全部字段
     */
    remove(ns?: string | string[]) {
        if (typeof ns === 'string') {
            ns = [ns];
        }
        if (!ns) {
            this.values = {};
        }

        const names = ns || Object.keys(this.fieldsMeta);
        names.forEach((name) => {
            if (name in this.fieldsMeta) {
                delete this.fieldsMeta[name];
            }
            if (this.options.parseName) {
                this.values = deleteIn(this.values, name);
            } else {
                delete this.values[name];
            }
        });
    }

    /**
     * 向指定数组字段内添加数据
     * @param name - 字段名
     * @param index - 开始添加的索引
     * @param argv - 新增的数据
     */
    addArrayValue(name: string, index: number, ...argv: unknown[]) {
        return this._spliceArrayValue(name, index, 0, ...argv);
    }

    /**
     * 删除指定字段数组内的数据
     * @param name - 变量名
     * @param index - 开始删除的索引
     * @param howmany - 删除几个数据，默认为 1
     */
    deleteArrayValue(name: string, index: number, howmany = 1) {
        return this._spliceArrayValue(name, index, howmany);
    }

    /**
     * splice in a Array [deprecated]
     * @deprecated Use `addArrayValue` or `deleteArrayValue` instead
     * @param keyMatch - like name.\{index\}
     * @param startIndex - index
     */
    spliceArray(keyMatch: string, startIndex: number) {
        // @ts-expect-error FIXME 无效的 if 逻辑，恒定为 false
        if (keyMatch.match(/{index}$/) === -1) {
            warning('key should match /{index}$/');
            return;
        }

        // regex to match field names in the same target array
        const reg = keyMatch.replace('{index}', '(\\d+)');
        const keyReg = new RegExp(`^${reg}`);

        const listMap: Record<string, Array<{ from: string; to: string }>> = {};
        /**
         * keyMatch='key.\{index\}'
         * case 1: names=['key.0', 'key.1'], should delete 'key.1'
         * case 2: names=['key.0.name', 'key.0.email', 'key.1.name', 'key.1.email'], should delete 'key.1.name', 'key.1.email'
         */
        const names = this.getNames();
        const willChangeNames: string[] = [];
        names.forEach((n) => {
            // is name in the target array?
            const ret = keyReg.exec(n);
            if (ret) {
                const index = parseInt(ret[1]);

                if (index > startIndex) {
                    const l = listMap[index];
                    const item = {
                        from: n,
                        to: `${keyMatch.replace('{index}', (index - 1).toString())}${n.replace(ret[0], '')}`,
                    };
                    willChangeNames.push(item.from);
                    if (names.includes(item.to)) {
                        willChangeNames.push(item.to);
                    }
                    if (!l) {
                        listMap[index] = [item];
                    } else {
                        l.push(item);
                    }
                }
            }
        });
        const oldValues = this.getValues(willChangeNames);

        const idxList = Object.keys(listMap)
            .map((i) => {
                return {
                    index: Number(i),
                    list: listMap[i],
                };
            })
            // @ts-expect-error FIXME 返回 boolean 值并不能正确排序
            .sort((a, b) => a.index < b.index);

        // should be continuous array
        if (idxList.length > 0 && idxList[0].index === startIndex + 1) {
            idxList.forEach((l) => {
                const list = l.list;
                list.forEach((i) => {
                    const v = this.getValue(i.from); // get index value
                    this.setValue(i.to, v, false, false); // set value to index - 1
                });
            });

            const lastIdxList = idxList[idxList.length - 1];
            lastIdxList.list.forEach((i) => {
                this.remove(i.from);
            });

            let parentName = keyMatch.replace('.{index}', '');
            parentName = parentName.replace('[{index}]', '');
            const parent = this.getValue(parentName) as unknown[];

            if (parent) {
                // if parseName=true then parent is an Array object but does not know an element was removed
                // this manually decrements the array length
                parent.length--;
            }
        }
        for (const name of willChangeNames) {
            this._triggerFieldChange(name, this.getValue(name), oldValues[name], 'setValue');
        }
    }

    /**
     * 获取全部字段信息
     * @param name - 传递 falsy 值
     */
    get(name?: undefined | ''): Record<string, NormalizedFieldMeta>;
    /**
     * 获取指定字段信息
     * @param name - 字段名
     */
    get(name: string): NormalizedFieldMeta | null;
    get(name?: string) {
        if (name) {
            return this._get(name);
        } else {
            return this.fieldsMeta;
        }
    }

    /**
     * 监听字段值变化
     * @param names - 监听的 name 列表
     * @param callback - 变化回调
     * @returns 解除监听回调
     */
    watch(names: string[], callback: WatchCallback) {
        for (const name of names) {
            if (!this.listeners[name]) {
                this.listeners[name] = new Set();
            }
            const set = this.listeners[name];
            set.add(callback);
        }
        return () => {
            for (const name of names) {
                if (this.listeners[name]) {
                    this.listeners[name].delete(callback);
                }
            }
        };
    }

    private _get(name: string) {
        return name in this.fieldsMeta ? this.fieldsMeta[name] : null;
    }

    private _getInitMeta(name: string) {
        if (!(name in this.fieldsMeta)) {
            this.fieldsMeta[name] = Object.assign({ name }, initMeta);
        }

        return this.fieldsMeta[name];
    }

    private _getErrorsGroup({ errors, fieldNames }: { errors: NormalizedValidateError[]; fieldNames: string[] }) {
        let errorsGroup: ValidateErrorGroup | null = null;
        if (errors && errors.length) {
            errorsGroup = {};
            errors.forEach((e) => {
                const fieldName = e.field;
                if (!errorsGroup![fieldName]) {
                    errorsGroup![fieldName] = {
                        errors: [],
                    };
                }
                const fieldErrors = errorsGroup![fieldName].errors;
                fieldErrors.push(e.message);
            });
        }
        if (errorsGroup) {
            // update error in every Field
            Object.keys(errorsGroup).forEach((i) => {
                const field = this._get(i);
                if (field) {
                    field.errors = getErrorStrs(errorsGroup![i].errors, this.processErrorMessage);
                    field.state = 'error';
                }
            });
        }

        const formattedGetErrors = this.formatGetErrors(fieldNames);

        if (formattedGetErrors) {
            errorsGroup = Object.assign({}, formattedGetErrors, errorsGroup);
        }

        // update to success which has no error
        for (let i = 0; i < fieldNames.length; i++) {
            const name = fieldNames[i];
            const field = this._get(name);
            if (field && field.rules && !(errorsGroup && name in errorsGroup)) {
                field.state = 'success';
            }
        }

        return errorsGroup;
    }

    private _reset(ns?: string | string[], backToDefault?: boolean) {
        if (typeof ns === 'string') {
            ns = [ns];
        }
        let changed = false;

        const names = ns || Object.keys(this.fieldsMeta);

        const oldValues = this.getValues(names);
        if (!ns) {
            this.values = {};
        }
        names.forEach((name) => {
            const field = this._get(name);
            if (field) {
                changed = true;

                field.value = backToDefault ? field.initValue : undefined;
                field.state = '';

                delete field.errors;
                delete field.rules;
                delete field.rulesMap;

                if (this.options.parseName) {
                    this.values = setIn(this.values, name, field.value);
                } else {
                    this.values[name] = field.value;
                }
            }
            this._triggerFieldChange(name, this.getValue(name), oldValues[name], 'reset');
        });

        if (changed) {
            this._reRender(names, 'reset');
        }
    }

    private _resetError(name: string) {
        const field = this._get(name);
        if (field) {
            delete field.errors; //清空错误
            field.state = '';
        }
    }

    private _reRender(name?: string | string[], action?: RerenderType | string) {
        // 指定了字段列表且字段存在对应的自定义渲染函数
        if (name) {
            const names = Array.isArray(name) ? name : [name];
            if (names.length && names.every((n) => this.reRenders[n])) {
                names.forEach((n) => {
                    const reRender = this.reRenders[n];
                    reRender(action);
                });
                return;
            }
        }

        if (this.com) {
            if (!this.options.forceUpdate && (this.com as { setState: SetState }).setState) {
                (this.com as { setState: SetState }).setState({});
            } else if ((this.com as Component).forceUpdate) {
                (this.com as Component).forceUpdate(); //forceUpdate 对性能有较大的影响，成指数上升
            }
        }
    }

    /**
     * Get errors using `getErrors` and format to match the structure of errors returned in field.validate
     */
    private formatGetErrors(names?: string[]) {
        const errors = this.getErrors(names);
        let formattedErrors: ValidateErrorGroup | null = null;
        for (const field in errors) {
            if (errors.hasOwnProperty(field) && errors[field]) {
                const errorsObj = errors[field]!;
                if (!formattedErrors) {
                    formattedErrors = {};
                }
                formattedErrors[field] = { errors: errorsObj };
            }
        }
        return formattedErrors;
    }

    /**
     * call native event from props.onXx
     * eg: props.onChange props.onBlur props.onFocus
     */
    private _callNativePropsEvent(action: string, props: Record<string, unknown>, ...args: unknown[]) {
        action in props &&
            typeof props[action] === 'function' &&
            (props[action] as (...args: unknown[]) => unknown)(...args);
    }

    private _proxyFieldValue(field: NormalizedFieldMeta) {
        const _this = this;
        Object.defineProperty(field, 'value', {
            configurable: true,
            enumerable: true,
            get() {
                return getIn(_this.values, this.name);
            },
            set(v) {
                // 此处 this 解释同上
                _this.values = setIn(_this.values, this.name, v);
                return true;
            },
        });
    }

    /**
     * update field.value and validate
     */
    private _updateFieldValue(name: string, ...others: unknown[]) {
        const e = others[0];
        const field = this._get(name);

        if (!field) {
            return;
        }
        field.value = field.getValueFormatter ? field.getValueFormatter.apply(this, others) : getValueFromEvent(e);
        field.inputValues = others;

        if (this.options.parseName) {
            this.values = setIn(this.values, name, field.value);
        } else {
            this.values[name] = field.value;
        }
    }

    /**
     * ref must always be the same function, or if not it will be triggerd every time.
     */
    private _getCacheBind<Args extends unknown[], Result>(
        name: string,
        action: string,
        fn: (name: string, ...args: Args) => Result
    ): (...args: Args) => Result {
        const cache = (this.cachedBind[name] = this.cachedBind[name] || {});
        if (!cache[action]) {
            cache[action] = fn.bind(this, name);
        }
        return cache[action] as (...args: Args) => Result;
    }

    private _setCache(name: string, action: string, hander: unknown) {
        const cache = (this.cachedBind[name] = this.cachedBind[name] || {});
        cache[action] = hander;
    }

    private _getCache<R = unknown>(name: string, action: string): R | undefined {
        const cache = this.cachedBind[name] || {};
        return cache[action] as R | undefined;
    }

    private _saveRef(name: string, component: unknown) {
        const key = `${name}_field`;
        const autoUnmount = this.options.autoUnmount;

        if (!component && autoUnmount) {
            // more than one component, do nothing
            this.instanceCount[name] && this.instanceCount[name]--;
            if (this.instanceCount[name] > 0) {
                return;
            }

            // component with same name (eg: type ? <A name="n"/>:<B name="n"/>)
            // while type changed, B will render before A unmount. so we should cached value for B
            // step: render -> B mount -> 1. _saveRef(A, null) -> 2. _saveRef(B, ref) -> render
            // 1. _saveRef(A, null)
            const cache = this.fieldsMeta[name];
            if (cache) {
                if (this.options.parseName) {
                    // 若 parseName 模式下，因为 value 为 getter、setter，所以将当前值记录到_value 内
                    cache._value = cache.value;
                }
                this._setCache(name, key, cache);
            }

            // after destroy, delete data
            delete this.instance[name];
            delete this.reRenders[name];
            const oldValue = this.getValue(name);
            this.remove(name);
            const newValue = this.getValue(name);
            this._triggerFieldChange(name, newValue, oldValue, 'unmount');
            return;
        }

        // 2. _saveRef(B, ref) (eg: same name but different compoent may be here)
        if (autoUnmount && !this.fieldsMeta[name] && this._getCache(name, key)) {
            const cache = this._getCache<NormalizedFieldMeta>(name, key)!;
            this.fieldsMeta[name] = cache;
            // 若 parseName 模式，则使用_value 作为值设置到 values 内
            this.setValue(name, this.options.parseName ? cache._value : cache.value, false, false);
            this.options.parseName && '_value' in cache && delete cache._value;
        }

        // only one time here
        const field = this._get(name);

        if (field) {
            //When the autoUnmount is false, the component uninstallation needs to clear the verification information to avoid blocking the validation.
            if (!component && !autoUnmount) {
                field.state = '';
                delete field.errors;
                delete (field as FieldMeta).rules;
                delete field.rulesMap;
            }
            const ref = field.ref;
            if (ref) {
                if (typeof ref === 'string') {
                    throw new Error(`can not set string ref for ${name}`);
                } else if (typeof ref === 'function') {
                    ref(component);
                } else if (typeof ref === 'object' && 'current' in ref) {
                    // while ref = React.createRef() ref={ current: null}
                    (ref as MutableRefObject<unknown>).current = component;
                }
            }

            // mount
            if (autoUnmount && component) {
                let cnt = this.instanceCount[name];
                if (!cnt) {
                    cnt = 0;
                }

                this.instanceCount[name] = cnt + 1;
            }

            this.instance[name] = component;
        }
    }

    private _validate(name: string, rule: Omit<Rule, 'trigger'>[], trigger: string) {
        const field = this._get(name);
        if (!field) {
            return;
        }

        const value = field.value;

        field.state = 'loading';
        let validate = this._getCache<Validate>(name, trigger);

        if (validate && typeof validate.abort === 'function') {
            validate.abort();
        }
        validate = new Validate({ [name]: rule }, { messages: this.options.messages });

        this._setCache(name, trigger, validate);

        validate.validate(
            {
                [name]: value,
            },
            (errors) => {
                let newErrors: string[], newState: FieldState;
                if (errors && errors.length) {
                    newErrors = getErrorStrs(errors, this.processErrorMessage);
                    newState = 'error';
                } else {
                    newErrors = [];
                    newState = 'success';
                }

                let reRender = false;
                // only status or errors changed, Rerender
                if (
                    newState !== field.state ||
                    !field.errors ||
                    newErrors.length !== field.errors.length ||
                    newErrors.find((e, idx) => e !== field.errors![idx])
                ) {
                    reRender = true;
                }

                field.errors = newErrors;
                field.state = newState;

                reRender && this._reRender(name, 'validate');
            }
        );
    }

    /**
     * splice array
     */
    private _spliceArrayValue(key: string, index: number, howmany: number, ...argv: unknown[]) {
        const argc = argv.length;
        const offset = howmany - argc; // how the reset fieldMeta move
        const startIndex = index + howmany; // 计算起点

        /**
         * eg: call _spliceArrayValue('key', 1) to delete 'key.1':
         *   case 1: names=['key.0', 'key.1']; delete 'key.1';
         *   case 2: names=['key.0', 'key.1', 'key.2']; key.1= key.2; delete key.2;
         *   case 3: names=['key.0.name', 'key.0.email', 'key.1.name', 'key.1.email'], should delete 'key.1.name', 'key.1.email'
         * eg: call _spliceArrayValue('key', 1, item) to add 'key.1':
         *   case 1: names=['key.0']; add 'key.1' = item;
         *   case 2: names=['key.0', 'key.1']; key.2= key.1; delete key.1; add key.1 = item;
         */
        const listMap: Record<string, Array<{ from: string; to: string }>> = {}; // eg: {1:[{from: 'key.2.name', to: 'key.1.name'}, {from: 'key.2.email', to: 'key.1.email'}]}
        const replacedReg = /\$/g;
        // 替换特殊字符$
        const replacedKey = key.replace(replacedReg, '\\$&');
        const keyReg = new RegExp(`^(${replacedKey}.)(\\d+)`);
        const replaceArgv: string[] = [];
        const names = this.getNames();
        const willChangeNames: string[] = [];

        // logic of offset fix begin
        names.forEach((n) => {
            const ret = keyReg.exec(n);
            if (ret) {
                const idx = parseInt(ret[2]); // get index of 'key.0.name'

                if (idx >= startIndex) {
                    const l = listMap[idx];
                    const item = {
                        from: n,
                        to: n.replace(keyReg, (match, p1) => `${p1}${idx - offset}`),
                    };
                    willChangeNames.push(item.from);
                    if (names.includes(item.to)) {
                        willChangeNames.push(item.to);
                    }
                    if (!l) {
                        listMap[idx] = [item];
                    } else {
                        l.push(item);
                    }
                }

                // in case of offsetList.length = 0, eg: delete last element
                if (offset > 0 && idx >= index && idx < index + howmany) {
                    replaceArgv.push(n);
                }
            }
        });

        const oldValues = this.getValues(willChangeNames);

        // sort with index eg: [{index:1, list: [{from: 'key.2.name', to: 'key.1.name'}]}, {index:2, list: [...]}]
        const offsetList = Object.keys(listMap)
            .map((i) => {
                return {
                    index: Number(i),
                    list: listMap[i],
                };
            })
            .sort((a, b) => (offset > 0 ? a.index - b.index : b.index - a.index));

        offsetList.forEach((l) => {
            const list = l.list;
            list.forEach((i) => {
                this.fieldsMeta[i.to] = this.fieldsMeta[i.from];
                // 移位后，同步调整 name
                this.fieldsMeta[i.to].name = i.to;
            });
        });

        // delete copy data
        if (offsetList.length > 0) {
            const removeList = offsetList.slice(offsetList.length - (offset < 0 ? -offset : offset), offsetList.length);
            removeList.forEach((item) => {
                item.list.forEach((i) => {
                    delete this.fieldsMeta[i.from];
                });
            });
        } else {
            // will get from this.values while rerender
            replaceArgv.forEach((i) => {
                delete this.fieldsMeta[i];
            });
        }

        const p = this.getValue(key) as unknown[];
        if (p) {
            p.splice(index, howmany, ...argv);
        }

        for (const name of willChangeNames) {
            this._triggerFieldChange(name, this.getValue(name), oldValues[name], 'setValue');
        }

        this._reRender();
    }

    private _triggerFieldChange(name: string, value: unknown, oldValue: unknown, triggerType: WatchTriggerType) {
        // same value should not trigger change
        if (Object.is(value, oldValue)) {
            return;
        }
        const listenerSet = this.listeners[name];
        if (!listenerSet?.size) {
            return;
        }
        for (const callback of listenerSet) {
            callback(name, value, oldValue, triggerType);
        }
    }

    private _triggerAfterValidateRerender(errorsGroup: ValidateErrorGroup | null) {
        if (typeof this.afterValidateRerender === 'function') {
            this.afterValidateRerender({
                errorsGroup,
                options: this.options,
                instance: this.instance,
            });
        }
    }
}

export * from './types';

export default Field;
