var load_data = function (csv) {
    
    // perform any necessary data transformations here
    
    /*******************************
        SCHEMA:
        [
            {
                serial: STRING (unique ID)
                type: STRING (type of asset)
                years: INTEGERS ARRAY (years of purchase/replacement)
                prices: INTEGER ARRAY (same length as years, prices of purchases)
                usage: INTEGER (related to ridership)
            },
            {...},...
        ]
        
        see data/sample_data.js
    *******************************/
    
    var assets = Util.clone(csv);
    
    for (var i in assets) {
        assets[i].years = assets[i].years.split(',');
        assets[i].prices = assets[i].prices.split(',');
    }
    
    return new System(assets);
};
