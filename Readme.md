
# Component Search

  The component search application, powered by Express and Redis.
  Uses the [componentjs/wiki](https://github.com/componentjs/wiki) to fetch data.

## API

### GET /all

  Respond with all packages:
  
  - `200` responds with json array of component.json contents

### GET /search/:query

  Search for `query`:
  
  - `500` shit exploded
  - `404` no packages, responds with json array `[]`
  - `200` packages found, responds with json array of component.json contents

# License

  MIT
