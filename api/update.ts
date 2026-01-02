import { Octokit } from "octokit";
import { Hono } from "hono";

const app = new Hono();

// 🧠 トップページ（動作確認用）
app.get("/", (c) => c.text("🧠 ImageGen Broker API is alive!"));

// 🚀 Broker更新エンドポイント
app.post("/", async (c) => {
  const auth = c.req.header("authorization") || "";
  const token = auth.replace(/^Bearer\\s+/i, "");
  if (token !== process.env.BROKER_API_KEY) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const { owner, repo, branch, path, entry, audit } = await c.req.json();

  const allow = (process.env.ALLOWED_REPOS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.includes(`${owner}/${repo}`.toLowerCase())) {
    return c.json({ ok: false, error: "repo not allowed" }, 403);
  }

  const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const getRes = await octo.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      ref: branch,
    });
    const sha = getRes.data.sha;
    const content = Buffer.from(getRes.data.content, "base64").toString("utf8");
    const json = JSON.parse(content);

    const now = new Date().toISOString();
    json.version = json.version ?? 1;
    json.updated_at = now;
    json.entries = json.entries ?? [];

    const delta = entry?.weightDelta ?? 1;
    const key = entry?.key;
    const to = entry?.to;
    const notes = entry?.notes || "";

    const idx = json.entries.findIndex((e) => e.key === key);
    if (idx >= 0) {
      const e = json.entries[idx];
      const mIdx = (e.mappings || []).findIndex((m) => m.to === to);
      if (mIdx >= 0) e.mappings[mIdx].weight += delta;
      else (e.mappings = e.mappings || []).push({ to, weight: delta, notes });
      json.entries[idx] = e;
    } else {
      json.entries.push({ key, mappings: [{ to, weight: delta, notes }] });
    }

    const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");
    const commitRes = await octo.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      message: `chore: update equivalence_db by broker\\n\\naudit: ${JSON.stringify(audit || {})}`,
      content: newContent,
      sha,
      branch,
    });

    return c.json({
      ok: true,
      commitSha: commitRes.data.commit?.sha,
      contentSha: commitRes.data.content?.sha,
    });
  } catch (err) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

export default app;
