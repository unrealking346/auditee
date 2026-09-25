/** Production contract: consume play/skip/like/follow events, build taste vectors, then rank candidates. */
export function rankCandidates(items,{freshness=.25,diversity=.25,similarity=.5}={}){return [...items].sort((a,b)=>((b.similarity||0)*similarity+(b.freshness||0)*freshness+(b.diversity||0)*diversity)-((a.similarity||0)*similarity+(a.freshness||0)*freshness+(a.diversity||0)*diversity))}
