
# Component Search

  The component search application, powered by Express and Redis.

## API

### GET /search/:query

  Search for `query`:
  
    - `500` shit exploded
    - `404` no packages, responds with json array `[]`
    - `200` packages found, responds json array of component.json contents

# License

  MIT
