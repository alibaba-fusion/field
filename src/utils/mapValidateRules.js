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
export default function mapValidateRules(rules, defaultTrigger) {
    const rulesMap = {};

    rules.forEach(rule => {
        validateMap(rulesMap, rule, defaultTrigger);
    });

    return rulesMap;
}
