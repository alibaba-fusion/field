export default function getIn(state, name) {
    if (!state) {
        return state;
    }

    const path = name
        .replace(/\[/, '.')
        .replace(/\]/, '')
        .split('.');
    const length = path.length;
    if (!length) {
        return undefined;
    }

    let result = state;
    for (let i = 0; i < length && !!result; ++i) {
        result = result[path[i]];
    }

    return result;
}
