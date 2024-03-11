'use server'
import * as fs from 'node:fs';
import { exec } from "child_process"

export async function transform(cScript: string) {
    const { v4 } = require('uuid')
    const codeId = v4().replace(/-/g, '')

    fs.writeFileSync(`/tmp/${codeId}.c`, cScript)

    const codePath = `/tmp/${codeId}.rs`
    let rustScript = ''
    await exec(`c2rust transpile /tmp/${codeId}.c > ${codePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return
        }
        rustScript = stdout
        console.log(`stdout: ${stdout}`);
    })
    return {
        script: rustScript || `use std::io; 
fn main() { 
    println!("Hello, world!"); 
}    
    `,
  }
}

