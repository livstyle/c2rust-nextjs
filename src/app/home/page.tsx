'use client'

import { Editor } from "@monaco-editor/react";
import { Button, message } from "antd";
import { useEffect, useState } from "react";

import { transform } from "./actions";

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
            const hide = message.loading('Action in progress..', 0);
            transform(cScript)
            .then((res) => {
                setRustScript(res.script);
            })
            .catch((err) => {
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
        flexDirection: 'row',
        display: 'flex',
        justifyItems: 'center',
        alignItems: 'center', 
    }}>
        <div style={{ width: '45%' }}>
            <Editor
            height="100vh" 
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
        <div>
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
        <div style={{ width: '45%' }}>
            <Editor 
            height="100vh" 
            defaultLanguage="rust" 
            defaultValue={rustScript}
            value={rustScript}
            language='rust'
            />
        </div>                
    </div>
    )
}