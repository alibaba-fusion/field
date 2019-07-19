/**
 * 从组件事件中获取数据
 * @param e Event或者value
 * @returns value
 */
export default function getValueFromEvent(e) {
    // support custom element
    if (!e || !e.target) {
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
