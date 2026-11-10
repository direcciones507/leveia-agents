import test from 'node:test';
import assert from 'node:assert/strict';
import {makeApp} from '../src/server.mjs';
import {SessionStore} from '../src/auth.mjs';
import {escapeHtml,listTenantAssistants,renderAdminPanel} from '../src/admin.mjs';

async function call(handler,token){
 const req={url:'/admin',method:'GET',headers:token?{authorization:'Bearer '+token}:{}};
 const res={status:0,headers:{},chunks:[],setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(code){this.status=code;return this;},end(data){if(data!==undefined)this.chunks.push(String(data));}};
 await handler(req,res);
 return {status:res.status,headers:res.headers,body:res.chunks.join('')};
}
test('ADMIN panel requires a session and ADMIN role',async()=>{
 const sessions=new SessionStore();const app=makeApp({sessions});
 assert.equal((await call(app.handler)).status,401);
 const client=sessions.create({userId:'client_1',organizationId:'tenant_a',role:'CLIENT'});
 assert.equal((await call(app.handler,client)).status,403);
});
test('ADMIN panel shows only its organization and escapes untrusted text',async()=>{
 const sessions=new SessionStore();
 const token=sessions.create({userId:'admin_1',organizationId:'tenant_a',role:'ADMIN'});
 const assistants=[{id:'assistant_1',organizationId:'tenant_a',name:'<script>alert(1)</script>',instructions:'<img src=x onerror=alert(1)>'},{id:'assistant_2',organizationId:'tenant_b',name:'Other tenant',instructions:'private'}];
 const result=await call(makeApp({sessions,assistants}).handler,token);
 assert.equal(result.status,200);
 assert.match(result.headers['content-type'],/text\/html/);
 assert.match(result.headers['content-security-policy'],/default-src 'none'/);
 assert.match(result.body,/&lt;script&gt;/);
 assert.match(result.body,/&lt;img/);
 assert.doesNotMatch(result.body,/<script>|<img|Other tenant|private/);
 assert.match(result.body,/noindex/);
});
test('ADMIN renderer rejects CLIENT and missing principal',()=>{
 assert.throws(()=>listTenantAssistants([],{role:'CLIENT',organizationId:'tenant_a'}),/FORBIDDEN/);
 assert.throws(()=>renderAdminPanel({principal:null}),/UNAUTHENTICATED/);
 assert.equal(escapeHtml('&<>\"\''),'&amp;&lt;&gt;&quot;&#39;');
});
