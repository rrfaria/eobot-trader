console.log('started app');
const Eobot = {
	eobotArr : [],
	selectedIndex : -1,
	minTransPrice: 0.00011,

	init:async () => {
		if (localStorage.eobotStore) {
			Eobot.eobotArr = JSON.parse(localStorage.eobotStore);
		}
		Eobot.exchange();
		Eobot.fontAwesome();
		Eobot.tradingView();
		await Eobot.tradingHistory();
		Eobot.tradeHistoryActions();
		Eobot.addMenus();
		Eobot.divStates();
	},

	exchange: () => {
		$('#ctl00_ContentPlaceHolder1_btnConvert').after("<button id='ext-transation'>Transation</button>");
		$('#ext-transation').after("<button id='ext-mintransation'>Minimum 0.0001 USD</button>");
		$('#ext-transation').click(function(e) {
			e.preventDefault();
			Eobot.onTransation();
		});
		$('#ext-mintransation').click(function(e) {
			e.preventDefault();
			Eobot.minimumTransation();
		})
	},

	tradingHistory: async () => {
		// coin
		const coins = await Eobot.mountCoins();
		const coindiv = `
		<div class="coins coins--close">
			${coins}
		</div>
		`;
		if(Eobot.eobotArr.length) {
			$('#header').after(coindiv);
		}else {
			$('#header').addClass('actived');
		}
		return;
	},

	tradeHistoryActions: () => {
		$(document).on('click','.hidecoin', function() {
			const $coin = $(this).parent();
			const id = $coin.data('id');
			$coin.addClass('coins__item--fadeout');
			Eobot.eobotArr.map(coin => {
				if(coin.id == id){
					coin.status = 1;
				}
			});
			localStorage.eobotStore = JSON.stringify(Eobot.eobotArr);
		});
	},

	addMenus: () => {
		//Menus
		$('#ddmenu ul li.single').after('<li id="ext-openrealtime"><span class="top-heading"><i class="fas fa-chart-line"></i> Realtime Price</span></li>');
		$('#ddmenu ul li.single').after('<li id="ext-opentrading"><span class="top-heading"><i class="fab fa-bitcoin"></i> Trading History</span></li>');

		$(document).on('click','#ext-opentrading', function() {
			const tradingClass = $('.coins').toggleClass('coins--close');
			localStorage.setItem('eobot-trader-tradingHistory', tradingClass[0].className);
		});

		$(document).on('click','#ext-openrealtime', function() {
			const realtimeClass = $('.tradingview-widget-container').toggleClass('tradingview-widget-container--open');
			localStorage.setItem('eobot-trader-realtimeClass', realtimeClass[0].className);
		});
	},

	mountCoins: async () => {
		try{
			//load just enabled
			const filtered = Eobot.eobotArr.filter( coin => coin.status == 0 );
			// extract all simbles from array of objects
			const coinSimbles = filtered.reduce((prev, curr) => [...prev, curr.fromCoin, curr.toCoin],[]);
			coinSimblesNoRedundance = coinSimbles.filter((elem, pos,arr) => arr.indexOf(elem) == pos);
			// get value from coins exchanged and store in an array
			const currentPrice = await Eobot.getCoinPrice(coinSimblesNoRedundance);
			console.log(currentPrice);
			let template ='';
			for (const transation of filtered) {
				const {	fromCoin,
					fromAmount,
					fromAmountPrice,
					fromPrice,
					toCoin,
					toPrice,
					fee,
					toAmount,
					toAmountPrice,
					status,
					id } = transation;
				const fromImg = chrome.extension.getURL(`svg/${fromCoin.toLowerCase()}.svg`);
				const toImg = chrome.extension.getURL(`svg/${toCoin.toLowerCase()}.svg`);

				//calculate if you want exchange back to  initial coin
				const coinbackAmount  = ((toAmount * currentPrice[toCoin]) / currentPrice[fromCoin]);
				const feePercentage = fee / 100;
				const coinbackAmountWithFee = (coinbackAmount - (coinbackAmount * feePercentage)).toFixed(8);
				const profit = coinbackAmountWithFee - parseFloat(fromAmount).toFixed(8);
				const percent = (profit * 100) / fromAmount;
				const direction = percent > 0 ? 'up':'down';

				// calculate if you wanna exchange to USD
				const toUSDnofee = (toAmount * currentPrice[toCoin]);
				const toUSDwithfee = toUSDnofee - (toUSDnofee * feePercentage);
				profitUSD = toUSDwithfee - parseFloat(fromAmountPrice).toFixed(8);
				const percentUSD = (profitUSD * 100) / fromAmountPrice;
				const directionUSD = percentUSD > 0 ? 'up':'down';

				template += `
				<div class="coins__item" data-status="${status}" data-id="${id}">
					<div class="coins__transation">
						<div class="coin coin--from">
							<div class="coin__img"><img  class="coin__icon" src="${fromImg}" alt="${fromCoin}"></div>
							<div class="coin__details">
								<h2 class="coin__title">${fromCoin}</h2>
								<span class="prices prices--amount">${fromCoin} ${fromAmount}</span>
								<span class="prices prices--amountprice"><i class="fas fa-gem prices__icon"></i> $ ${parseFloat(fromAmountPrice).toFixed(8)}</span>
								<span class="prices prices--total"><i class="fas fa-bolt prices__icon"></i> $ ${fromPrice}</span>
							</div>
						</div>
						<div class="coin coin--to">
							<div class="coin__img"><img class="coin__icon" src="${toImg}" alt="${toCoin}"></div>
							<div class="coin__details">
								<h2 class="coin__title">${toCoin}</h2>
								<span class="prices prices--amount">${toCoin} ${toAmount}</span>
								<span class="prices prices--amountprice">$ ${parseFloat(toAmountPrice).toFixed(8)}</span>
								<span class="prices prices--total">$ ${toPrice}</span>
							</div>
						</div>
					</div>
					<div class="coins__profit">
						<div class="coin coin--buyback">
							<h3 class="coin__title coin__title--medium">${toCoin} <span class="coin__to">to</span> ${fromCoin}</h3>
							<div class="percents percents--buyback percents--${direction}"><i class="fas fa-arrow-${direction}"></i> ${percent.toFixed(2)}%</div>
							<span class="prices prices--buybacktotal">${fromCoin} ${coinbackAmountWithFee}</span>
						</div>
						<div class="coin coin--buydolar">
							<h3 class="coin__title coin__title--medium">${toCoin} <span class="coin__to">to</span> USD</h3>
							<div class="percents percents--buydolar percents--${directionUSD}"><i class="fas fa-arrow-${directionUSD}"></i> ${percentUSD.toFixed(2)}%</div>
							<span class="prices prices--buyolartotal">$ ${parseFloat(toUSDwithfee).toFixed(8)}</span>
						</div>
					</div>
					<span class="hidecoin"><i class="fas fa-eye-slash"></i></span>
				</div>
				`;
			}
			return template;
		} catch (error) {
			console.log('Erro nessa B', error)
		}

	},

	calcTransation: async(fromCoin, fromAmount, toCoin) => {
		try{
			const response = await fetch(`https://www.eobot.com/api.aspx?exchangefee=true&convertfrom=${fromCoin}&amount=${fromAmount}&convertto=${toCoin}&json=true`);
			if (response.status === 200) {
				const data = await response.json()
				return data
			} else {
			throw new Error("Unable to get eXAGEM", response)
			}
		} catch (err) {
			console.log('fetch Exchange error:', err);
		}
	},

	minimumTransation: async () => {
		const fromCoin = document.getElementById('ctl00_ContentPlaceHolder1_ddlTypeFrom').value;
		let coinFinal = Eobot.minTransPrice;

		if ( fromCoin !== "USD" ) {
			const coinPrice = await Eobot.getCoinPrice([fromCoin]);
			coinFinal = Eobot.minTransPrice / coinPrice[fromCoin];
		}
		document.querySelector('[name="ctl00$ContentPlaceHolder1$txtConvertFrom"]').value = coinFinal.toFixed(8);
		document.querySelector('[name="ctl00$ContentPlaceHolder1$btnCalculate"]').click();
	},


	fontAwesome: () => {
		let link = $("<link />",{
			rel: "stylesheet",
			type: "text/css",
			href: "https://use.fontawesome.com/releases/v5.3.1/css/all.css"
		  });
		$('head').append(link);
	},

	tradingView: () =>{
		const formCoin = document.getElementById('ctl00_tblTest');
		if(formCoin) {
			$.get(chrome.extension.getURL('tools/trendingview.html'), function(data) {
				$(formCoin).before(data);
			});
		}else {
			console.log('nao carregou trendingview')
		}
	},

	onTransation: async () => {
		// coin simble from
		const fromCoin = document.getElementById('ctl00_ContentPlaceHolder1_ddlTypeFrom').value;
		// coin simble to
		const toCoin = document.getElementById('ctl00_ContentPlaceHolder1_ddlTypeTo').value;

		// coin value
		const fromValue = document.querySelector('[name="ctl00$ContentPlaceHolder1$txtConvertFrom"]').value ;

		//get price without fee
		const tvalueRegex = new RegExp(`.*?(?=${toCoin}|$)`, 'i');
		const transationVal = document.getElementById('ctl00_ContentPlaceHolder1_lblConvertTo').textContent.match(tvalueRegex)[0];
		//get fee percentage
		const transationFee = (document.getElementById('ctl00_ContentPlaceHolder1_lblConvertTo').textContent.match(/-(.*?)%/g) || []).map(val => val.replace(/[\s-%]/g, '')).join();
		//get price with fee
		const twithFeeRegex1 = new RegExp(`=(.*?)${toCoin}`, 'g');
		const twithFeeRegex2 = new RegExp(`[\\s=${toCoin}]`, 'g');
		const transationpricewithFee = (document.getElementById('ctl00_ContentPlaceHolder1_lblConvertTo').textContent.match(twithFeeRegex1) || []).map(val => val.replace(twithFeeRegex2, '')).join()

		const coinPrice = await Eobot.getCoinPrice([fromCoin,toCoin]);

		const profit 			= 10;
		const fromAmountPrice 	= coinPrice[fromCoin] * fromValue;
		const toAmountPrice 	= coinPrice[toCoin] * transationpricewithFee;
		const profitValue		= (fromAmountPrice/ 100) * profit;
		const sellPrice			= (fromAmountPrice/ transationpricewithFee) + profitValue; // cprrigir esta calculando valor menor

		const stuObj = {
			'id': new Date().toLocaleString('pt-BR'),
			'fromCoin':fromCoin,
			'fromAmount':fromValue,
			'fromPrice':coinPrice[fromCoin],
			'fromAmountPrice': parseFloat(fromAmountPrice.toFixed(8)),
			'fee':transationFee,
			'toCoin':toCoin,
			'toPrice':coinPrice[toCoin],
			'toAmount': transationpricewithFee,
			'toAmountPrice': parseFloat(toAmountPrice.toFixed(8)),
			sellPrice,
			'status':0
		};
		if(fromAmountPrice >= Eobot.minTransPrice){
			if (Eobot.selectedIndex === -1) {
				Eobot.eobotArr.push(stuObj);
			} else {
				Eobot.eobotArr.splice(this.selectedIndex, 1, stuObj);
			}
			localStorage.eobotStore = JSON.stringify(Eobot.eobotArr);
			alert('store updated');
			$('#ctl00_ContentPlaceHolder1_btnConvert').click();
		}else {
			alert('minimum: '+Eobot.minTransPrice+'. you tried:'+ fromAmountPrice);
		}

	},

	divStates: () => {
		const tradeHistory = localStorage.getItem('eobot-trader-tradingHistory');
		const RealTime = localStorage.getItem('eobot-trader-realtimeClass');

		$('.coins')[0].className = tradeHistory;
		$('.tradingview-widget-container')[0].className = RealTime;
	},
	/**
	 * Return coin price filtering by coins
	 *
	 * @param {array} [coins=['LTC', 'BTC']]
	 * @returns {object} filtered - coins with price
	 * @memberof Eobot
	 */
	getCoinPrice: async (coins = []) => {
		let response = await fetch('https://www.eobot.com/api.aspx?supportedcoins=true&currency=USD&json=true');
		let data = await response.json();
		const filtered = Object.keys(data)
		.filter(key => coins.includes(key))
		.reduce((obj, key) => {
			obj[key] = data[key].Price || "";
			return obj;
		}, {});

		return filtered;
	}
}

Eobot.init();