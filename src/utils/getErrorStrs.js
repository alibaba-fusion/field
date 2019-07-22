export default function getErrorStrs(errors, processErrorMessage) {
    if (errors) {
        return errors.map(e => {
            const message = e.message || e;

            if (typeof processErrorMessage === 'function') {
                return processErrorMessage(message);
            }

            return message;
        });
    }
    return errors;
}
