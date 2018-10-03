    exchangeTo: async (coinFrom, coinAmountFrom, cointTo, coinAmountTo) => {
    	const eobotExchangeStarted = localStorage('eobotExchangeStarted');
    	if (eobotExchangeStarted) {
    		localStorage.setItem('eobotExchangeStarted', false);

    	}
    	//select coin from
    	const selectFrom = document.getElementsById('ctl00$ContentPlaceHolder1$ddlTypeFrom');
    	if(selectFrom) {
    		await Eobot.setExchangeSelected(selectFrom, coinFrom);
    	}

    	//select coin to
    	const selectTo = document.getElementsById('ctl00_ContentPlaceHolder1_ddlTypeTo');
    	if (selectTo) {
    		await Eobot.setExchangeSelected(selectTo, cointTo);
    	}
    	const calcButton = document.getElementById('ctl00_ContentPlaceHolder1_btnCalculate');
    	if (calcButton) {
    		localStorage.setItem('eobotExchangeStarted', true);
    		calcButton.click();
    	}
    },

    setExchangeSelected: (elmnt, value) => {
    	for(var i=0; i < elmnt.options.length; i++)
    	{
    		if(elmnt.options[i].value === value) {
    			elmnt.selectedIndex = i;
    			return true;
    		}
    	}
    },
