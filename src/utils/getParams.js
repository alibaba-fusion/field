export default function getParams(ns, cb) {
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
