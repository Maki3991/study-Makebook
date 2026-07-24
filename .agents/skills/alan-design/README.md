# Alan Design Skill

这是为 Alan Yang 定制的 Codex / ChatGPT Design Skill。

## 文件结构

```text
alan-design/
├── SKILL.md
└── agents/
    └── openai.yaml
```

## 安装到所有 Codex 项目

将整个 `alan-design` 文件夹放到：

```text
~/.agents/skills/alan-design/
```

## 仅安装到当前项目

将整个文件夹放到项目根目录：

```text
.agents/skills/alan-design/
```

最终路径应为：

```text
.agents/skills/alan-design/SKILL.md
```

## 调用

在 Codex 中可以输入：

```text
$alan-design
```

也可以直接描述 UI、网页、展板、PPT、作品集或视觉优化任务。Skill 的 description 匹配时，Codex 可自动调用。

若没有立即出现，重启 Codex。
