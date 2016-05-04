function getQueryParameters(str) {
  return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
}

var queryString = getQueryParameters();

var search = queryString.search;
var disease = 'zika';

var contextQueryString;
if (search) {
    contextQueryString = '?search=' + search + '&disease=' + disease;
} else {
    contextQueryString = '?disease=' + disease;
}

