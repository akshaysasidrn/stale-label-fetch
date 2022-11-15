# Stale label fetch action

This action helps to fetch PR or issue numbers having the specified label based on the stale time set.

## Inputs

### `github-token`

**Required**
Token required to auth GitHub API requests.


### `stale-label`

**Required**
The label to check if it has passed specified time to be stale.


### `stale-time`

**Required**
The time difference in seconds required to be considered stale since the PR's/issue's creation and the action run.

### `type`

**Required**
Specify either as 'pull-request' or 'issue'

## Outputs

### `stale-numbers`

Comma separated values of PRs/issues numbers which are stale.

## Example usage

```yaml
uses: actions/stale-label-fetch@v1.0
with:
  github-token: 'xxxxxx'
  stale-label: 'deployed'
  stale-time: '86400'
```
