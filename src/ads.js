// src/ads.js
// 广告接入预留位。当前是 mock：模拟"看完广告 → 拿到奖励"。
//
// 为什么这么写？
//   - 真广告 SDK（如 Google AdSense / 穿山甲 / AdMob）接入要走审核 + 真实流量，
//     游戏还没上线就先用 mock 跑通整条链路：UI → showRewardAd → 回调 → wallet.grant
//   - 真接入时只需把 showRewardAd 内部替换成 SDK 调用，外面调用者完全不改
//   - 接入位置说明都写在 INTEGRATION_NOTES 里
//
// 一次广告奖励：+1 撤回（看视频换 1 撤回，常见手游设计）

import { grant } from './wallet.js';

/** 每看完一条广告给的奖励。 */
export const AD_REWARD = { undo: 1 };

/** 模拟广告播放时长（ms）。真接入时由 SDK 自然控制，删掉这行。 */
const MOCK_DURATION_MS = 800;

/**
 * 看一条激励视频广告。看完即 resolve，并自动加道具。
 *
 * 调用约定（UI 层）：
 *   showRewardAd().then(({ rewarded, balance }) => {
 *     if (rewarded) showToast(`+${AD_REWARD.undo} 撤回！`);
 *   });
 *
 * @returns {Promise<{rewarded: boolean, balance: object|null, reason?: string}>}
 */
export function showRewardAd() {
  // === 真接入位 1：SDK 是否已加载 ===
  // if (!window.AdSDK || !window.AdSDK.isReady()) {
  //   return Promise.resolve({ rewarded: false, balance: null, reason: 'sdk-not-ready' });
  // }

  return new Promise((resolve) => {
    // === Mock 实现：模拟广告时长后回调 ===
    // 真接入时，替换为：
    //   window.AdSDK.showRewardedVideo({
    //     onRewarded:  () => { const w = grant(AD_REWARD); resolve({ rewarded: true,  balance: w }); },
    //     onSkipped:   () => resolve({ rewarded: false, balance: null, reason: 'user-skipped' }),
    //     onError: (e) => resolve({ rewarded: false, balance: null, reason: 'sdk-error: ' + e.message }),
    //   });
    setTimeout(() => {
      const balance = grant(AD_REWARD);
      resolve({ rewarded: true, balance });
    }, MOCK_DURATION_MS);
  });
}

/** 文档：广告 SDK 真接入清单（搜索此常量找接入位）。 */
export const INTEGRATION_NOTES = `
  广告 SDK 真实接入步骤（搜 "AdSDK" 找位）：
  1. index.html 加 <script src="https://your-ad-sdk.com/sdk.js"></script>
  2. main.js 启动时调 window.AdSDK.init({ appId: 'xxx' })
  3. ads.js showRewardAd 内部把 mock setTimeout 换成真实 SDK 调用
  4. 隐私政策页加广告 SDK 数据声明（合规要求）
`;
