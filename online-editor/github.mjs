import { BRANCH, OWNER_ID, REPOSITORY, failure } from './config.mjs';

function decodeContent(file) {
  return new TextDecoder().decode(Uint8Array.from(atob(file.content.replaceAll('\n', '')), ch => ch.charCodeAt(0)));
}

export function createGitHub(fetcher = fetch) {
  async function api(path, token, method = 'GET', body) {
    const response = await fetcher(`https://api.github.com${path}`, {
      method,
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'User-Agent': 'dandi-profile-editor', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      if (response.status === 401) throw failure(401, '登录已过期，请重新登录。当前修改仍保留在页面中。');
      if ([409, 422].includes(response.status)) throw failure(409, '仓库已有新修改，请保留当前文字后重新打开编辑页。');
      if (response.status === 403) throw failure(403, 'GitHub 未允许此次操作，请检查应用对该仓库的授权。');
      throw failure(502, '暂时无法连接 GitHub，修改尚未确认保存，请稍后重试。');
    }
    return response.json();
  }
  const repo = `/repos/${REPOSITORY}`;
  return {
    async exchange(code, verifier, env, redirectUri) {
      const response = await fetcher('https://github.com/login/oauth/access_token', {
        method: 'POST', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
          code, code_verifier: verifier, redirect_uri: redirectUri }),
      });
      const result = await response.json();
      if (!response.ok || !result.access_token) throw failure(401, 'GitHub 登录未完成，请重新登录。');
      return result;
    },
    async owner(token) {
      const user = await api('/user', token);
      if (user.id !== OWNER_ID) throw failure(403, '只有主页所有者可以编辑。');
      return user;
    },
    async read(token) {
      const head = await api(`${repo}/git/ref/heads/${BRANCH}`, token);
      const revision = head.object.sha;
      const [commit, template, content] = await Promise.all([
        api(`${repo}/git/commits/${revision}`, token),
        api(`${repo}/contents/index.html?ref=${revision}`, token),
        api(`${repo}/contents/content.json?ref=${revision}`, token),
      ]);
      return { revision, tree: commit.tree.sha, template: decodeContent(template), content: JSON.parse(decodeContent(content)) };
    },
    async save(token, current, content) {
      const tree = await api(`${repo}/git/trees`, token, 'POST', {
        base_tree: current.tree,
        tree: [{ path: 'content.json', mode: '100644', type: 'blob', content: JSON.stringify(content, null, 2) + '\n' }],
      });
      const commit = await api(`${repo}/git/commits`, token, 'POST', {
        message: '通过本人在线编辑器更新主页内容', tree: tree.sha, parents: [current.revision],
      });
      // A non-fast-forward update fails if anything changed after the page loaded.
      await api(`${repo}/git/refs/heads/${BRANCH}`, token, 'PATCH', { sha: commit.sha, force: false });
      return { revision: commit.sha, commitUrl: `https://github.com/${REPOSITORY}/commit/${commit.sha}` };
    },
  };
}
