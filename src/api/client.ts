import { graphql } from "@octokit/graphql";

export function createClient(token: string) {
  return graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });
}

export type GraphQLClient = ReturnType<typeof createClient>;
