export const ADD_PR_REVIEW = `
  mutation($pullRequestId: ID!, $event: PullRequestReviewEvent!, $body: String) {
    addPullRequestReview(input: {
      pullRequestId: $pullRequestId,
      event: $event,
      body: $body
    }) {
      pullRequestReview {
        state
      }
    }
  }
`;

export const ADD_PR_COMMENT = `
  mutation($subjectId: ID!, $body: String!) {
    addComment(input: {
      subjectId: $subjectId,
      body: $body
    }) {
      commentEdge {
        node {
          id
        }
      }
    }
  }
`;
