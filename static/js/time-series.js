$(function () {
    $.getJSON('/api/timeseries?disease='+disease, function (data) {

        final_data = [];
        for (var i in data) {
            final_data.push([Date.parse(i), data[i]]);
        }

        $('#time-series').highcharts('StockChart', {
            chart: {
                zoomType: 'x',
                renderTo: 'time-series'
            },
            title: {
                text: 'Série Temporal'
            },
            subtitle: {
                text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'left',
                x: 120,
                verticalAlign: 'top',
                y: 80,
                floating: true,
                backgroundColor: '#FFFFFF'
            },
            series: [{
                name: 'Total de artigos',
                data: final_data,
                color: '#4572A7',
                dashStyle: 'Solid',
                animation: true
            }]
        });
    });
});