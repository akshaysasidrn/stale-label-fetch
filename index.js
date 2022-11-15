const core = require("@actions/core");
const github = require("@actions/github");

const isStale = (currentTime, createdTime, staleTime) => {
  return (currentTime - createdTime) >= staleTime;
};

const getTimeinSeconds = (timeString) => {
  const dateObj = timeString ? new Date(timeString) : new Date();
  return dateObj.getTime() / 1000;
};

const hasSpecifiedType = (obj, type) => {
  switch (type) {
    case "pull_request":
      return obj.hasOwnProperty(type);
    case "issue":
      return !obj.hasOwnProperty(type);
    default:
      return false;
  }
};

const run = async () => {
  try {
    const token = core.getInput("github-token");
    const client = new github.getOctokit(token);
    const type = core.getInput("type");
    const staleLabel = core.getInput("stale-label");
    const staleTimeInSeconds = parseInt(core.getInput("stale-time"), 10);
    const currentTime = getTimeinSeconds();

    const openIssuesOrPullRequestsWithLabel = await client.paginate(
      client.rest.issues.listForRepo,
      {
        ...github.context.repo,
        labels: staleLabel,
        per_page: 100,
      }
    );
    const specifiedTypeWithLabels = openIssuesOrPullRequestsWithLabel.filter(
      (obj) => hasSpecifiedType(obj, type)
    );
    const labelNumbers = specifiedTypeWithLabels.reduce(
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
        (resp) => resp.event === "labeled" && resp.label.name === staleLabel
      )[0];

      return [...(await acc), { ...lastLabeledEvent, number }];
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
