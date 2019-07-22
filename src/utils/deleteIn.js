export default function deleteIn(state, name) {
    if (!state) {
        return;
    }

    const path = name
        .replace(/\[/, '.')
        .replace(/\]/, '')
        .split('.');
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
