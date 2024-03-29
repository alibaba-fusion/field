---
title: 自定义错误 - custom errors
order: 3
---

自己控制组件的errors

---

set errors of component by yourself

```jsx
import ReactDOM from 'react-dom';
import React from 'react';
import { Input, Button } from '@alifd/next';
import Field from '@alifd/field';

class App extends React.Component {
    field = new Field(this);

    validate = () => {
        console.log(this.field.getErrors());
        this.field.validateCallback((error, values) => {
            alert(JSON.stringify(error));
        });
    };

    render() {
        const { init, getError, setError, setErrors } = this.field;
        return (
            <div className="demo">
                <Input
                    {...init('input', {
                        rules: [
                            {
                                required: true,
                                pattern: /hello/,
                                message: 'must be hello',
                            },
                        ],
                    })}
                />
                <br />
                <span style={{ color: 'red' }}>{getError('input')}</span>

                <br />
                <Button
                    onClick={() => {
                        setError('input', 'set error 1');
                    }}
                >
                    setError
                </Button>

                <Button
                    onClick={() => {
                        setErrors({ input: 'set error 2' });
                    }}
                >
                    setErrors
                </Button>

                <Button
                    onClick={() => {
                        setErrors({ input: '' });
                    }}
                >
                    clear
                </Button>

                <br />
                <br />
                <Input {...init('input2')} />
                <br />
                <span style={{ color: 'red' }}>{getError('input2')}</span>
                <br />

                <Button
                    onClick={() => {
                        setError(
                            'input2',
                            'errors will be removed by onChange and shown on validate'
                        );
                    }}
                >
                    setError
                </Button>

                <Button onClick={this.validate}>validate</Button>
            </div>
        );
    }
}

ReactDOM.render(<App />, mountNode);
```

```css
.demo .next-btn {
    margin-right: 5px;
}
```
