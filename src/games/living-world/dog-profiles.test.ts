import { describe, expect, it } from 'vitest';
import { DOG_PROFILES } from './dog-profiles';
describe('Living World dog identity contract',()=>{
 it('has only the three approved controllable dogs',()=>expect(DOG_PROFILES.map(d=>d.id)).toEqual(['jackie','tiger','percy']));
 it('keeps the relationship and size distinctions',()=>{
  const jackie=DOG_PROFILES.find(d=>d.id==='jackie')!,tiger=DOG_PROFILES.find(d=>d.id==='tiger')!,percy=DOG_PROFILES.find(d=>d.id==='percy')!;
  expect(jackie.relationship).toContain('Tiger');expect(tiger.build).toBe('muscular');expect(percy.relationship).toContain('Unrelated');expect(jackie.scale).toBeLessThan(percy.scale);expect(percy.scale).toBeLessThan(tiger.scale);
 });
});
