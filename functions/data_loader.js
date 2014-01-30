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
    
    return new System(csv);
};