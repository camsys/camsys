function format_dollars(number) {
    var amount = ''+number;
    var pi = amount.indexOf('.');
    if (pi > 0)
        amount = amount.substring(0, pi+3);
    else
        pi = amount.length;
    for (var i=pi-3; i>0; i--) {
        if ((pi-i)%3 === 0)
            amount = amount.substring(0, i) + ',' + amount.substring(i, amount.length);
    }
    return '$'+amount;
}

function csv_to_json(csv, metric) {
    var json_data = {
        System: {
            name: 'System',
            value: 0,
            children: {
                BUS: {
                    name: 'BUS',
                    value: 0,
                    children: {}
                },
                'LIGHT RAIL': {
                    name: 'LIGHT RAIL',
                    value: 0,
                    children: {}
                },
                STREET: {
                    name: 'STREET',
                    value: 0,
                    children: {}
                }
            }
        }
    };
    
    for (var i in csv) {
        var asset = csv[i];
        var size = metric(asset);
        json_data.System.children[asset.Type].children[asset['Complet Vehicle ID # (Serial No.)']] = {
            name: asset['Complet Vehicle ID # (Serial No.)'],
            size: size,
            value: size,
            year: asset.Year
        };
        json_data.System.value += size;
        json_data.System.children[asset.Type].value += size;
    }
    return json_data;
}