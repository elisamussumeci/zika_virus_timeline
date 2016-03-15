
var oldSelectedArticle = null;

timeline.on('change', function(data) {
    if (data.unique_id === 'timeline-de-publicacoes') return;

    if (oldSelectedArticle) {
        removeColorFromArticle({id: oldSelectedArticle});
    }
    oldSelectedArticle = data.unique_id;
    addColorToArticle({id: data.unique_id});
});