interface team {
  id: string,
  city: string,
  colloquial_name: string,
  country: string, 
  full_name: string,
  location: string,
  state: string,
  players: player[]
}

interface player {
  number: number,
  Player: string,
  Pos: string,
  Ht: string,
  Wt: string,
  birthdate: string,
  Exp: number,
  College: string,
  age?: number
}

let width = 300;
let height = 400;
let margins = {top: 60, right: 20, bottom: 30, left: 150};

d3.json("players.json", function(error, data: Array<team>) {
  
  let bdayParser = d3.timeParse("%B %-e %Y");

  data.forEach(function(team) {
    team.players.forEach(function(player) {
      let bday = bdayParser(player.birthdate);
      let now = new Date();

      let age = now.getFullYear() - bday.getFullYear();
      let m = now.getMonth() - bday.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bday.getDate())) age--;

      player.age = age;
    });
  });

  // order data by youngest
  data = data.sort((a, b) => {
    var a_count = d3.sum(a.players.map(d => d.age));
    var b_count = d3.sum(b.players.map(d => d.age));
    return a_count - b_count;
  });

  let age_range = d3.extent(
    data.reduce(function(p, team) { 
      return p.concat(team.players.map(function(player) {
        return player.age; 
      }));
    }, [])
  );

  let svg = d3.select("#svgcontainer")
    .append('svg')
      .attr('width', width + margins.left + margins.right)
      .attr('height', height + margins.top + margins.bottom)
      .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

  var x = d3.scaleLinear()
    .domain(age_range)
    .range([0, width]);

  var y = d3.scaleBand()
    .domain(data.map(d => d.id))
    .rangeRound([0, height]);

  var colors = d3.shuffle(d3.schemeCategory20);

  // svg.append('text')
  //   .attr('text-anchor', 'middle')
  //   .attr('x', width / 2)
  //   .attr('dy', '-1em')
  //   .text(thisCategory.name);
  
  svg.append('g')
    .attr('class', 'xaxis axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  svg.append('g')
    .attr('class', 'yaxis axis')
    .call(d3.axisLeft(y))
    .selectAll('.tick text')
      .call(wrap, margins.left - 10);

  var bars = svg.append('g')
    .attr('class', 'bars');
  bars.selectAll('.bar').data(choices, (d: choice) => d.name)
    .enter()
    .append('rect')
      .attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('width', d => x(d.votes))
      .style('fill', (d,i) => colors[i % colors.length])
      .style('stroke-width', 1)
      .style('stroke', '#333');
  bars.selectAll('text').data(choices, (d: choice) => d.name)
    .enter()
    .append('text')
      .attr('x', d => Math.max(x(d.votes), 0) + 5)
      .attr('dy', '0.33em')
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .style('font-size', 12)
      .style('font-weight', 800)
      .text(d => d.votes);
});


function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        x = text.attr('x'),
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if ((<SVGTSpanElement>tspan.node()).getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }

    // adjusts everything up to center on y-axis tick mark
    text.selectAll('tspan')
      .each(function(d, i) {
        var line = d3.select(this);
        line.attr('dy', (parseFloat(line.attr('dy')) - (lineNumber * lineHeight / 2)) + "em");
      });
  });
}