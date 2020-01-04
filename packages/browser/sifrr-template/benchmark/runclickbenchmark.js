const verbose = Math.max(process.argv.indexOf(`--verbose`), process.argv.indexOf(`-v`)) > 0;

module.exports = async function(
  benchmark,
  port,
  runs = 5,
  url,
  warmups = runs,
  metrics = [
    'ScriptDuration',
    'LayoutDuration',
    'LayoutCount',
    'TaskDuration',
    'RecalcStyleDuration'
  ]
) {
  const BM = require(`./benchmarks/${benchmark}`);
  const totals = {};
  if (verbose)
    process.stdout.write(
      `Running ${benchmark} benchmark with ${warmups} warmups for ${runs} runs: \n`
    );

  // Reload page
  url = url || `http://localhost:${port}/speedtest.html`;

  const client = await page.target().createCDPSession();

  const times = (warmups + 1) * runs;
  for (let i = 0; i < times; i++) {
    if (i % (warmups + 1) === 0) {
      await page.goto(url);
      // await page.goto(url, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        HTMLElement.prototype.$ = HTMLElement.prototype.querySelector;
        HTMLElement.prototype.$$ = HTMLElement.prototype.querySelectorAll;
        document.$ = document.querySelector;
        document.$$ = document.querySelectorAll;
      });
      await BM.setup();

      // Run before all
      BM.beforeAll();
      await page.waitForFunction(BM.beforeAllWait());
    }
    const bm = new BM(i % (warmups + 1));

    // Run before
    bm.before();
    await page.waitForFunction(bm.beforeWait());
    const beforeMetrics = await BM.metrics();

    // Run bechmark
    await client.send('Emulation.setCPUThrottlingRate', { rate: bm.cpuSlowdown });
    bm.run();
    await page.waitForFunction(bm.runWait());
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const afterMetrics = await BM.metrics();

    if (i % (warmups + 1) === warmups) {
      if (verbose) process.stdout.write(`${i + 1}R `);
      const diff = BM.metricsDiff(beforeMetrics, afterMetrics);
      for (const m in diff) {
        totals[m] = totals[m] || 0;
        totals[m] += diff[m];
      }
    } else {
      if (verbose) process.stdout.write(`${i + 1}W `);
    }
  }
  if (verbose) process.stdout.write('\n');

  // Filter metrics
  for (const m in totals) {
    if (metrics.indexOf(m) >= 0) {
      totals[m] = totals[m] / runs;
    } else {
      delete totals[m];
    }
  }

  // Save metrics
  return totals;
};
