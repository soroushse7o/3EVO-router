p = "src/app/(dashboard)/providers/page.tsx"
with open(p, "r") as f:
    content = f.read()
content = content.replace('const connected = !!conns[n];', 'const connected = !!conns[n];\n              const verified = conns[n]?.verified;')
content = content.replace('{connected ? "Connected" : "Disconnected"}', '{connected ? (verified ? "Verified" : "Connected") : "Disconnected"}')
with open(p, "w") as f:
    f.write(content)
print("done")
