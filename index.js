const core = require("@actions/core");
const github = require("@actions/github");

const isStale = (currentTime, createdTime, staleTime) => {
  return (currentTime - createdTime) >= staleTime;
};

const getTimeinSeconds = (timeString) => {
  const dateObj = timeString ? new Date(timeString) : new Date()
  return dateObj.getTime() / 1000;
};

const run = async () => {
  try {
    const token = core.getInput("github-token");
    const client = new github.getOctokit(token);
    const type = core.getInput("type");
    const staleLabel = core.getInput("stale-label");
    const queryString = `q=is:${type} label:${staleLabel} is:open`;
    const currentTime = getTimeinSeconds();
    const staleTimeInSeconds = parseInt(core.getInput("stale-time-in-seconds"), 10);

    const openIssuesOrPullRequestsWithLabel = await client.paginate(
      client.rest.search.issuesAndPullRequests,
      {
        q: queryString,
        per_page: 100,
      }
    );
    const labelNumbers = openIssuesOrPullRequestsWithLabel.reduce(
      (acc, resp) => [...acc, resp.number],
      []
    );

    const lastLabeledEvents = await labelNumbers.reduce(async (acc, number) => {
      const eventsResponse = await client.paginate(
        client.rest.issues.listEventsForTimeline,
        {
          ...github.context.repo,
          issue_number: number,
        }
      );

      const lastLabeledEvent = eventsResponse.filter(
        (resp) => resp.event === "labeled" && resp.label.name === "duplicate"
      )[0];

      return [...(await acc), {...lastLabeledEvent, number }];
    }, []);

    const staleIssueOrPullRequestNumbers = lastLabeledEvents
      .filter((event) =>
        isStale(
          currentTime,
          getTimeinSeconds(event.created_at),
          staleTimeInSeconds
        )
      )
      .map((event) => event.number);

    core.setOutput("stale-numbers", staleIssueOrPullRequestNumbers.join(","));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
