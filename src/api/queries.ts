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
            ... on User { name }
          }
          repository {
            name
            url
            owner {
              login
            }
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
          reviewRequests(first: 20) {
            totalCount
            nodes {
              requestedReviewer {
                ... on User { login }
                ... on Team { name }
              }
            }
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
          labels(first: 10) {
            nodes {
              name
              color
            }
          }
          mergeable
          additions
          deletions
          changedFiles
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

export const PR_DETAIL_QUERY = `
  query($nodeId: ID!) {
    node(id: $nodeId) {
      ... on PullRequest {
        body
        comments {
          totalCount
        }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 50) {
                  nodes {
                    ... on CheckRun {
                      name
                      status
                      conclusion
                      detailsUrl
                    }
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
        reviews(first: 20) {
          nodes {
            state
            author {
              login
            }
            submittedAt
          }
        }
        files(first: 100) {
          nodes {
            path
            additions
            deletions
            changeType
          }
        }
      }
    }
  }
`;
