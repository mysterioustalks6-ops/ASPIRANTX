function mergeAdminSettings(target, source) {
  if (!source) return target;
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (srcVal === undefined || srcVal === null) continue;

    if (
      typeof tgtVal === 'object' && tgtVal !== null && !Array.isArray(tgtVal) &&
      typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)
    ) {
      result[key] = mergeAdminSettings(tgtVal, srcVal);
    } else {
      if (typeof tgtVal === 'string' && tgtVal.trim() !== '' && typeof srcVal === 'string' && srcVal.trim() === '') {
        continue;
      }
      result[key] = srcVal;
    }
  }
  return result;
}

const target = { planPricing: { monthlyPrice: 299 } };
const source = { planPricing: { monthlyPrice: 300 } };
console.log(mergeAdminSettings(target, source));
