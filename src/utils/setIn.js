const setInWithPath = (state, value, path, pathIndex) => {
    if (pathIndex >= path.length) {
        return value;
    }

    const first = path[pathIndex];
    const next = setInWithPath(
        state && state[first],
        value,
        path,
        pathIndex + 1
    );

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

export default function setIn(state, name, value) {
    return setInWithPath(
        state,
        value,
        name
            .replace(/\[/, '.')
            .replace(/\]/, '')
            .split('.'),
        0
    );
}
