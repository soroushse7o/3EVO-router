import sys
html = sys.argv[1]
with open("docs/panel.html", "w") as f:
    f.write(html)
print("done")
