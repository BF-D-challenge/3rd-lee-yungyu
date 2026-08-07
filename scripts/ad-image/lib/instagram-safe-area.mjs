export const INSTAGRAM_SAFE_AREAS = Object.freeze({
  feedPortrait: Object.freeze({
    id: "ig_feed_portrait",
    width: 1080,
    height: 1350,
    ratio: "4:5",
    insets: Object.freeze({top: 96, right: 96, bottom: 96, left: 96}),
    sourceRule: "Meta recommends 4:5 for Feed; 96px is the project production guardrail.",
  }),
  feedSquare: Object.freeze({
    id: "ig_feed_square",
    width: 1080,
    height: 1080,
    ratio: "1:1",
    insets: Object.freeze({top: 72, right: 72, bottom: 72, left: 72}),
    sourceRule: "Meta supports 1:1 Feed assets; 72px is the project production guardrail.",
  }),
  storiesReels: Object.freeze({
    id: "ig_stories_reels",
    width: 1080,
    height: 1920,
    ratio: "9:16",
    insets: Object.freeze({top: 269, right: 72, bottom: 384, left: 72}),
    sourceRule:
      "Meta asks Stories ads to keep roughly 14% of the top and 20% of the bottom free of key elements; the same conservative baseline is used for Reels.",
  }),
});

export function safeRect(profile) {
  return {
    x: profile.insets.left,
    y: profile.insets.top,
    width: profile.width - profile.insets.left - profile.insets.right,
    height: profile.height - profile.insets.top - profile.insets.bottom,
  };
}

export function assertCriticalBox(profile, box, label) {
  const safe = safeRect(profile);
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const safeRight = safe.x + safe.width;
  const safeBottom = safe.y + safe.height;
  if (
    box.x < safe.x ||
    box.y < safe.y ||
    right > safeRight ||
    bottom > safeBottom
  ) {
    throw new Error(
      `${label} leaves ${profile.id} safe area: ` +
        JSON.stringify({box, safe}),
    );
  }
}
