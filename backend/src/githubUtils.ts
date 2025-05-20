// src/githubUtils.ts
import { Octokit } from "@octokit/core";

export const fetchFileFromUserFork = async (
  path: string,
  token: string,
  username: string
): Promise<string> => {
  const forkOcto = new Octokit({ auth: token });

  try {
    // 1) Intentar leer del fork del usuario
    const { data }: any = await forkOcto.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: username,
        repo: "bitcoin-educational-content",
        path,
        ref: "dev",
      }
    );
    return Buffer.from(data.content, "base64").toString("utf-8");

  } catch (err: any) {
    if (err.status === 404) {
      console.log("🔁 Not in fork, falling back to planb-network repo");
      const publicOcto = new Octokit();  // sin auth, público
      const { data }: any = await publicOcto.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: "planb-network",
          repo: "bitcoin-educational-content",
          path,
          ref: "dev",
        }
      );
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    throw err;
  }
};
