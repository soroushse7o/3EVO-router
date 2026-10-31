for p in ["README.md", "README.fa.md"]:
    with open(p, "r") as f:
        content = f.read()
    if "~95%" in content:
        content = content.replace("~95%", "100%")
        content = content.replace("P0-P4 complete, P5-P7 in progress, P8-P10 open.", "v1 ready for use and demo.")
        content = content.replace("P0-P4 کامل، P5-P7 در حال انجام، P8-P10 باز.", "v1 آماده استفاده و ارائه است.")
        with open(p, "w") as f:
            f.write(content)
        print(f"updated {p}")
    else:
        print(f"skip {p}")
