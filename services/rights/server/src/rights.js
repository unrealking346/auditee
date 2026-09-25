export function territoryAllowed(track,country){if(!track)return false;const list=track.territories||[];return list.length===0||list.includes('WW')||list.includes(country)}
export function canStream({premium,explicitAllowed=true,track}){if(!track)return false;if(track.explicit&&!explicitAllowed)return false;return Boolean(premium||!track.premium_only)}
