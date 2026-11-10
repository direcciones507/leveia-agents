import {makeApp} from '../src/server.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssistantForTenant,getScopedAssistant} from '../src/domain.mjs';
import {SessionStore} from '../src/auth.mjs';

test('an ADMIN can create only inside its own organization',()=>{
 const db=[];const admin={role:'ADMIN',userId:'admin_1',organizationId:'tenant_a'};
 const assistant=createAssistantForTenant(db,admin,{id:'assistant_1',organizationId:'tenant_a',name:'Ventas'});
 assert.equal(assistant.organizationId,'tenant_a');
 assert.throws(()=>createAssistantForTenant(db,admin,{id:'assistant_2',organizationId:'tenant_b',name:'Externo'}),/FORBIDDEN/);
});
test('a client cannot create an assistant',()=>{
 assert.throws(()=>createAssistantForTenant([],{role:'CLIENT',organizationId:'tenant_a'},{id:'assistant_1',organizationId:'tenant_a',name:'No'}),/FORBIDDEN/);
});
test('cross-tenant assistant reads are denied even when id is known',()=>{
 const rows=[{id:'assistant_1',organizationId:'tenant_a',name:'Secreto'}];
 assert.equal(getScopedAssistant(rows,{role:'CLIENT',organizationId:'tenant_a'},'assistant_1').name,'Secreto');
 assert.throws(()=>getScopedAssistant(rows,{role:'ADMIN',organizationId:'tenant_b'},'assistant_1'),/NOT_FOUND/);
 assert.throws(()=>getScopedAssistant(rows,{role:'CLIENT',organizationId:'tenant_b'},'assistant_1'),/NOT_FOUND/);
});
test('session token does not authorize a different tenant',()=>{
 const sessions=new SessionStore();const token=sessions.create({userId:'user_1',organizationId:'tenant_a',role:'CLIENT'});
 assert.equal(sessions.get(token).organizationId,'tenant_a');
 assert.equal(sessions.get('f'.repeat(64)),null);
 sessions.revoke(token);assert.equal(sessions.get(token),null);
});

test('a malformed or short session token is never accepted',()=>{
 const sessions=new SessionStore();sessions.create({userId:'user_1',organizationId:'tenant_a',role:'ADMIN'});
 assert.equal(sessions.get(''),null);
 assert.equal(sessions.get('a'.repeat(63)),null);
 assert.equal(sessions.get('z'.repeat(64)),null);
});
test('scoped lookup rejects a principal without identity or role',()=>{
 const rows=[{id:'assistant_1',organizationId:'tenant_a',name:'Secreto'}];
 assert.throws(()=>getScopedAssistant(rows,undefined,'assistant_1'),/UNAUTHENTICATED/);
 assert.throws(()=>getScopedAssistant(rows,{role:'ADMIN'},'assistant_1'),/UNAUTHENTICATED/);
 assert.throws(()=>getScopedAssistant(rows,{organizationId:'tenant_a'},'assistant_1'),/UNAUTHENTICATED/);
});
test('HTTP endpoints reject unauthenticated requests',async()=>{
 const app=makeApp();
 const unauth=await httpCall(app.handler,'GET','/api/assistants/assistant_1');
 assert.equal(unauth.status,401);
 assert.equal(unauth.body.error,'UNAUTHENTICATED');
 const post=await httpCall(app.handler,'POST','/api/assistants',{id:'assistant_1',name:'X'});
 assert.equal(post.status,401);
});
test('HTTP tenant isolation ignores spoofed organization in request body',async()=>{
 const sessions=new SessionStore(),assistants=[];
 const adminToken=sessions.create({userId:'admin_a',organizationId:'tenant_a',role:'ADMIN'});
 const app=makeApp({assistants,sessions});
 const created=await httpCall(app.handler,'POST','/api/assistants',{id:'assistant_1',name:'Ventas',organizationId:'tenant_b'},adminToken);
 assert.equal(created.status,201);
 assert.equal(assistants[0].organizationId,'tenant_a');
 const readOwn=await httpCall(app.handler,'GET','/api/assistants/assistant_1',undefined,adminToken);
 assert.equal(readOwn.status,200);
 assert.equal(readOwn.body.name,'Ventas');
});
test('CLIENT cannot use ADMIN creation endpoint',async()=>{
 const sessions=new SessionStore();
 const clientToken=sessions.create({userId:'client_a',organizationId:'tenant_a',role:'CLIENT'});
 const app=makeApp({sessions});
 const res=await httpCall(app.handler,'POST','/api/assistants',{id:'assistant_9',name:'No'},clientToken);
 assert.equal(res.status,403);
 assert.equal(res.body.error,'FORBIDDEN');
});
test('HTTP cross-tenant read returns NOT_FOUND without leaking assistant',async()=>{
 const sessions=new SessionStore();
 const assistants=[{id:'assistant_1',organizationId:'tenant_a',name:'Secreto',instructions:''}];
 const tokenB=sessions.create({userId:'admin_b',organizationId:'tenant_b',role:'ADMIN'});
 const app=makeApp({assistants,sessions});
 const res=await httpCall(app.handler,'GET','/api/assistants/assistant_1',undefined,tokenB);
 assert.equal(res.status,404);
 assert.equal(res.body.error,'NOT_FOUND');
 assert.equal(JSON.stringify(res.body).includes('Secreto'),false);
});
test('revoked ADMIN session loses HTTP access immediately',async()=>{
 const sessions=new SessionStore();
 const assistants=[{id:'assistant_1',organizationId:'tenant_a',name:'Ventas',instructions:''}];
 const token=sessions.create({userId:'admin_a',organizationId:'tenant_a',role:'ADMIN'});
 const app=makeApp({assistants,sessions});
 assert.equal((await httpCall(app.handler,'GET','/api/assistants/assistant_1',undefined,token)).status,200);
 sessions.revoke(token);
 assert.equal((await httpCall(app.handler,'GET','/api/assistants/assistant_1',undefined,token)).status,401);
});
function httpCall(handler,method,url,body,token){
 const payload=body===undefined?undefined:Buffer.from(JSON.stringify(body));
 const headers={};if(token)headers.authorization='Bearer '+token;
 const req={url,method,headers,[Symbol.asyncIterator]:async function*(){if(payload)yield payload;}};
 const res={statusCode:0,chunks:[],setHeader(){},writeHead(status){this.statusCode=status;return this;},end(chunk){if(chunk!==undefined)this.chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk)));}};
 return Promise.resolve(handler(req,res)).then(()=>({status:res.statusCode,body:res.chunks.length?JSON.parse(Buffer.concat(res.chunks).toString('utf8')):{}}));
}
