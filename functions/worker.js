window = self;

importScripts(
    '../modules/Util.js',
    '../modules/TERM.js',
    '../models/Asset.js',
    '../models/System.js',
    'data_loader.js'
);

function calculate(func, value) {
    var result = data[func](value);
    self.postMessage(result);
}

self.onmessage = function(e) {
    var req = e.data.request;
    if (req === 'load_data') {
        data = load_data(JSON.parse(e.data.csv));
        for (var i in e.data.vars) {
            eval(i+' = '+e.data.vars[i]+';');
        }
    }
    else if (req === 'calculate')
        calculate(e.data.func, e.data.value);
}