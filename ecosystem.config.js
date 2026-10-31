module.exports = {
  apps: [
    { name: "3evo-next", script: "npm", args: "run start", cwd: "./", port: 3000 },
    { name: "3evo-gateway", script: "npx", args: "tsx src/gateway/server.ts", cwd: "./", port: 3011 },
  ],
};
