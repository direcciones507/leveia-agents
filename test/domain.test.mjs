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
