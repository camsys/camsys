var load_data = function (csv) {
    
    for (var i in csv) {
        csv[i] = new Asset(csv[i]);
    }
    
    return new System(csv);
};