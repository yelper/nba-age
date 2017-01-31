let width = 300;
let height = 1000;
let margins = { top: 30, right: 20, bottom: 50, left: 100 };
d3.json("players.json", function (error, teamData) {
    let bdayParser = d3.timeParse("%B %-e %Y");
    teamData.forEach(function (team) {
        team.players.forEach(function (player) {
            let bday = bdayParser(player.birthdate);
            let now = new Date();
            let yearMS = 1000 * 60 * 60 * 24 * 365.26;
            player.age = (now.getTime() - bday.getTime()) / yearMS;
        });
    });
    // order data by youngest
    teamData = teamData.sort((a, b) => {
        var a_count = d3.sum(a.players.map(d => d.age)) / a.players.length;
        var b_count = d3.sum(b.players.map(d => d.age)) / b.players.length;
        return a_count - b_count;
    });
    let age_range = d3.extent(teamData.reduce(function (p, team) {
        return p.concat(team.players.map(function (player) {
            return player.age;
        }));
    }, []));
    // add a margin
    age_range[0] -= d3.sum(age_range) * 0.02;
    age_range[1] += d3.sum(age_range) * 0.02;
    let svg = d3.select("#svgcontainer")
        .append('svg')
        .attr('width', width + margins.left + margins.right)
        .attr('height', height + margins.top + margins.bottom)
        .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
    let x = d3.scaleLinear()
        .domain(age_range)
        .range([0, width]);
    let y = d3.scaleBand()
        .domain(teamData.map(d => d.id))
        .rangeRound([0, height]);
    let amenities = svg.append('g').attr('class', 'amenities');
    amenities.append('g')
        .attr('class', 'xaxis axis')
        .call(d3.axisTop(x));
    amenities.append('g')
        .attr('class', 'xaxis axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));
    amenities.append('g')
        .attr('class', 'yaxis axis')
        .call(d3.axisLeft(y))
        .selectAll('.tick text')
        .call(wrap, margins.left - 10);
    amenities.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x).tickSize(-height))
        .selectAll('text').remove(); // there's gotta be a better way to get rid of these extra labels...
    let chart = svg.append('g')
        .attr('class', 'teams');
    let teams = chart.selectAll('g.team')
        .data(teamData)
        .enter()
        .append('g')
        .attr('class', 'team')
        .attr('transform', (d, i) => 'translate(0,' + y(d.id) + ')');
    teams.each(function (thisTeam) {
        let thisGroup = d3.select(this);
        thisGroup.append('rect')
            .attr('class', 'background')
            .attr('y', 1)
            .attr('width', width)
            .attr('height', y.bandwidth() - 2)
            .style('fill', d => thisTeam.color)
            .style('fill-opacity', 0.5);
        thisGroup.append('image')
            .attr('xlink:href', d => "img/" + thisTeam.id + ".png")
            .attr('x', -70)
            .attr('y', 5)
            .attr('height', '22px')
            .attr('width', '33px');
        let thisSim = d3.forceSimulation(thisTeam.players)
            .force('x', d3.forceX((d) => x(d.age)).strength(1))
            .force('y', d3.forceY(y.bandwidth() / 2))
            .force('collide', d3.forceCollide(4))
            .stop();
        for (let i = 0; i < 120; ++i)
            thisSim.tick();
        let players = thisGroup.selectAll('g.players').data([0])
            .enter().append('g')
            .attr('class', 'players');
        let playerCell = players.selectAll('g')
            .data(d3.voronoi()
            .extent([[0, 0], [width, y.bandwidth()]])
            .x(d => d.x)
            .y(d => d.y)
            .polygons(thisTeam.players).filter(d => true)).enter()
            .append('g')
            .attr('class', 'player');
        playerCell.append('circle')
            .attr('r', 3)
            .attr('cx', d => d.data.x)
            .attr('cy', d => d.data.y);
        playerCell.append('path')
            .attr('d', d => "M" + d.join("L") + "Z");
        playerCell.append('title')
            .text(d => d.data.Player + " (" + (Math.round(d.data.age * 10) / 10) + ")");
    });
});
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this), words = text.text().split(/\s+/).reverse(), word, line = [], lineNumber = 0, lineHeight = 1.1, // ems
        x = text.attr('x'), y = text.attr("y"), dy = parseFloat(text.attr("dy")), tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
        // adjusts everything up to center on y-axis tick mark
        text.selectAll('tspan')
            .each(function (d, i) {
            var line = d3.select(this);
            line.attr('dy', (parseFloat(line.attr('dy')) - (lineNumber * lineHeight / 2)) + "em");
        });
    });
}
//# sourceMappingURL=app.js.map