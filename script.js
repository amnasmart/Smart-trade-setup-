async function getSetup() {
  const symbol = document.getElementById("symbolInput").value.toUpperCase();
  const tf = document.getElementById("timeframe").value;
  const resultBox = document.getElementById("result");
  resultBox.innerHTML = "Fetching data...";

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${tf}&limit=100`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const closes = data.map(c => parseFloat(c[4]));
    const lows = data.map(c => parseFloat(c[3]));
    const highs = data.map(c => parseFloat(c[2]));

    const current = closes[closes.length - 1];
    const support = Math.min(...lows.slice(-10));
    const resistance = Math.max(...highs.slice(-10));

    const stoploss = +(support * 0.99).toFixed(4); // tighter SL
    let target1 = +resistance.toFixed(4);
    let target2 = +((resistance * 1.06).toFixed(4)); // more aggressive T2

    if (target2 <= current * 1.03) target2 = null; // remove if not far enough

    // RSI Calculation
    const rsi = calcRSI(closes);
    let reason = [];

    if (rsi < 35) reason.push("RSI oversold");
    if (Math.abs(current - support) / current < 0.03) reason.push("Bounce from support zone");
    if (reason.length === 0) reason.push("Basic resistance-based setup");

    // Calculate % gain/loss
    let perc1 = (((target1 - current) / current) * 100).toFixed(2);
    let perc2 = target2 ? (((target2 - current) / current) * 100).toFixed(2) : null;
    let percSL = (((current - stoploss) / current) * 100).toFixed(2);

    // Setup Score
    const setupType = (parseFloat(perc1) > parseFloat(percSL)) ? "✅ Good Setup" : "⚠️ Weak Setup";

    resultBox.innerHTML = `
      <strong>Symbol:</strong> ${symbol} (${tf})<br>
      <strong>Entry:</strong> ${current}<br>
      <strong>Target 1:</strong> ${target1} (${perc1}% profit)<br>
      ${target2 ? `<strong>Target 2:</strong> ${target2} (${perc2}% profit)<br>` : ""}
      <strong>Stoploss:</strong> ${stoploss} (${percSL}% risk)<br>
      <strong>Setup:</strong> ${setupType}<br>
      <strong>Reason:</strong> ${reason.join(" + ")}
    `;
  } catch (err) {
    resultBox.innerHTML = "Error fetching data. Please check symbol.";
  }
}

function calcRSI(closes, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    let diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}
