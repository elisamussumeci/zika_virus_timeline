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

var selectedArticle = null;

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
        if (name.length > 15)
          name = name.slice(0,13) + '...';
        return name;
      })
      .on("mouseover", function(d) {
        if (!selectedArticle) {
            addColorToArticle(d);
        }
      })
      .on("mouseout", function(d) {
        if (!selectedArticle) {
            removeColorFromArticle(d);
        }
      });

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
        trigger: 'hover'
      }).on('click', function(){
        var self = $(this);
        var PMID = self.parent().attr('id').replace('node-', '');

        if (selectedArticle === PMID) {
            selectedArticle = null;
            removeColorFromArticle({id: PMID});
        } else {
            selectedArticle = PMID;
            addColorToArticle({id: PMID});
        }

        timeline.goToId(PMID);

        self.popover('show');
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

function addColorToArticle(d) {
  if (!articlesMap[d.id]) return;

  svg.selectAll("path.link")
    .classed("opaque", true);

  svg.select("#node-" + d.id)
    .classed("selected", true);

  svg.selectAll("path.link.source-" + d.id)
    .classed("source", true)
    .classed("opaque", false)
    .each(updateNodes("target", true));

  svg.selectAll("path.link.target-" + d.id)
    .classed("target", true)
    .classed("opaque", false)
    .each(updateNodes("source", true));
}

function removeColorFromArticle(d) {
  if (!articlesMap[d.id]) return;

  svg.selectAll("path.link")
    .classed("opaque", false);

  svg.select("#node-" + d.id)
    .classed("selected", false);

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
var articleYears = {};

function addArticle(articles, articlePMID, rootCitation) {
    var article = articles[articlePMID];

    if (!articlesMap[articlePMID] && article) {
        var name = article.title;
        if (article.year) {
            name = article.year + ' - ' + name;
        }

        var year = article.year ? article.year : 0;

        if (!articleYears[year]) {
            var yearObj = {
                id: 'year',
                name: year,
                children: [],
                parent: rootCitation
            }

            rootCitation.children.push(yearObj);
            articleYears[year] = yearObj;
        }

        var obj = {
            id: articlePMID,
            name: name,
            citedBy: article.citedby,
            year: year,
            children: [],
            parent: articleYears[year]
        }

        articlesMap[articlePMID] = obj;
        articleYears[year].children.push(obj);
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

    rootCitation.children.sort(function(a, b) {
        if (parseInt(a.name) > parseInt(b.name)) {
            return 1;
        }

        if (parseInt(a.name) < parseInt(b.name)) {
            return -1;
        }

        return 0;
    })

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

