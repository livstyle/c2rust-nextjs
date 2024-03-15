'use server'
import * as fs from 'node:fs';
import { exec } from "child_process"

export async function transform(cScript: string, options: string) {
    return await transformMap[options as keyof typeof transformMap](cScript)
}

const transformMap = {
    'C2Rust': c2rustRustVersion,
    'ZHIPU': ZHIPU,
}

export async function ZHIPU(cScript: string) {
    const response = await fetch('http://localhost:9001/transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Convert the C++ code to Rust: ' + cScript,
        }),
    })

    const data = await response.text()
    console.log('data===>', data)
    // 通过正则表达式提取 ``` ``` 之间的内容, 即rust代码 并将剩下的内容按每行分割
    const rustScript = data?.match(/{"text":"```rust\n([\s\S]*)```"}/)?.[1]
    return {
        script: rustScript,
    }
}

export async function ChatGpt35(cScript: string) {
    
}

export async function c2rustRustVersion(cScript: string) {
    const { v4 } = require('uuid')
    const codeId = v4().replace(/-/g, '')
    fs.writeFileSync(`/tmp/c2rustcodes/${codeId}.c`, cScript)
    const codePath = `/tmp/c2rustcodes/${codeId}.rs`
    // 生成compile_commands.json
    const temp = [
        {
          "directory": "/tmp/c2rustcodes",
          "command": `gcc -c -o ${codeId}.o ${codeId}.c`,
          "file": `/tmp/c2rustcodes/${codeId}.c`
        }
    ]
    fs.writeFileSync(`/tmp/c2rustcodes/${codeId}.json`, JSON.stringify(temp))

    let rustScript = ''
    await new Promise((resolve, reject) => {
        exec(`c2rust transpile /tmp/c2rustcodes/${codeId}.json`, (error, stdout, stderr) => {
            if (error) {
                console.error(`error: ${error.message}`);
                reject(error.message)
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(stderr)
            }
            rustScript = fs.readFileSync(codePath, 'utf-8')
            console.log(`stdout: ${stdout}`);
            fs.access(`/tmp/c2rustcodes/${codeId}.c`, (err) => {
                if (!err) {
                    fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.c`)
                } else {
                    console.log('c文件不存在')
                }
            })
            fs.access(`/tmp/c2rustcodes/${codeId}.json`, (err) => {
                if (!err) {
                    fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.json`)
                } else {
                    console.log('json文件不存在')
                }
            })   
            fs.access(`/tmp/c2rustcodes/${codeId}.o`, (err) => {
                if (!err) {
                    fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.o`)
                } else {
                    console.log('o文件不存在')
                }
            })
            resolve(rustScript)
        })
    })
    return {
        script: rustScript || `use std::io; 
fn main() { 
    println!("Hello, world!"); 
}    
    `,
  }
}
