export const PR_QUERY = `
  query($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          createdAt
          updatedAt
          headRefName
          author {
            login
          }
          repository {
            name
            url
          }
          reviewDecision
          latestReviews(first: 10) {
            nodes {
              state
              author {
                login
              }
            }
          }
          reviewRequests {
            totalCount
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const ORG_REPOS_QUERY = `
  query($org: String!, $cursor: String) {
    organization(login: $org) {
      repositories(first: 100, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          url
          isArchived
          updatedAt
        }
      }
    }
  }
`;

export const VIEWER_QUERY = `
  query {
    viewer {
      login
    }
  }
`;
