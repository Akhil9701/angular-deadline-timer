
function clipInterval(a, b) {
    const lo = Math.max(a[0], b[0]);
    const hi = Math.min(a[1], b[1]);
    return [lo <= hi, [lo, hi]];
  }
  
  function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
  
    const merged = [intervals[0].slice()];
    for (let i = 1; i < intervals.length; i++) {
      const [lo, hi] = intervals[i];
      const last = merged[merged.length - 1];
      if (lo <= last[1]) {
        last[1] = Math.max(last[1], hi);
      } else {
        merged.push([lo, hi]);
      }
    }
    return merged;
  }
  
  function subtractCovered(target, covered) {
    const gaps = [];
    let cur = target[0];
  
    for (let [lo, hi] of covered) {
      if (hi < target[0] || lo > target[1]) continue;
      lo = Math.max(lo, target[0]);
      hi = Math.min(hi, target[1]);
      if (cur < lo) {
        gaps.push([cur, lo]);
      }
      cur = Math.max(cur, hi);
    }
    if (cur < target[1]) {
      gaps.push([cur, target[1]]);
    }
    return gaps;
  }
  
  function camerasSuffice(desiredDistance, desiredLight, cameras, reportGaps = true) {
    const [Dmin, Dmax] = desiredDistance;
    const [Lmin, Lmax] = desiredLight;
  
    if (Dmin > Dmax || Lmin > Lmax) {
      throw new Error("Desired ranges must have min <= max");
    }
  
    // Clip cameras
    const norm = [];
    for (const cam of cameras) {
      const [dOk, dClip] = clipInterval(cam.distance, desiredDistance);
      const [lOk, lClip] = clipInterval(cam.light, desiredLight);
      if (dOk && lOk) {
        norm.push({ distance: dClip, light: lClip });
      }
    }
  
    const details = { uncovered: [], normalizedCameras: norm };
  
    if (norm.length === 0) {
      if (reportGaps && Dmin < Dmax && Lmin < Lmax) {
        details.uncovered.push({
          distanceSlab: [Dmin, Dmax],
          lightGaps: [[Lmin, Lmax]]
        });
      }
      return [false, details];
    }
  
    // Collect x coordinates (distance boundaries)
    const xs = new Set([Dmin, Dmax]);
    for (const r of norm) {
      xs.add(r.distance[0]);
      xs.add(r.distance[1]);
    }
    const sortedXs = Array.from(xs).filter(x => x >= Dmin && x <= Dmax).sort((a, b) => a - b);
  
    let fullyCovered = true;
  
    // Sweep slabs
    for (let i = 0; i < sortedXs.length - 1; i++) {
      const x0 = sortedXs[i];
      const x1 = sortedXs[i + 1];
      if (x1 <= x0) continue;
  
      const activeLights = [];
      for (const r of norm) {
        const [d0, d1] = r.distance;
        if (d0 <= x0 && d1 >= x1) {
          activeLights.push(r.light);
        }
      }
  
      const merged = mergeIntervals(activeLights);
      const gaps = subtractCovered([Lmin, Lmax], merged);
  
      if (gaps.length > 0) {
        fullyCovered = false;
        if (reportGaps) {
          details.uncovered.push({
            distanceSlab: [x0, x1],
            lightGaps: gaps
          });
        }
      }
    }
  
    return [fullyCovered, details];
  }
  
  // ---------------------------
  // Example usage
  // ---------------------------
  
  const desiredD = [1.0, 10.0];
  const desiredL = [100.0, 800.0];
  
  const camsOk = [
    { distance: [1.0, 5.0], light: [100.0, 400.0] },
    { distance: [1.0, 5.0], light: [400.0, 800.0] },
    { distance: [5.0, 10.0], light: [100.0, 500.0] },
    { distance: [5.0, 10.0], light: [500.0, 800.0] },
  ];
  
  console.log("Case 1 (should be true):", camerasSuffice(desiredD, desiredL, camsOk)[0]);
  
  const camsGap = [
    { distance: [1.0, 10.0], light: [200.0, 800.0] }, // missing 100-200
  ];
  console.log("Case 2 (should be false):", camerasSuffice(desiredD, desiredL, camsGap));
  
  const camsPartial = [
    { distance: [1.0, 6.0], light: [100.0, 800.0] },
    { distance: [6.0, 10.0], light: [200.0, 800.0] }, // missing 100-200 for 6-10
  ];
  console.log("Case 3 (should be false):", camerasSuffice(desiredD, desiredL, camsPartial));
  