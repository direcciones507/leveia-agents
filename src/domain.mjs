// Pure, dependency-free domain validation. All tenant access must pass through scoped lookup functions.
export const ROLES=Object.freeze({ADMIN:'ADMIN',CLIENT:'CLIENT'});
const safeId=/^[a-z0-9][a-z0-9_-]{1,63}$/;
export function assertId(id,name='id') {
  if(typeof id!=='string'||!safeId.test(id))throw new Error('INVALID_'+name.toUpperCase());
  return id;
}
export function assertRole(role){
  if(role!==ROLES.ADMIN&&role!==ROLES.CLIENT)throw new Error('INVALID_ROLE');
  return role;
}
export function createAssistant({id,organizationId,name,instructions=''}){
  assertId(id);assertId(organizationId,'organization');
  if(typeof name!=='string'||!name.trim()||name.length>120)throw new Error('INVALID_NAME');
  if(typeof instructions!=='string'||instructions.length>16000)throw new Error('INVALID_INSTRUCTIONS');
  return Object.freeze({id,organizationId,name:name.trim(),instructions});
}
export function getScopedAssistant(assistants,principal,assistantId){
  if(!principal||!principal.organizationId||!principal.role)throw new Error('UNAUTHENTICATED');
  assertId(principal.organizationId,'organization');assertId(assistantId);
  const a=assistants.find(row=>row.id===assistantId&&row.organizationId===principal.organizationId);
  if(!a)throw new Error('NOT_FOUND');
  return a;
}
export function createAssistantForTenant(assistants,principal,input){
  if(!principal||principal.role!==ROLES.ADMIN)throw new Error('FORBIDDEN');
  assertId(principal.organizationId,'organization');
  if(input.organizationId!==principal.organizationId)throw new Error('FORBIDDEN');
  const assistant=createAssistant(input);
  if(assistants.some(a=>a.id===assistant.id))throw new Error('DUPLICATE_ASSISTANT');
  assistants.push(assistant);return assistant;
}
