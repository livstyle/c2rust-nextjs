
'use client'
import { Editor, loader } from "@monaco-editor/react";
import { Button, Divider, Select, message } from "antd";
import { useEffect, useState } from "react";

import { transform } from "./actions";

loader.config({
    paths: {
        vs: '/monaco-assets/vs'
    }
});

export default function Home() {
    const [cScript, setCScript] = useState<string>([
        '// Welcome to C2Rust!, Please write your C code here ',
        '// and click on the "Convert" button to convert it to Rust code.',
        '#include <stdio.h>',
      ].join('\n'));
    
      const [rustScript, setRustScript] = useState<string>([
        '// Welcome to C2Rust!, There is Rust code here ',
        'use std::io;',
      ].join('\n'));

    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (loading) {
            setRustScript('');
            const hide = message.loading('转换中......', 0);
            transform(cScript, 'ZHIPU')
            .then((res) => {
                setRustScript(res.script || '// 转换失败......');
            })
            .catch((err) => {
                message.error('Failed to transform code: '+ err.message);
                console.error(err);
            })
            .finally(() => {
                hide();
                setLoading(false);
            })
        }
    }, [loading]);
    
    return (
    <div style={{
        width: '100vw',
        height: '100vh',
        // flexDirection: 'row',
        // display: 'flex',
        // justifyItems: 'center',
        // alignItems: 'center', 
    }}>
        <div style={{
            width: '100%',
            flexDirection: 'row',
            display: 'flex',
            justifyItems: 'center',
            alignItems: 'center', 
        }}>
            <div style={{ width: '48%' }}>
                <Editor
                height="60vh" 
                defaultLanguage="c" 
                defaultValue={cScript}
                value={cScript}
                language='c'
                onChange={(editor, monaco) => {
                    console.log('editorDidMount', editor);
                    if (editor)
                    setCScript(editor);
                }}
                />
            </div>
            <div style={{ width: '48%' }}>
                <Editor 
                height="60vh" 
                defaultLanguage="rust" 
                defaultValue={rustScript}
                value={rustScript}
                language='rust'
                />
            </div>
        </div>
        <Divider><span style={{ color: 'blue' }} >C2RUST</span></Divider>
        <div style={{
            marginLeft: 20,
            marginTop: 20,
            display: 'flex',
            flexDirection: 'row',
        }}>
            <div style={{ marginLeft: '30%' }}>
                <Button 
                style={{ color: 'black', backgroundColor: 'green', borderColor: 'green' }}
                type='primary'
                onClick={() => {
                    console.log('Transforming code...');
                    // setRustScript(cScript);
                    setLoading(true);
                }}
                >Transform</Button>
            </div> 
            <div style={{ marginLeft: 100 }}>
                <span style={{ marginRight: 10 }}>使用已有C代码</span>
                <Select
                   style={{ width: 200 }}
                   options={[
                        { label: 'C++继承转为Rust基于Trait的组合', value: 'cExtend' },
                        { label: '弱指针', value: 'weakPtr' },
                        { label: '变参函数', value: 'varParam' },
                        { label: '堆内存安全', value: 'heapSecret' },
                        { label: '多线程安全', value: 'mutiThread' },
                        { label: '函数式宏', value: 'functionMacro' },
                   ]}
                   onChange={(value) => {
                        if (value) {
                            console.log('Select value:', value);
                            setCScript(demoMap[value as keyof typeof demoMap]);
                            setLoading(true);
                        }
                   }}
                />
            </div>   
        </div>             
    </div>
    )
}

const demoMap= {
    cExtend: `class AbstractK {
    public:
    double r;
    double p;
    AbstractK(const double & r, const double & p) : r(r), p(p) {};
    virtual const bool isInside() const = 0;
    virtual const bool overlap() const = 0;
}
class K2D : public AbstractK {
    public:
    K2D(const double & r, const double & p) : AbstractK(r, p) {};
    virtual const bool overlap() const override;
}
class K3D : public AbstractK {
    public:
    K3D(const double & r, const double & p) : AbstractK(r, p) {};
    virtual const bool overlap() const override;
    class SquareK {
    public:
    SquareK(const double & r, const double & p) : K2D(c, r) {};
    virtual const bool isInside() const override; 
}
class CubeK {
    public:
    CubeK(const double & r, const double & p) : K3D(c, r) {};
    virtual const bool isInside() const override;
}
`,
    weakPtr: ` #include <iostream>
#include <memory>
struct MyStruct {
    int value;
    MyStruct(int v) : value(v) {
        std::cout << "Constructor\\n";
    }
    ~MyStruct() {
        std::cout << "Destructor\\n";
    }
};
int main() {
    std::shared_ptr<MyStruct> ptr = std::make_shared<MyStruct>(10);
    std::weak_ptr<MyStruct> weak_ptr = ptr; // 创建弱指针
    if (auto shared_ptr = weak_ptr.lock()) { // 尝试获取共享指针
        shared_ptr->value = 20; // 修改数据
        std::cout << "Value: " << shared_ptr->value << "\\n";
    }
    return 0;
}
`,
    varParam: `#include <iostream>
#include <cstdarg>
void print_values(int n, ...) {
    va_list vl;
    va_start(vl, n);
    for (int i = 0; i < n; i++) {
        int value = va_arg(vl, int);
        std::cout << "Value: " << value << "\\n";
    }
    va_end(vl);
}
int main() {
    print_values(3, 10, 20, 30);
    return 0;
}`,
    heapSecret: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = 10;
    free(ptr);
    free(ptr);
    printf("%d", *ptr);
    return 0;
}`,
    mutiThread: `#include <pthread.h>
#include <stdlib.h>
//全局共享变量
int data = 0;
void* increment(void* v) {
    for (int i = 0; i < 1000000; i++) {
        data++;
    }
    return NULL;
}
int main() {
    pthread_t t1, t2;
    //创建两个并发执行的线程
    pthread_create(&t1, NULL, increment, NULL);
    pthread_create(&t2, NULL, increment, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
}`,
    functionMacro: `#define CPPMAX(x,y) ((x)+(y) < 5?y:x)`
}
