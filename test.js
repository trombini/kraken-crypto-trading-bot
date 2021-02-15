const key          = 'tgwetf8DjRttdVrRAy6Sal9atOXrNrLvNgrDdY+cJ9FXw77MZh3rFwD9'; // API Key
const secret       = 'QrXRTUx+itoHoFiUokzKj1E122XV4/QU3muO2DyeRL6HKp4fSXqbrAyfMKWSBk2FyvUTcGLyH7q0JagDOuRQOw=='; // API Private Key
const KrakenClient = require('kraken-api');
const kraken       = new KrakenClient(key, secret);

(async () => {
	// Display user's balance
	console.log(await kraken.api('Balance'));

	// Get Ticker Info
	console.log(await kraken.api('Ticker', { pair : 'XXBTZUSD' }));
})();
