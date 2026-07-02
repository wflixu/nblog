#!/usr/bin/env python3
"""Convert Notion blocks JSON to markdown files for OB - with image handling."""

import json
import os
import re
import shutil
import glob

# Post metadata: id -> (title, date)
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
    "274da3b7-cf1b-4af1-8750-fa8e77695b6c": ("记录一个 VSCode Markdown 图片上传插件开发", "2024-09-12"),
    "538af477-0a54-494b-8cd1-60bb411b0b63": ("SwiftUI 中 View 之间的通信", "2024-08-30"),
    "a611469e-bac8-46cb-977a-082146a9a62e": ("Notion 表作为 Blog 的 CMS", "2024-08-30"),
    "b86fe27d-e443-452a-9aab-e0cecf823fca": ("作为前端开发你都经历过怎样的面试", "2024-08-29"),
    "ac5b34ec-cab4-4134-9876-62167380bf46": ("Angular 组件检测 Input 引用类型变化", "2024-08-28"),
    "fe717ee6-3936-4a0b-80d0-8f11149a0ec0": ("前端图形引擎与物理引擎", "2024-08-28"),
    "12ba0009-eed0-47c2-9f8c-fc3e8c5a32f9": ("Vue 新文档变化", "2024-08-28"),
    "ae3eb8dc-3963-4801-a000-e0b9e1422090": ("Angular 为什么", "2024-08-28"),
    "d54aa9cc-677d-40f0-b077-0a19ff9d179a": ("Angular ChangeDetection OnPush", "2024-08-28"),
}

def get_safe_filename(title):
    """Create safe filename from title."""
    safe = re.sub(r'[\\/:*?"<>|]', '', title).strip()
    safe = re.sub(r'\s+', ' ', safe)
    return safe

def get_tags(title):
    tags = []
    if re.search(r'Angular', title, re.I): tags.append("Angular")
    if re.search(r'Swift|SwiftUI|macOS|AppKit|Combine|App', title): tags.append("Swift")
    if "Go" in title: tags.append("Go")
    if re.search(r'Vue|Histoire|tsdown|Storybook|前端', title): tags.append("前端")
    if "Tauri" in title: tags.append("Tauri")
    if re.search(r'Claude|Code|AI|百炼', title): tags.append("AI")
    if "VSCode" in title: tags.append("VSCode")
    if "面试" in title: tags.append("面试")
    if re.search(r'读书|阅读', title): tags.append("阅读")
    if "Notion" in title: tags.append("Notion")
    if "图形" in title: tags.append("图形")
    return tags

def get_image_id(filename):
    """Extract block id prefix from various image filename patterns.
    Block IDs are UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    """
    # Full UUID pattern
    m = re.match(r'^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', filename, re.I)
    if m:
        return m.group(1)
    return None

def convert_block(block, block_index, img_dir, assets_dir, assets_rel=""):
    """Convert a single Notion block to markdown text. Returns (text, image_copied_flag)."""
    btype = block.get("type", "")
    if not btype:
        return "", False
    
    data = block.get(btype, {})
    rich_text = data.get("rich_text", [])
    
    image_copied = False
    
    def render_rich_text(rts):
        result = ""
        for rt in rts:
            content = rt.get("text", {}).get("content", "")
            annotations = rt.get("annotations", {})
            if annotations.get("bold"): content = f"**{content}**"
            if annotations.get("italic"): content = f"*{content}*"
            if annotations.get("code"): content = f"`{content}`"
            if annotations.get("strikethrough"): content = f"~~{content}~~"
            href = rt.get("text", {}).get("link")
            if href: content = f"[{content}]({href.get('url', '')})"
            result += content
        return result
    
    text = render_rich_text(rich_text)
    
    if btype == "heading_1":
        return f"\n# {text}\n", False
    elif btype == "heading_2":
        return f"\n## {text}\n", False
    elif btype == "heading_3":
        return f"\n### {text}\n", False
    elif btype == "paragraph":
        if text.strip():
            return f"{text}\n\n", False
        return "\n", False
    elif btype == "bulleted_list_item":
        return f"- {text}\n", False
    elif btype == "numbered_list_item":
        return f"1. {text}\n", False
    elif btype == "code":
        language = data.get("language", "")
        return f"\n```{language}\n{text}\n```\n\n", False
    elif btype == "quote":
        return f"> {text}\n\n", False
    elif btype == "to_do":
        checked = data.get("checked", False)
        prefix = "- [x] " if checked else "- [ ] "
        return f"{prefix}{text}\n", False
    elif btype == "callout":
        icon = data.get("icon", "")
        return f"> **{icon} {text}**\n\n", False
    elif btype == "divider":
        return "\n---\n\n", False
    elif btype == "image":
        caption = " ".join(rt.get("plain_text", "") for rt in data.get("caption", []))
        
        # Try local cached file first
        block_id = block.get("id", "")
        ext = data.get("type", "")
        
        # Search for matching file in images cache
        found_img = None
        for f in os.listdir(img_dir):
            # Match by block_id prefix
            img_id = get_image_id(f)
            if img_id == block_id:
                found_img = f
                break
        
        if found_img:
            # Copy to per-note asset directory
            src = os.path.join(img_dir, found_img)
            if assets_dir:
                os.makedirs(assets_dir, exist_ok=True)
                dest = os.path.join(assets_dir, found_img)
                shutil.copy2(src, dest)
                image_copied = True
                alt = caption or "image"
                # Use Obsidian wikilink format - Obsidian auto-finds images in md_assets
                return f"![[{found_img}]]\n\n", True
        
        # Try Notion URL
        file_info = data.get("file", {}) or {}
        url = file_info.get("url", "")
        if not url:
            url = data.get("external", {}).get("url", "")
        
        if url and not url.startswith("/assets/"):
            # External URL - use directly
            alt = caption or "image"
            return f"![{alt}]({url})\n\n", True
        
        # Fallback: look in images cache
        for cache_file in os.listdir(img_dir):
            if cache_file.startswith(block_id):
                src = os.path.join(img_dir, cache_file)
                if assets_dir:
                    os.makedirs(assets_dir, exist_ok=True)
                    shutil.copy2(src, os.path.join(assets_dir, cache_file))
                    image_copied = True
                    return f"![[{cache_file}]]\n\n", True
                break
        
        return f"\n*[图片: {caption}]*\n\n", False
    elif btype == "bookmark":
        url = data.get("url", "")
        if url:
            return f"- **链接**: [{url}]({url})\n", False
        return "", False
    elif btype == "table":
        return "\n*[表格]*\n", False
    elif btype == "equation":
        return f"\n$${text}$$\n", False
    
    # Unknown type - just output text if any
    if text:
        return f"{text}\n", False
    return "", False

def process_post(page_id, json_dir, img_dir, blogs_dir, existing_set):
    """Process a single blog post."""
    if page_id not in POSTS:
        return "unknown"
    
    title, date = POSTS[page_id]
    
    # Skip test/demo
    if title in ("测试 渲染", "AppleScript"):
        return "skipped"
    
    safe_title = get_safe_filename(title)
    filename = f"{safe_title}.md"
    
    # Check if already exists
    if filename.replace(".md", "") in existing_set:
        return "exists"
    
    # Read blocks
    json_path = f"{json_dir}/{page_id}.json"
    if not os.path.exists(json_path):
        return "missing"
    
    with open(json_path) as f:
        blocks = json.load(f)
    
    # Asset directory for this note
    note_assets_dir = f"{blogs_dir}/{safe_title}.md_assets"
    note_assets_rel = f"{safe_title}.md_assets"  # relative path for markdown refs
    
    # Convert all blocks
    lines = []
    total_images_copied = 0
    seen_type = None
    
    for i, block in enumerate(blocks):
        md, copied = convert_block(block, i, img_dir, note_assets_dir, note_assets_rel)
        if copied:
            total_images_copied += 1
        lines.append(md)
    
    # Build frontmatter
    tags = get_tags(title)
    quoted_tags = ['"' + t + '"' for t in tags]
    tag_str = "[" + ", ".join(quoted_tags) + "]"
    
    content = f"""---
date: {date}
tags: {tag_str}
---

""" + "".join(lines)
    
    # Write file
    out_path = os.path.join(blogs_dir, filename)
    with open(out_path, 'w') as f:
        f.write(content)
    
    return f"done ({total_images_copied} images)"


def main():
    img_dir = "/Users/lixu/code/nblog/public/assets/images"
    json_dir = "/Users/lixu/code/nblog/public/blocks-data"
    blogs_dir = "/Users/lixu/Documents/MYOB/blogs"
    
    # Get existing filenames
    existing_set = set()
    for f in os.listdir(blogs_dir):
        if f.endswith(".md"):
            existing_set.add(f.replace(".md", ""))
    
    print(f"nblog 图片缓存目录: {img_dir} ({len(os.listdir(img_dir))} files)")
    print(f"OB blogs 目录: {blogs_dir} ({len([f for f in os.listdir(blogs_dir) if f.endswith('.md')])} .md files)")
    print()
    
    results = {"done": 0, "exists": 0, "skipped": 0, "unknown": 0, "missing": 0}
    
    for json_file in sorted(glob.glob(f"{json_dir}/*.json")):
        page_id = os.path.splitext(os.path.basename(json_file))[0]
        status = process_post(page_id, json_dir, img_dir, blogs_dir, existing_set)
        
        title = POSTS.get(page_id, ("?", ""))[0]
        
        if status.startswith("done"):
            img_count = status.split("(")[1].split(" ")[0] if "(" in status else "0"
            print(f"  ✅ {title} ({img_count}张图片)")
            results["done"] += 1
        elif status == "exists":
            print(f"  ✅ {title} (已存在)")
            results["exists"] += 1
        elif status == "skipped":
            print(f"  ⏭ {title} (跳过)")
            results["skipped"] += 1
        else:
            print(f"  ❌ {page_id} ({status})")
            results[status] = results.get(status, 0) + 1
    
    print(f"\n总计: 转换 {results['done']} 篇, 已存在 {results['exists']} 篇, 跳过 {results['skipped']} 篇")

if __name__ == "__main__":
    main()
