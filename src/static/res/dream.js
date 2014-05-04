
function graphStart() {

	var svgcon = document.getElementById("svgcontainer");
	var width = svgcon.offsetWidth,
		height = svgcon.offsetHeight;

	var svg = d3.select("#svgcontainer").append("svg")
		.attr("width", width)
		.attr("height", height)

	var force = d3.layout.force()
		.nodes(d3.values(nodes))
		.links(links)
		.size([width, height])
		.linkDistance(80)
		.charge(-300)
		.gravity(0.02)
		.on("tick", tick)
		.start();

	var link = svg.selectAll(".link")
		.data(force.links())
		.enter().append("line")
		.attr("class", "link");

	var node = svg.selectAll(".node")
		.data(force.nodes())
		.enter().append("g")
		.attr("class", "node")
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		//.on("click", expand)
		.call(force.drag);

	node.append("circle")
		.attr("r", function(d) {
			return (d.type == "key")? 12 : 8;
		});

	node.append("text")
		.attr("x", 12)
		.attr("dy", ".35em")
		.text(function(d) {
			return (d.type == "tag")? d.name : "";
		});

	node.select("circle")
		.style("fill", function(d) { 
			return (d.type == "key")? "#c6dbef" : "#fd8d3c"; 
		});

	function tick() {
		link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}
}

function mouseover() {
	d3.select(this).select("circle").transition()
		.duration(150)
		.attr("r", function(d) {
			return (d.type == "key")? 16 : 12;
		});
}

function mouseout() {
	d3.select(this).select("circle").transition()
		.duration(300)
		.attr("r", function(d) {
			return (d.type == "key")? 12 : 8;
		});
}

function expand(d) {
	if (d.expanded) return;
	d.expanded = true;
	console.log('a');
	d3.json("/app/dream?key="+d.name, function(json) {
		json.forEach(function(dream) {
			var dreamNode = {name: dream.key, type: "key"};
			nodes.push(dreamNode);
			dream.tags.forEach(function(tag) {
				var tagNode = null;
				nodes.forEach(function(n) {
					if (n.name == tag) {
						tagNode = n;
						return;
					}
				});
				if (tagNode === null) {
					tagNode = {name: tag, type: "tag"};
					nodes.push(tagNode);
				}
				links.push({source: dreamNode, target: tagNode});
			});
		});
	});
	console.log('b');
	graphStart();
}

var links = [];
var link;
var nodes = [];
var node;

var dream_id = window.location.pathname.split("/").pop();
expand({name: dream_id});