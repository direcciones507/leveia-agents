// Minimal, non-production session abstraction for the first vertical slice.
// Production must replace this with durable server-side sessions and a persistent user store.
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {assertId,assertRole} from './domain.mjs';
export class SessionStore {
  #sessions=new Map();
  create({userId,organizationId,role}){
    assertId(userId,'user');assertId(organizationId,'organization');assertRole(role);
    const token=randomBytes(32).toString('hex');
    this.#sessions.set(token,{userId,organizationId,role});
    return token;
  }
  get(token){
    if(typeof token!=='string'||token.length!==64||!/^[a-f0-9]+$/.test(token))return null;
    // Avoid disclosing session tokens through logging; opaque lookup only.
    return this.#sessions.get(token)||null;
  }
  revoke(token){this.#sessions.delete(token);}
}
