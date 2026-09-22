# Electron

## Electron 是什么？

[Electron](https://www.electronjs.org/zh/) 是一个**跨平台桌面应用开发框架**，开发者可以使用：`HTML`、`CSS`、`JavaScript` 等 Web 技术来构建桌面应用程序，它的本质是结合了 **`Chromium`** 和 **`Node.js`**，现在⼴泛用于桌面应用程序开发，例如这写桌面应用都用到了 Electron 技术：
- Visual Studio Code
- GitHub Desktop
- 1Password
- QQ

## Electron 的优势

- **可跨平台**：同一套代码可以构建出能在：Windows、macOS、Linux 上运行的应用程序。 
- **上手容易**：使用 Web 技术就可以轻松完成开发桌面应用程序。 
- **底层权限**：允许应用程序访问文件系统、操作系统等底层功能，从而实现复杂的系统交互。
- **社区支持**：拥有一个庞大的活跃社区，开发者可以轻松找到文件、教程和开源库。 
- **性能优秀**：Electron 使用 Chromium 内核，性能优于传统的桌面应用程序。

## Electron 技术架构

### 技术架构

Electron 由 `Chromium`、`Node.js` 和 `Native API` 组成。

![](./assets/Snipaste_2025-05-25_16-18-16.png)

### 进程模型

Electron 为多进程开发，分为主进程和渲染进程，渲染进程可以有多个。

### 主进程

每个 `Electron` 应用都有一个**单一的主进程**，作为**应用程序的入口点**。 主进程在 `Node.js` 环境中运行，它具有 `require` 模块和使用所有 `Node.js API` 的能力，主进程的核心就是：**使用 `BrowerWindow` 来创建和管理窗口。**

### 渲染进程

每个 `BrowserWindow `实例都**对应一个单独的渲染器进程**，运行在渲染器进程中的代码，必须遵守网页标准，这也就意味着：**渲染器进程无权直接访问 `require` 或使用 `Node.js API`。**

通过 **`Native API`** 可以访问操作系统的功能，例如读写文件、创建窗口、读写系统设置等。

==正是因为有以上的划分，渲染进程不能执行 Node.js 提供的模块（如 fs、path 等）。==

![](./assets/Snipaste_2025-05-25_16-21-40.png)