/**
 * Git mode keyword detector.
 *
 * Triggers on git-operation requests across multiple languages:
 * - English: commit, commits, rebase, squash, cherry-pick, revert, blame, bisect, stash, amend
 * - Korean: 커밋, 리베이스, 스쿼시, 체리픽, 리버트, 블레임, 비섹트, 스태시, 수정 커밋
 * - Japanese: コミット, リベース, スカッシュ, チェリーピック, リバート, blame, bisect, stash
 * - Chinese: 提交, 变基, 压缩提交, 挑拣, 回退, 追溯, 二分查找, 暂存
 * - Vietnamese: commit, rebase, squash, cherry-pick, revert, blame, bisect, stash
 */

export const GIT_PATTERN =
  /\b(commit|commits|rebase|squash|cherry[\s-]?pick|revert|blame|bisect|stash|amend)\b|커밋|리베이스|스쿼시|체리픽|리버트|블레임|비섹트|스태시|수정\s*커밋|コミット|リベース|スカッシュ|チェリーピック|リバート|提交|变基|压缩提交|挑拣|回退|追溯|二分查找|暂存/i

export const GIT_MESSAGE = `[git-mode]
Git intent detected. Treat git work as specialized work:
- Load the \`git-master\` skill before acting on git requests
- For commit requests, inspect status, diff, and recent commit style first
- Prefer atomic commits and follow existing repository commit conventions
- Avoid destructive git commands unless the user explicitly asks for them`
