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

function linear_regression(points) {
    var sumx=0, sumy=0, sumx2=0, sumy2=0, sumxy=0, n=points.length;
    for (var i in points) {
        var x = points[i][0],
            y = points[i][1];
        sumx += x;
        sumx2 += (x*x);
        sumy += y;
        sumy2 += (y*y);
        sumxy += (x*y);
    }
    var b = (sumy*sumx2 - sumx*sumxy)/(n*sumx2-sumx*sumx);
    var a = (n*sumxy - sumx*sumy)/(n*sumx2-sumx*sumx);
    
    return [a,b];
}