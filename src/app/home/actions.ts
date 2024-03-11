'use server'
import * as fs from 'node:fs';
import { exec } from "child_process"

export async function transform(cScript: string) {
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
                return
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return
            }
            rustScript = fs.readFileSync(codePath, 'utf-8')
            console.log(`stdout: ${stdout}`);
            fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.c`)
            fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.o`)
            fs.unlinkSync(`/tmp/c2rustcodes/${codeId}.json`)
            resolve(1)
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

