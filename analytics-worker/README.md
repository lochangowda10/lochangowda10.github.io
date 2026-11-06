# Referral tracking backup

This Worker records referral hits on the server, then redirects visitors to the portfolio. It stores only the `ref` tag and timestamp; it does not store IP addresses or user agents.

Cloudflare's Free plan currently includes 100,000 Worker requests per day. D1's Free plan includes 100,000 written rows per day and 5 GB of total storage; see [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

## Deploy

1. Create a free Cloudflare account and enable Workers.
2. From this directory, run `npx wrangler d1 create lochan-ref-analytics` and put the returned database ID in `wrangler.jsonc`.
3. Run `npx wrangler d1 migrations apply lochan-ref-analytics --remote`.
4. Run `npx wrangler deploy` and copy the resulting `*.workers.dev` URL.

New tracked links use that URL, for example `https://YOUR-WORKER.workers.dev/?ref=lochan`. The Worker records the visit even if browser analytics scripts are blocked, then redirects to `https://lochangowda10.github.io/?ref=lochan`.

To see counts in Cloudflare, open the D1 database console and run:

```sql
SELECT ref, COUNT(*) AS visits
FROM ref_visits
GROUP BY ref
ORDER BY visits DESC;
```

For recent counts by day:

```sql
SELECT ref, substr(visited_at, 1, 10) AS day, COUNT(*) AS visits
FROM ref_visits
GROUP BY ref, day
ORDER BY day DESC, visits DESC;
```

## GoatCounter backup

GoatCounter requires a free site code before its script can be enabled. Once you have it, place this in the portfolio `<head>` and replace `YOUR-CODE` with the domain shown in the GoatCounter dashboard:

GoatCounter currently allows reasonable public personal site usage for free under its [service terms](https://www.goatcounter.com/help/terms). Its docs confirm that `ref` can be used as a campaign source and show how to preserve query values in a custom path.

```html
<script>
  window.goatcounter = {
    path: () => {
      const ref = new URLSearchParams(window.location.search).get('ref');
      const path = window.location.pathname || '/';
      return ref ? `${path}?ref=${encodeURIComponent(ref)}` : path;
    },
  };
</script>
<script
  data-goatcounter="https://YOUR-CODE.goatcounter.com/count"
  async
  src="https://gc.zgo.at/count.js"
></script>
```

The static portfolio source is in the sibling `portfolio-src` folder and the generated deployment is this repository's `index.html`. Send the site code when it is ready and it can be wired into both files.
