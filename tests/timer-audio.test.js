import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimerAudio } from '../src/timer-audio.js';

function rig({ delayed=false, unsupported=false }={}) {
  const loops=new Map(),notes=[],statuses=[];let next=0,resolveResume;
  const context={state:'suspended',currentTime:0,destination:{},
    resume(){return delayed?new Promise(resolve=>{resolveResume=()=>{context.state='running';resolve();};}):(context.state='running',Promise.resolve());},
    close(){context.state='closed';return Promise.resolve();},
    createOscillator(){const n={frequency:{},connect(){},disconnect(){},start(at){n.started=at;},stop(at){if(at===undefined)n.stopped=true;}};notes.push(n);return n;},
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};},
  };
  const controller=createTimerAudio({createContext:()=>{if(unsupported)throw Error('unsupported');return context;},
    onStatus:s=>statuses.push(s),every:fn=>{const id=next++;loops.set(id,fn);return id;},cancelEvery:id=>loops.delete(id)});
  let state={enabled:true,foreground:true,timer:{id:null,step:null,deadline:1000},now:0};
  const update=patch=>{state={...state,...patch};controller.update(state);};update({});
  return {controller,update,notes,loops,statuses,context,tick(){for(const fn of [...loops.values()])fn();},resolve(){resolveResume();}};
}
test('alarm has one loop across repeated renders and stops all scheduled notes on acknowledgement',async()=>{
  const r=rig();await r.controller.activate();assert.equal(r.notes.length,0);
  r.update({now:1000});assert.equal(r.notes.length,3);assert.equal(r.loops.size,1);
  r.update({now:1500});await r.controller.activate();assert.equal(r.loops.size,1);assert.equal(r.notes.length,3);
  assert.equal(r.statuses.at(-1),'ringing');r.tick();assert.equal(r.notes.length,6);
  r.update({timer:null});assert.equal(r.loops.size,0);assert.ok(r.notes.every(n=>n.stopped));
  r.tick();assert.equal(r.notes.length,6);r.controller.dispose();
});
test('mute, background, pause, extension and cleanup stop the alarm and old timers never restart',async()=>{
  const r=rig();await r.controller.activate();r.update({now:1000});
  r.update({foreground:false});assert.equal(r.loops.size,0);r.tick();assert.equal(r.notes.length,3);
  r.update({foreground:true});assert.equal(r.loops.size,1);
  r.update({enabled:false});assert.equal(r.loops.size,0);r.update({now:2000});assert.equal(r.loops.size,0);
  r.update({enabled:true,timer:{id:null,step:null,deadline:1000,paused:0}});assert.equal(r.loops.size,0);
  r.update({timer:{id:null,step:null,deadline:3000}});assert.equal(r.loops.size,0);
  r.update({now:3000});assert.equal(r.loops.size,1);
  r.controller.dispose();assert.equal(r.loops.size,0);assert.equal(r.context.state,'closed');
});
test('late audio permission resolution cannot restart a canceled or muted timer',async()=>{
  for(const patch of [{timer:null},{enabled:false},{foreground:false}]){
    const r=rig({delayed:true});r.update({now:1000});const p=r.controller.activate();r.update(patch);r.resolve();await p;
    assert.equal(r.notes.length,0);assert.equal(r.loops.size,0);r.controller.dispose();
  }
});
test('preview plays once, does not create a timer loop and cannot override mute or background',async()=>{
  const r=rig();r.update({timer:null});assert.equal(await r.controller.preview(),true);
  assert.equal(r.notes.length,3);assert.equal(r.loops.size,0);
  r.update({enabled:false});assert.equal(await r.controller.preview(),false);assert.equal(r.notes.length,3);
  r.update({enabled:true,foreground:false});assert.equal(await r.controller.preview(),false);
  r.controller.dispose();
});
test('unavailable or suspended audio reports failure while allowing the timer state to remain',async()=>{
  const r=rig({unsupported:true});r.update({now:1000});assert.equal(await r.controller.activate(),false);
  assert.equal(r.statuses.at(-1),'blocked');assert.equal(r.loops.size,0);r.controller.dispose();
  const s=rig();await s.controller.activate();s.update({now:1000});s.context.state='suspended';s.tick();
  assert.equal(s.loops.size,0);assert.equal(s.statuses.at(-1),'blocked');s.controller.dispose();
});
