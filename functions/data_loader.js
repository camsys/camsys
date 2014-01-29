var load_data = function (csv) {
    var assets = [];
    
    for (var i in csv) {
        assets.push(new Asset($.extend(true, {}, csv[i])));
    }
    
    return new System(assets);
};