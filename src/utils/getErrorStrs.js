import { isValidElement, cloneElement } from 'react';

function cloneAndAddKey(element) {
    if (element && isValidElement(element)) {
        return cloneElement(element, { key: 'error' });
    }
    return element;
}

export default function getErrorStrs(errors) {
    if (errors) {
        return errors.map(function(e) {
            const message = e.message || e;
            return cloneAndAddKey(message);
        });
    }
    return errors;
}
