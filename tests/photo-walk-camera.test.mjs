import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraBox } from '../src/photo-walk-camera.ts';

test('camera covers portrait and landscape at every edge and allowed zoom', () => {
  for (const [w,h] of [[320,568],[390,844],[844,390],[1024,768],[1440,900]]) {
    for (const zoom of [1,1.6,2.5]) for (const x of [0,.5,1]) for (const y of [0,.5,1]) {
      const b=cameraBox(w,h,{x,y,zoom});
      assert(b.width >= w - 1e-6 && b.height >= h - 1e-6);
      assert(b.left <= 1e-6 && b.top <= 1e-6);
      assert(b.left+b.width >= w-1e-6 && b.top+b.height >= h-1e-6);
      assert(Math.abs(b.width/b.height-16/9)<1e-6);
    }
  }
});
test('overview shows the complete undistorted frame independent of prior camera', () => {
  for (const [w,h] of [[390,844],[1440,900]]) {
    const b=cameraBox(w,h,{x:.1,y:.8,zoom:2.5},true);
    assert(b.left >= 0 && b.top >= 0);
    assert(b.width <= w && b.height <= h);
    assert.equal(b.left*2+b.width,w);
    assert.equal(b.top*2+b.height,h);
  }
});
