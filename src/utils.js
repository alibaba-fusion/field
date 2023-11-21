export function splitNameToPath(name) {
    return typeof name === 'string' && name
        ? name
              .replace(/\[/, '.')
              .replace(/\]/, '')
              .split('.')
        : '';
}

export function hasIn(state, name) {
    if (!state) {
        return state;
    }

    const path = splitNameToPath(name);
    const length = path.length;
    if (!length) {
        return false;
    }

    let result = state;
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
        result = result[thisName];
    }

    return true;
}

export function getIn(state, name) {
    if (!state) {
        return state;
    }

    const path = splitNameToPath(name);
    const length = path.length;
    if (!length) {
        return undefined;
    }

    let result = state;
    for (let i = 0; i < length; ++i) {
        // parent is not object
        if (typeof result !== 'object' || result === null) {
            return undefined;
        }
        result = result[path[i]];
    }

    return result;
}

const setInWithPath = (state, value, path, pathIndex) => {
    if (pathIndex >= path.length) {
        return value;
    }

    const first = path[pathIndex];
    const next = setInWithPath(state && state[first], value, path, pathIndex + 1);

    if (!state) {
        const initialized = isNaN(first) ? {} : [];
        initialized[first] = next;
        return initialized;
    }

    if (Array.isArray(state)) {
        const copy = [].concat(state);
        copy[first] = next;
        return copy;
    }

    return Object.assign({}, state, {
        [first]: next,
    });
};

export function setIn(state, name, value) {
    return setInWithPath(
        state,
        value,
        typeof name === 'string'
            ? name
                  .replace(/\[/, '.')
                  .replace(/\]/, '')
                  .split('.')
            : '',
        0
    );
}

export function deleteIn(state, name) {
    if (!state) {
        return;
    }

    const path =
        typeof name === 'string'
            ? name
                  .replace(/\[/, '.')
                  .replace(/\]/, '')
                  .split('.')
            : '';
    const length = path.length;
    if (!length) {
        return state;
    }

    let result = state;
    for (let i = 0; i < length && !!result; ++i) {
        if (i === length - 1) {
            delete result[path[i]];
        } else {
            result = result[path[i]];
        }
    }

    return state;
}

export function getErrorStrs(errors, processErrorMessage) {
    if (errors) {
        return errors.map(e => {
            const message = typeof e.message !== 'undefined' ? e.message : e;

            if (typeof processErrorMessage === 'function') {
                return processErrorMessage(message);
            }

            return message;
        });
    }
    return errors;
}

export function getParams(ns, cb) {
    let names = typeof ns === 'string' ? [ns] : ns;
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

/**
 * name是否被覆写
 * e.g. { a: { b: 1 } } and 'a.b', should return true
 * e.g. { a: { b: 1 } } and 'a.b.c', should return true
 * e.g. { a: { b: 1 } } and 'a.b2', should return false
 * e.g. { a: { b: 1 } } and 'a2', should return false
 * e.g. { a: { b: [0, 1] } } and 'a.b[0]' return true
 * e.g. { a: { b: [0, 1] } } and 'a.b[5]' return true (miss index means overwritten in array)
 * @param {object} newValues 写入对象
 * @param {string} name 字段key
 */
export function isOverwritten(newValues, name) {
    if (!newValues || typeof newValues !== 'object' || !name || typeof name !== 'string') {
        return false;
    }
    // 若存在这个key，则代表被覆盖
    if (hasIn(newValues, name)) {
        return true;
    }
    const paths = splitNameToPath(name);
    let obj = newValues;
    for (const path of paths) {
        if (path in obj) {
            const pathValue = obj[path];
            // 任意一层path值不是对象了，则代表被覆盖
            if (!pathValue || typeof pathValue !== 'object') {
                return true;
            } else {
                obj = pathValue;
            }
        } else {
            // 数组的index已经移除，则代表被覆写
            if (Array.isArray(obj)) {
                return true;
            }
            return false;
        }
    }
    return false;
}

/**
 * 从组件事件中获取数据
 * @param e Event或者value
 * @returns value
 */
export function getValueFromEvent(e) {
    // support custom element
    if (!e || !e.target || !e.preventDefault) {
        return e;
    }

    const { target } = e;

    if (target.type === 'checkbox') {
        return target.checked;
    } else if (target.type === 'radio') {
        //兼容原生radioGroup
        if (target.value) {
            return target.value;
        } else {
            return target.checked;
        }
    }
    return target.value;
}

function validateMap(rulesMap, rule, defaultTrigger) {
    const nrule = Object.assign({}, rule);

    if (!nrule.trigger) {
        nrule.trigger = [defaultTrigger];
    }

    if (typeof nrule.trigger === 'string') {
        nrule.trigger = [nrule.trigger];
    }

    for (let i = 0; i < nrule.trigger.length; i++) {
        const trigger = nrule.trigger[i];

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
 * @param  {Array} rules   规则
 * @param  {String} defaultTrigger 默认触发
 * @return {Object} {onChange:rule1, onBlur: rule2}
 */
export function mapValidateRules(rules, defaultTrigger) {
    const rulesMap = {};

    rules.forEach(rule => {
        validateMap(rulesMap, rule, defaultTrigger);
    });

    return rulesMap;
}

let warn = () => {};

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
    };
}

export const warning = warn;

export function cloneToRuleArr(rules) {
    if (!rules) {
        return [];
    }
    const rulesArr = Array.isArray(rules) ? rules : [rules];
    // 后续会修改rule对象，这里做浅复制以避免对传入对象的修改
    return rulesArr.map(rule => ({ ...rule }));
}
