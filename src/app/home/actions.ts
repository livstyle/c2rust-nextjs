'use server'
import * as fs from 'node:fs';
import { exec } from "child_process"
import OpenAI from "openai";

export async function transform(cScript: string, options: string) {
    return await transformMap[options as keyof typeof transformMap](cScript)
}

const transformMap = {
    // 'C2Rust': c2rustRustVersion,
    'C2Rust': c2rustWithProject,
    'ZHIPU': ZHIPU,
}

export async function ZHIPU(cScript: string) {

    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, 200000);

    const response = await fetch('http://localhost:9001/transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Convert the C++ code to Rust: ' + cScript,
        }),
        signal: controller.signal,
    })
    if (timeId) {
        clearTimeout(timeId);
    }

    // console.log('response===>', response)

    const data = await response.text()
    // console.log('data===>', data)
    // 通过正则表达式提取 ``` ``` 之间的内容, 即rust代码 并将剩下的内容按每行分割
    const rustScript = data?.match(/(```rust|``` rust)([\s\S]*)```/)?.[0] || data
    console.log('rustScript===>', rustScript)
    return {
        script: rustScript?.replace('```rust', '').replace('``` rust', '').replace('``` rust', '').replace('```', '')
        .replaceAll('\\n', '\n')                                        
        .replace("\"", '"')
        .replaceAll("\\n\\n", "\n")
        .replaceAll("\\nn", "\n")
        .replaceAll("\\\\n", "\n")
        .replaceAll("\\\\nn", "\n")
        .replaceAll("\\", "") || '',
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
    const temp1 = [
        {
          "directory": "/tmp/c2rustcodes",
          "command": `gcc -c -o /tmp/c2rustcodes/${codeId}.o /tmp/c2rustcodes/${codeId}.c`,
          "file": `/tmp/c2rustcodes/${codeId}.c`
        }
    ]
    const temp = [
        {
          "directory": "/tmp/c2rustcodes",
          "command": `gcc -c -o ${codeId}.o ${codeId}.c`,
          "file": `${codeId}.c`
        }
    ]
    fs.writeFileSync(`/tmp/c2rustcodes/${codeId}.json`, JSON.stringify(temp))
    fs.access(`/tmp/c2rustcodes/${codeId}.json`, (err) => {
        if (!err) {
            const json = fs.readFileSync(`/tmp/c2rustcodes/${codeId}.json`, 'utf-8')
            console.log('json文件存在====>', json)
            // console.log('json文件存在')
        } else {
            console.log('json文件不存在')
        }
    })

    let rustScript = ''
    await new Promise((resolve, reject) => {

        exec(`c2rust transpile /tmp/c2rustcodes/${codeId}.json`, (error, stdout, stderr) => {
            console.log(`stdout: ${stdout}`);
            fs.access(`/tmp/c2rustcodes/${codeId}.c`, (err) => {
                if (!err) {
                    fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.c`)
                } else {
                    console.log('c文件不存在')
                }
            })
            // fs.access(`/tmp/c2rustcodes/${codeId}.json`, (err) => {
            //     if (!err) {
            //         fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.json`)
            //     } else {
            //         console.log('json文件不存在')
            //     }
            // })   
            fs.access(`/tmp/c2rustcodes/${codeId}.rs`, (err) => {
                if (!err) {
                    rustScript = fs.readFileSync(codePath, 'utf-8')
                    fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.rs`)
                } else {
                    console.log('rs文件不存在')
                }
            })
            if (error) {
                console.error(`error: ${error.message}`);
                // reject(error.message)
                resolve('')
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                // reject(stderr)
                resolve('')
            }
            resolve(rustScript)
        })
    })
    return {
        script: rustScript || `use std::io; 
fn translate() { 
    println!("Hello, world!"); 
}    
    `,
  }
}


export async function c2rustWithProject(cScript: string, options?: {
    projectName: string;
}) {
    const { v4 } = require('uuid')
    const v4s = v4().split('-')
    const dirBase = v4s[0]
    const codeId = v4s[1] //.replace(/-/g, '')
    const projectPath = `/tmp/c2rustcodes/${dirBase}/${codeId}`
    const buildPath = `/tmp/c2rustcodes/${dirBase}/build`
    const language = 'c'
    fs.mkdirSync(`/tmp/c2rustcodes/${dirBase}`)
    fs.mkdirSync(projectPath)
    fs.mkdirSync(buildPath)
    fs.writeFileSync(`${projectPath}/translate.${language}`, cScript)
    const codePath = `${projectPath}/translate.rs`
    // 创建 CMakeLists.txt文件
    fs.writeFileSync(`${projectPath}/CMakeLists.txt`, `cmake_minimum_required(VERSION 3.22.1)
project(${options?.projectName || codeId})
add_executable(${options?.projectName || codeId} translate.${language})
    `)
    // 生成compile_commands.json
    await new Promise((resolve, reject) => {
        exec(`
                cd ${buildPath} 
                cmake ../${codeId} -DCMAKE_EXPORT_COMPILE_COMMANDS=1 
                # cmake --build .
                c2rust transpile compile_commands.json
            `
            , (error, stdout, stderr) => {
            console.log(`stdout: ${stdout}`);
            if (error) {
                console.error(`error: ${error.message}`);
                reject(error.message)
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(stderr)
            }
            resolve('')
        })
    })

    // const execTask = await new Promise((resolve, reject) => {
    //     exec(`cd ${buildPath} && c2rust transpile compile_commands.json`, (error, stdout, stderr) => {
    //         console.log(`stdout: ${stdout}`);
    //         if (error) {
    //             console.error(`error: ${error.message}`);
    //             reject(error.message)
    //         }
    //         if (stderr) {
    //             console.error(`stderr: ${stderr}`);
    //             reject(stderr)
    //         }
    //         resolve('')
    //     })
    // })

    let rustScript = ''
    try {
        fs.accessSync(`${projectPath}/translate.rs`)
        rustScript = fs.readFileSync(`${projectPath}/translate.rs`, 'utf-8')
    } catch (error) {
        console.error('error===>', error)
        rustScript = (error as any)?.message || ''
    }

    return {
        script: rustScript || ''
    }

}

function newOpenApi() {
    const openai = new OpenAI();
}
