var w = 900,
    h = 900,
    rx = w / 2,
    ry = h / 2,
    m0,
    rotate = 0;

var spaceLeftToCenter = ($('.container').width() - w) / 2;
var marginLeft = $('.container').offset().left + spaceLeftToCenter;
var marginTop = 10;

var splines = [];

var cluster = d3.layout.cluster()
    .size([360, ry - 120 - marginTop])
    .sort(function(a, b) { return d3.ascending(a.id, b.id); });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var container = d3.select(".circle-vis")
    .style("height", (w+20) + "px");

var div = d3.select(".circle-vis").insert("div")
    .style("top", "0px")
    .style("left", spaceLeftToCenter + "px")
    .style("width", w + "px")
    .style("height", w + "px")
    .style("position", "absolute")
    .style("-webkit-backface-visibility", "hidden")
    .style("-moz-backface-visibility", "hidden");

// Insert svg into HTML
var svg = div.append("svg:svg")
    .attr("width", w)
    .attr("height", w)
  .append("svg:g")
    .attr("transform", "translate(" + rx + "," + ry + ")");

var generate_visualization = function(rootCitation, citationsLinks){
  svg.selectAll("*").remove();
  var nodes = cluster.nodes(rootCitation);
  var links = citationsLinks;
  var splines = bundle(citationsLinks);
  var path = svg.selectAll("path.link")
      .data(links)
    .enter().append("svg:path")
      .attr("class", function(d) { return "link source-" + d.source.id + " target-" + d.target.id; })
      .attr("d", function(d, i) { return line(splines[i]); });

    svg.selectAll("g.node")
      .data(nodes)
    .enter().append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) { return "node-" + d.id; })
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    .append("svg:text")
      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) {
        var name = d.name;
        // Deixa o titulo do artigo apenas a primeira letra em maiuscula
        name = name.toLowerCase();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (name.length > 15)
          name = name.slice(0,13) + '...';
        return name;
      })
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

  for (var i = nodes.length - 1; i >= 0; i--) {
      var d = nodes[i];
      var hostnameInfo = '<small>'+d.hostname+'</small>';
      var articleLinkElem = '<a href="'+d.link+'"><br/>'+d.title+'</a>';
      var popoverTitle = hostnameInfo + articleLinkElem;
      $('#node-'+d.id+' text').popover({
        html: true,
        content: d.name,
        container: 'body',
        placement: 'auto',
        trigger: 'manual'
      }).on('click', function(){
        var self = $(this);
        self.popover('show');
        setTimeout(function(){self.popover("hide")}, 2000);
      });
    }
};

d3.select(window)
  .on("mousemove", mousemove)
  .on("mouseup", mouseup);

function mouse(e) {
  var point = [e.pageX - rx - marginLeft, e.pageY - ry - marginTop];
  console.log(point, e);
  return point;
}

function mousedown() {
  m0 = mouse(d3.event);
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
    div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
    div.style("-moz-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
  }
}

function mouseup() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

    rotate += dm;
    if (rotate > 360) rotate -= 360;
    else if (rotate < 0) rotate += 360;
    m0 = null;

    div.style("-webkit-transform", null);
    div.style("-moz-transform", null);

    svg
        .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
      .selectAll("g.node text")
        .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
        .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
  }
}

function mouseover(d) {
  svg.selectAll("path.link")
    .classed("opaque", true);

  svg.selectAll("path.link.source-" + d.id)
    .classed("source", true)
    .classed("opaque", false)
    .each(updateNodes("target", true));

  svg.selectAll("path.link.target-" + d.id)
    .classed("target", true)
    .classed("opaque", false)
    .each(updateNodes("source", true));
}

function mouseout(d) {
  svg.selectAll("path.link")
    .classed("opaque", false);

  svg.selectAll("path.link.source-" + d.id)
    .classed("source", false)
    .each(updateNodes("target", false));

  svg.selectAll("path.link.target-" + d.id)
    .classed("target", false)
    .each(updateNodes("source", false));
}

function updateNodes(name, value) {
  return function(d) {
    if (value) this.parentNode.appendChild(this);
    svg.select("#node-" + d[name].id)
       .classed(name, value);
  };
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

var articlesMap = {};

function addArticle(articles, articlePMID, rootCitation) {
    var article = articles[articlePMID];

    if (!articlesMap[articlePMID] && article) {
        var obj = {
            id: articlePMID,
            name: article.year.concat(' - ',article.title),
            citedBy: article.citedby,
            children: [],
            parent: rootCitation
        }

        rootCitation.children.push(obj);

        articlesMap[articlePMID] = obj;
    }
}

// Start
d3.json('/api/citations', function(articles) {
    // Nos vamos guardar os pares de citacoes aqui
    var citationsLinks = [];

    // O D3 precisa de um no raiz, pois é um algoritmo hierarquico
    var rootCitation = {
        name: '',
        children: [],
        parent: null
    }

    for (var PMID in articles) {
        // Pegamos os dados do artigo
        var article = articles[PMID];

        if (article.citedby.length !== 0) {
            addArticle(articles, PMID, rootCitation);

            article.citedby.forEach(function(articleCitedPMID) {
                addArticle(articles, articleCitedPMID, rootCitation);
            });
        }
    }


    for (var PMID in articlesMap) {
        var article = articlesMap[PMID];

        article.citedBy.forEach(function(citedByPMID) {
            if (!articlesMap[citedByPMID]) {
                return;
            }
            citationsLinks.push({
                source: articlesMap[citedByPMID],
                target: articlesMap[PMID]
            });
        });
    }

    generate_visualization(rootCitation, citationsLinks);
});

