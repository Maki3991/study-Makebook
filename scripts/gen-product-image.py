#!/usr/bin/env python3
"""MAKEBOOK 产品图批量生成（阶跃星辰 step-image-edit-2，manifest 驱动 + 并发）。

用法：
  python3 scripts/gen-product-image.py --all            # 生成全部 pending 图（跳过已有文件）
  python3 scripts/gen-product-image.py --only hero-alt,og-share
  python3 scripts/gen-product-image.py --all --force    # 全部重新生成
  python3 scripts/gen-product-image.py --list           # 列出清单与状态
  -j 4  并发数（默认 4）

环境：从仓库根 .env 读取 STEPFUN_API_KEY / STEPFUN_BASE_URL（或已 export 的环境变量）。
生成后自动校验 PNG 实际尺寸并打印；API 可能返回与请求不同的方向，验收以
scripts/product-images.md 的标准人工目检为准。
"""
import argparse, json, os, struct, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "product-images.manifest.json"


def load_env():
    env = dict(os.environ)
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip())
    return env


def png_size(path: Path):
    with open(path, "rb") as f:
        head = f.read(26)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return w, h


def gen_one(env, model, defaults, img, force=False):
    out = ROOT / img.get("outDir", defaults["outDir"]) / img["file"]
    if out.exists() and not force:
        return img["id"], "skip(exists)", out, None
    body = json.dumps({
        "model": model,
        "prompt": img["prompt"],
        "size": img["size"],
        "steps": defaults["steps"],
        "cfg_scale": defaults["cfg_scale"],
        "response_format": defaults["response_format"],
    }).encode()
    req = urllib.request.Request(
        f"{env['STEPFUN_BASE_URL']}/images/generations",
        data=body,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {env['STEPFUN_API_KEY']}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.loads(r.read())
        url = d["data"][0]["url"]
        out.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=180) as r, open(out, "wb") as f:
            f.write(r.read())
    except Exception as e:  # noqa: BLE001
        return img["id"], f"FAIL({e})", out, None
    return img["id"], "ok", out, png_size(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("-j", type=int, default=4)
    args = ap.parse_args()

    m = json.loads(MANIFEST.read_text())
    env = load_env()
    if "STEPFUN_API_KEY" not in env:
        sys.exit("缺少 STEPFUN_API_KEY（.env 或环境变量）")

    tasks = m["images"]
    if args.list:
        for img in tasks:
            out = ROOT / img.get("outDir", m["defaults"]["outDir"]) / img["file"]
            mark = "✓" if out.exists() else "·"
            print(f"{mark} {img['id']:<14} {img['file']:<20} [{img['size']}] {img['usage']}")
        return
    if args.only:
        wanted = {s.strip() for s in args.only.split(",") if s.strip()}
        tasks = [i for i in tasks if i["id"] in wanted]
    elif not args.all:
        tasks = [i for i in tasks if i.get("status") == "pending"]
    if not tasks:
        print("没有待生成的图（--all / --only / --force 可改变选择）")
        return

    print(f"生成 {len(tasks)} 张，并发 {args.j} …")
    failed = 0
    with ThreadPoolExecutor(max_workers=args.j) as pool:
        futs = {pool.submit(gen_one, env, m["model"], m["defaults"], img, args.force): img for img in tasks}
        for fut in as_completed(futs):
            img_id, status, out, dims = fut.result()
            dim_txt = f"{dims[0]}x{dims[1]}" if dims else "?"
            print(f"[{status:<14}] {img_id:<14} -> {out.relative_to(ROOT)} ({dim_txt})")
            if status.startswith("FAIL"):
                failed += 1
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
