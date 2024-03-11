This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### 步骤, 本项目是基于next.js的项目，所以需要安装node.js环境；后端会调用c2Rust的命令，所以需要安装c2Rust的环境
1. 安装依赖
```bash
    npm install --legacy-peer-deps
    apt install build-essential llvm-6.0 clang-6.0 libclang-6.0-dev cmake libssl-dev pkg-config
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env
    cargo install c2rust
```
2. 启动项目
```bash
npm run dev
```
3. 打开浏览器访问
```bash
http://localhost:9000
```

4. 项目打包
```bash
npm run build
```

5. 项目部署
```bash
npm run start
```

