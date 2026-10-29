#!/usr/bin/env node
import { createServer } from "http";
const port = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port")+1] : 20128);
const server = createServer((req,res)=>{ res.end("3EVO Router running on "+port); });
server.listen(port, "127.0.0.1", ()=> console.log("3EVO Router listening on http://127.0.0.1:"+port));
process.on("SIGTERM", ()=>{ console.log("shutting down"); process.exit(0); });
