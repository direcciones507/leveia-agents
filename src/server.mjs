// LeveIA Agents foundation server. No public sign-up or production access until auth/persistence is complete.
import {createServer} from 'node:http';
import {SessionStore} from './auth.mjs';
import {renderAdminPanel} from './admin.mjs';
import {getScopedAssistant,createAssistantForTenant} from './domain.mjs';

export function makeApp({assistants=[],sessions=new SessionStore()}={}){
  return {assistants,sessions,handler:async(req,res)=>{
    const path=new URL(req.url||'/', 'http://localhost').pathname;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    if(path==='/health'&&req.method==='GET'){
      res.writeHead(200);res.end(JSON.stringify({ok:true,phase:'foundation'}));return;
    }
    // No implicit trusted identity. Never accept a client-supplied organizationId as authorization.
    const header=req.headers.authorization||'';
    const token=header.startsWith('Bearer ')?header.slice(7):'';
    const principal=sessions.get(token);
    if(!principal){res.writeHead(401);res.end(JSON.stringify({error:'UNAUTHENTICATED'}));return;}
    if(path==='/admin'&&req.method==='GET'){
      if(principal.role!=='ADMIN'){res.writeHead(403);res.end(JSON.stringify({error:'FORBIDDEN'}));return;}
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      res.setHeader('X-Content-Type-Options','nosniff');
      res.writeHead(200);res.end(renderAdminPanel({principal,assistants}));return;
    }
    const match=path.match(/^\/api\/assistants\/([a-z0-9_-]+)$/);
    if(match&&req.method==='GET'){
      try{
        const a=getScopedAssistant(assistants,principal,match[1]);
        res.writeHead(200);res.end(JSON.stringify({id:a.id,name:a.name,instructions:a.instructions}));
      }catch(e){res.writeHead(404);res.end(JSON.stringify({error:'NOT_FOUND'}));}return;
    }
    if(path==='/api/assistants'&&req.method==='POST'){
      if(principal.role!=='ADMIN'){res.writeHead(403);res.end(JSON.stringify({error:'FORBIDDEN'}));return;}
      try{
        const chunks=[];let bytes=0;
        for await(const chunk of req){bytes+=chunk.length;if(bytes>32768)throw new Error('BODY_TOO_LARGE');chunks.push(chunk);}
        const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const created=createAssistantForTenant(assistants,principal,{...body,organizationId:principal.organizationId});
        res.writeHead(201);res.end(JSON.stringify({id:created.id,name:created.name}));
      }catch{res.writeHead(400);res.end(JSON.stringify({error:'INVALID_REQUEST'}));}return;
    }
    res.writeHead(404);res.end(JSON.stringify({error:'NOT_FOUND'}));
  }};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const port=Number(process.env.PORT||3000);
  // Bind loopback only: not ready for public hosting or production use.
  const app=makeApp();createServer(app.handler).listen(port,'127.0.0.1',()=>console.log('LeveIA Agents foundation listening on localhost:'+port));
}
