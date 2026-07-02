#!/usr/bin/env python3
"""Download blog images and generate OB markdown - using curl for downloads."""

import json, os, re, subprocess, sys

SERVER = "https://blog.wflixu.cn"
JSON_DIR = "/Users/lixu/code/nblog/public/blocks-data"
BLOGS_DIR = "/Users/lixu/Documents/MYOB/blogs"

POSTS = {
    "3162e542-7db5-801d-96b4-e34bb6371a89": ("阿里百炼 Coding Plan 配置 Claude Code", "2026-03-08"),
    "2e82e542-7db5-805f-a84b-f5c3b02e851b": ("tsdown 更好的库打包工具", "2026-01-25"),
    "2e42e542-7db5-80b9-a0e0-dcf8cbd85133": ("Histoire：Vue 生态更好的 Storybook", "2026-01-24"),
    "01878e92-9bd4-4b74-aab7-3a3351feee77": ("Angular 生命周期", "2026-01-02"),
    "2852e542-7db5-8057-a4a9-f11fe24ccb97": ("Go 网络编程 学习路线图", "2026-01-02"),
    "1652e542-7db5-8026-84f7-e73df544f86b": ("Tauri App 签名 公证", "2025-02-09"),
    "1952e542-7db5-8015-a058-f63614e1cda0": ("应该怎么阅读一本书", "2025-02-09"),
    "1722e542-7db5-803f-881d-c9adc3181d53": ("我的 Mac 开发环境", "2025-01-05"),
    "13e2e542-7db5-80af-b319-f01f63f109e3": ("App Group 命名规则 macOS Dev", "2024-11-14"),
    "1022e542-7db5-8034-aef3-f96c03cc6916": ("Swift Combine 学习笔记", "2024-09-22"),
    "ae26e908-f085-4b06-a3cc-3d5cbcb88046": ("AppKit 和 SwiftUI 互相引用", "2024-09-18"),
    "274da3b7-cf1b-4af1-8750-fa8e77695b6c": ("VSCode Markdown 图片上传插件开发", "2024-09-12"),
    "538af477-0a54-494b-8cd1-60bb411b0b63": ("SwiftUI 中 View 之间的通信", "2024-08-30"),
    "a611469e-bac8-46cb-977a-082146a9a62e": ("Notion 表作为 Blog 的 CMS", "2024-08-30"),
    "b86fe27d-e443-452a-9aab-e0cecf823fca": ("作为前端开发你都经历过怎样的面试", "2024-08-29"),
    "ac5b34ec-cab4-4134-9876-62167380bf46": ("Angular 组件检测 Input 引用类型变化", "2024-08-28"),
    "fe717ee6-3936-4a0b-80d0-8f11149a0ec0": ("前端图形引擎与物理引擎", "2024-08-28"),
    "12ba0009-eed0-47c2-9f8c-fc3e8c5a32f9": ("Vue 新文档变化", "2024-08-28"),
    "ae3eb8dc-3963-4801-a000-e0b9e1422090": ("Angular 为什么", "2024-08-28"),
    "d54aa9cc-677d-40f0-b077-0a19ff9d179a": ("Angular ChangeDetection OnPush", "2024-08-28"),
}

def safe_name(s):
    return re.sub(r'[\\/:*?"<>|]', '', s).strip()

def get_tags(title):
    t = []
    if re.search(r'Angular', title, re.I): t.append("Angular")
    if re.search(r'Swift|SwiftUI|macOS|AppKit|Combine|App\s', title): t.append("Swift")
    if "Go " in title: t.append("Go")
    if re.search(r'Vue|Histoire|tsdown|Storybook|前端|图形', title): t.append("前端")
    if "Tauri" in title: t.append("Tauri")
    if re.search(r'Claude|百炼|Code|AI', title): t.append("AI")
    if "VSCode" in title: t.append("VSCode")
    if "面试" in title: t.append("面试")
    if re.search(r'读书|阅读', title): t.append("阅读")
    if "Notion" in title: t.append("Notion")
    return t

def curl_download(url, dest):
    """Download using curl (more reliable SSL handling on macOS)."""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    r = subprocess.run(["curl", "-sSfL", "-o", dest, url], capture_output=True, timeout=30)
    return r.returncode == 0

def rich_text(rts):
    out = ""
    for rt in rts:
        c = rt.get("text", {}).get("content", "")
        a = rt.get("annotations", {})
        if a.get("bold"): c = f"**{c}**"
        if a.get("italic"): c = f"*{c}*"
        if a.get("code"): c = f"`{c}`"
        href = rt.get("text", {}).get("link")
        if href: c = f"[{c}]({href.get('url','')})"
        out += c
    return out

total_downloaded = 0

for json_file in sorted(os.listdir(JSON_DIR)):
    if not json_file.endswith(".json"): continue
    pid = json_file.replace(".json","")
    if pid not in POSTS: continue
    
    title, date = POSTS[pid]
    safe = safe_name(title)
    fn = f"{safe}.md"
    out_path = os.path.join(BLOGS_DIR, fn)
    
    if os.path.exists(out_path):
        print(f"  ⏭ {title}")
        continue
    
    with open(os.path.join(JSON_DIR, json_file)) as f:
        blocks = json.load(f)
    
    assets_dir = os.path.join(BLOGS_DIR, f"{safe}.md_assets")
    lines = []
    img_count = 0
    
    for block in blocks:
        btype = block.get("type", "")
        data = block.get(btype, {})
        text = rich_text(data.get("rich_text", []))
        
        if btype == "heading_1": lines.append(f"\n# {text}\n")
        elif btype == "heading_2": lines.append(f"\n## {text}\n")
        elif btype == "heading_3": lines.append(f"\n### {text}\n")
        elif btype == "paragraph": lines.append(f"{text}\n\n" if text.strip() else "\n")
        elif btype in ("bulleted_list_item", "numbered_list_item"): lines.append(f"- {text}\n")
        elif btype == "code":
            lines.append(f"\n```{data.get('language','')}\n{text}\n```\n\n")
        elif btype == "quote": lines.append(f"> {text}\n\n")
        elif btype == "to_do": lines.append(f"{'- [x]' if data.get('checked') else '- [ ]'} {text}\n")
        elif btype == "callout": lines.append(f"> **{data.get('icon','')} {text}**\n\n")
        elif btype == "divider": lines.append("\n---\n\n")
        elif btype == "image":
            caption = " ".join(rt.get("plain_text","") for rt in data.get("caption", []))
            file_info = data.get("file", {}) or {}
            url = file_info.get("url", "") or data.get("external", {}).get("url", "")
            
            if url.startswith("/assets/"):
                filename = url.replace("/assets/images/", "")
                server_url = f"{SERVER}{url}"
                dest = os.path.join(assets_dir, filename)
                
                if not os.path.exists(dest):
                    if curl_download(server_url, dest):
                        sz = os.path.getsize(dest)
                        print(f"    📥 {filename} ({sz} bytes)")
                        img_count += 1
                        total_downloaded += 1
                    else:
                        print(f"    ❌ 下载失败: {filename}")
                else:
                    img_count += 1
                
                lines.append(f"![[{filename}]]\n\n")
            elif url:
                lines.append(f"![{caption}]({url})\n\n")
            else:
                lines.append(f"\n*[图片: {caption}]*\n\n")
        elif btype == "bookmark":
            u = data.get("url","")
            if u: lines.append(f"- **链接**: [{u}]({u})\n")
        elif text:
            lines.append(f"{text}\n")
    
    tags = get_tags(title)
    tag_str = "[" + ", ".join(f'"{t}"' for t in tags) + "]"
    
    with open(out_path, 'w') as f:
        f.write(f"""---
date: {date}
tags: {tag_str}
---

{"".join(lines)}""")
    
    print(f"  ✅ {title} ({img_count}张图片)")

print(f"\n总计下载 {total_downloaded} 张图片")
